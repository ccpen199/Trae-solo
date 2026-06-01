import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import db from './db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '..', '.env')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const m = line.match(/^(\w+)=(.*)$/)
      if (m) process.env[m[1]] = m[2]
    }
  }
}
loadEnv()

const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || '53402', 10)
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '43402', 10)

const app = express()
app.use(express.json({ limit: '10mb' }))
app.use(cors({
  origin: `http://127.0.0.1:${FRONTEND_PORT}`,
  credentials: true,
}))

function audit(action: string, entity_type: string, entity_id: number | null, actor: string, details: string, ip: string) {
  db.prepare('INSERT INTO audit_logs (action, entity_type, entity_id, actor, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
    .run(action, entity_type, entity_id, actor, details, ip)
}

function getClientIp(req: express.Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1'
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), port: BACKEND_PORT })
})

// ===== Repositories =====
app.get('/api/repositories', (_req, res) => {
  const rows = db.prepare(`
    SELECT r.*,
      (SELECT COUNT(*) FROM namespaces n WHERE n.repository_id = r.id) as namespace_count,
      (SELECT COUNT(*) FROM namespaces n JOIN artifacts a ON a.namespace_id = n.id WHERE n.repository_id = r.id) as artifact_count
    FROM repositories r ORDER BY r.created_at DESC
  `).all()
  res.json(rows)
})

app.get('/api/repositories/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM repositories WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: '仓库不存在' })
  res.json(row)
})

app.post('/api/repositories', (req, res) => {
  const { name, type, description, format } = req.body
  if (!name || !type) return res.status(400).json({ error: '名称和类型必填' })
  const validTypes = ['maven', 'npm', 'docker', 'binary', 'generic']
  if (!validTypes.includes(type)) return res.status(400).json({ error: '类型不合法' })
  const validFormats = ['release', 'snapshot', 'mixed']
  const fmt = validFormats.includes(format) ? format : 'release'
  const url = `http://127.0.0.1:${BACKEND_PORT}/${name}`
  try {
    const info = db.prepare('INSERT INTO repositories (name, type, description, format, url) VALUES (?, ?, ?, ?, ?)').run(name, type, description || '', fmt, url)
    audit('CREATE_REPO', 'repository', Number(info.lastInsertRowid), 'admin', `创建仓库 ${name}`, getClientIp(req))
    res.status(201).json({ id: info.lastInsertRowid })
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) return res.status(409).json({ error: '仓库名称已存在' })
    res.status(400).json({ error: e.message })
  }
})

app.delete('/api/repositories/:id', (req, res) => {
  const repo = db.prepare('SELECT * FROM repositories WHERE id = ?').get(req.params.id)
  if (!repo) return res.status(404).json({ error: '仓库不存在' })
  db.prepare('DELETE FROM repositories WHERE id = ?').run(req.params.id)
  audit('DELETE_REPO', 'repository', Number(req.params.id), 'admin', `删除仓库 ${repo.name}`, getClientIp(req))
  res.json({ ok: true })
})

// ===== Namespaces =====
app.get('/api/repositories/:repoId/namespaces', (req, res) => {
  const rows = db.prepare(`
    SELECT n.*,
      (SELECT COUNT(*) FROM artifacts a WHERE a.namespace_id = n.id) as artifact_count
    FROM namespaces n WHERE n.repository_id = ? ORDER BY n.name
  `).all(req.params.repoId)
  res.json(rows)
})

app.post('/api/repositories/:repoId/namespaces', (req, res) => {
  const { name, description } = req.body
  if (!name) return res.status(400).json({ error: '命名空间名称必填' })
  try {
    const info = db.prepare('INSERT INTO namespaces (repository_id, name, description) VALUES (?, ?, ?)').run(req.params.repoId, name, description || '')
    audit('CREATE_NAMESPACE', 'namespace', Number(info.lastInsertRowid), 'admin', `创建命名空间 ${name}`, getClientIp(req))
    res.status(201).json({ id: info.lastInsertRowid })
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) return res.status(409).json({ error: '该仓库下已存在同名命名空间' })
    res.status(400).json({ error: e.message })
  }
})

// ===== Artifacts =====
app.get('/api/artifacts', (req, res) => {
  const { namespace_id, q } = req.query
  let sql = `
    SELECT a.*, n.name as namespace_name, r.name as repo_name, r.type as repo_type
    FROM artifacts a
    JOIN namespaces n ON n.id = a.namespace_id
    JOIN repositories r ON r.id = n.repository_id
  `
  const params: any[] = []
  if (namespace_id) { sql += ' WHERE n.id = ?'; params.push(namespace_id) }
  if (q) { sql += (params.length ? ' AND' : ' WHERE') + ' (a.name LIKE ? OR a.description LIKE ?)'; params.push(`%${q}%`, `%${q}%`) }
  sql += ' ORDER BY a.updated_at DESC'
  const rows = db.prepare(sql).all(...params)
  res.json(rows)
})

app.get('/api/artifacts/:id', (req, res) => {
  const row = db.prepare(`
    SELECT a.*, n.name as namespace_name, n.id as namespace_id, r.name as repo_name, r.type as repo_type, r.id as repo_id
    FROM artifacts a
    JOIN namespaces n ON n.id = a.namespace_id
    JOIN repositories r ON r.id = n.repository_id
    WHERE a.id = ?
  `).get(req.params.id)
  if (!row) return res.status(404).json({ error: '制品不存在' })
  res.json(row)
})

// ===== Versions =====
app.get('/api/artifacts/:artifactId/versions', (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM versions WHERE artifact_id = ? ORDER BY created_at DESC
  `).all(req.params.artifactId)
  res.json(rows)
})

app.get('/api/versions/:id', (req, res) => {
  const v = db.prepare(`
    SELECT v.*, a.name as artifact_name, n.name as namespace_name, r.name as repo_name, r.type as repo_type
    FROM versions v
    JOIN artifacts a ON a.id = v.artifact_id
    JOIN namespaces n ON n.id = a.namespace_id
    JOIN repositories r ON r.id = n.repository_id
    WHERE v.id = ?
  `).get(req.params.id)
  if (!v) return res.status(404).json({ error: '版本不存在' })
  const deps = db.prepare('SELECT * FROM version_dependencies WHERE version_id = ?').all(req.params.id)
  const refs = db.prepare('SELECT * FROM referenced_projects WHERE version_id = ?').all(req.params.id)
  const deploys = db.prepare('SELECT * FROM deployments WHERE version_id = ? ORDER BY deployed_at DESC').all(req.params.id)
  res.json({ ...v, dependencies: deps, referenced_projects: refs, deployments: deploys })
})

// ===== Upload Validation & Upload =====
app.post('/api/upload/validate', (req, res) => {
  const { namespace, artifactName, version, uploader, buildSource, releaseNotes, signature, scanResult } = req.body
  const errors: string[] = []

  if (!namespace || !artifactName || !version) {
    errors.push('命名空间、制品名和版本号必填')
  }

  const verPattern = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/
  if (version && !verPattern.test(version)) {
    errors.push('版本号格式错误，需为 x.y.z 或 x.y.z-SNAPSHOT 等形式')
  }

  const isSnapshot = version?.toUpperCase().includes('SNAPSHOT')

  if (version) {
    const exists = db.prepare(`
      SELECT v.*, a.name as artifact_name, n.name as ns_name
      FROM versions v
      JOIN artifacts a ON a.id = v.artifact_id
      JOIN namespaces n ON n.id = a.namespace_id
      WHERE a.name = ? AND n.name = ? AND v.version = ?
    `).get(artifactName, namespace, version)
    if (exists && !isSnapshot) {
      errors.push(`版本 ${namespace}/${artifactName}:${version} 已存在，禁止重复发布正式版本`)
    }
  }

  if (!signature || !signature.verified) {
    errors.push('制品签名未通过校验')
  }

  if (scanResult && scanResult.status === 'failed') {
    errors.push(`安全扫描失败: ${scanResult.summary || '发现高危漏洞'}`)
  }
  if (scanResult && scanResult.status === 'warning' && scanResult.critical > 0) {
    errors.push(`安全扫描告警: 存在 ${scanResult.critical} 个高危漏洞`)
  }

  if (!releaseNotes || releaseNotes.trim().length < 5) {
    errors.push('发布说明至少需要5个字符')
  }

  if (!buildSource) {
    errors.push('缺少构建来源信息 (CI 构建号或 Git Commit)')
  }

  if (errors.length > 0) {
    return res.status(200).json({ passed: false, errors })
  }

  res.json({
    passed: true,
    warnings: [],
    suggestions: isSnapshot ? ['快照版本将受快照过期策略约束'] : ['正式版本发布后不可覆盖'],
  })
})

app.post('/api/upload', (req, res) => {
  const { namespace, artifactName, version, uploader, buildSource, releaseNotes, sizeBytes, digest, scanResult, dependencies, referencedProjects } = req.body

  const ns = db.prepare('SELECT * FROM namespaces WHERE name = ?').get(namespace)
  if (!ns) return res.status(400).json({ error: `命名空间 ${namespace} 不存在` })

  let artifact = db.prepare('SELECT * FROM artifacts WHERE namespace_id = ? AND name = ?').get(ns.id, artifactName)
  let artifactId: number
  if (!artifact) {
    const info = db.prepare('INSERT INTO artifacts (namespace_id, name, description) VALUES (?, ?, ?)').run(ns.id, artifactName, '')
    artifactId = Number(info.lastInsertRowid)
  } else {
    artifactId = artifact.id
  }

  const isSnapshot = version.toUpperCase().includes('SNAPSHOT')
  const scanStatus = scanResult?.status || 'not_scanned'
  const vulCount = scanResult?.critical + scanResult?.high + scanResult?.medium || 0

  try {
    const verInfo = db.prepare(`
      INSERT INTO versions (artifact_id, version, status, uploader, build_source, release_notes,
        signature_verified, scan_status, vulnerabilities, size_bytes, digest, is_snapshot, released_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
    `).run(
      artifactId, version, 'pending', uploader || 'anonymous', buildSource || '',
      releaseNotes || '', scanStatus, vulCount, sizeBytes || 0, digest || '', isSnapshot ? 1 : 0, null
    )
    const versionId = Number(verInfo.lastInsertRowid)

    if (dependencies?.length) {
      const insDep = db.prepare('INSERT INTO version_dependencies (version_id, dep_name, dep_version, dep_type) VALUES (?, ?, ?, ?)')
      for (const d of dependencies) insDep.run(versionId, d.name, d.version || '', d.type || 'compile')
    }
    if (referencedProjects?.length) {
      const insRef = db.prepare('INSERT INTO referenced_projects (version_id, project_name, project_url) VALUES (?, ?, ?)')
      for (const r of referencedProjects) insRef.run(versionId, r.name, r.url || '')
    }

    audit('UPLOAD', 'version', versionId, uploader || 'anonymous', `上传 ${namespace}/${artifactName}:${version}`, getClientIp(req))
    db.prepare('UPDATE artifacts SET latest_version = ?, updated_at = datetime(\'now\') WHERE id = ?').run(version, artifactId)
    res.status(201).json({ id: versionId, artifactId, status: 'pending' })
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) return res.status(409).json({ error: '该版本已存在' })
    res.status(400).json({ error: e.message })
  }
})

// ===== Version Status Promotion =====
app.post('/api/versions/:id/promote', (req, res) => {
  const { status } = req.body
  const validStatuses = ['validated', 'released', 'deprecated', 'blocked']
  if (!validStatuses.includes(status)) return res.status(400).json({ error: '状态不合法' })
  const v = db.prepare('SELECT * FROM versions WHERE id = ?').get(req.params.id)
  if (!v) return res.status(404).json({ error: '版本不存在' })
  if (v.status === 'released' && status === 'released') return res.status(400).json({ error: '已是 released 状态' })
  if (status === 'released') {
    db.prepare("UPDATE versions SET status = 'released', released_at = datetime('now') WHERE id = ?").run(req.params.id)
  } else {
    db.prepare('UPDATE versions SET status = ? WHERE id = ?').run(status, req.params.id)
  }
  audit('PROMOTE', 'version', Number(req.params.id), 'admin', `将版本状态从 ${v.status} 变更为 ${status}`, getClientIp(req))
  res.json({ ok: true })
})

// ===== Download Record =====
app.post('/api/versions/:id/download', (req, res) => {
  const { downloader } = req.body
  db.prepare('UPDATE versions SET downloaded_count = downloaded_count + 1 WHERE id = ?').run(req.params.id)
  const v = db.prepare('SELECT artifact_id FROM versions WHERE id = ?').get(req.params.id)
  if (v) db.prepare('UPDATE artifacts SET download_count = download_count + 1 WHERE id = ?').run(v.artifact_id)
  audit('DOWNLOAD', 'version', Number(req.params.id), downloader || 'anonymous', '下载制品', getClientIp(req))
  res.json({ ok: true })
})

// ===== Permissions =====
app.get('/api/permissions', (req, res) => {
  const { repoId } = req.query
  let sql = `SELECT p.*, r.name as repo_name FROM permissions p JOIN repositories r ON r.id = p.repository_id`
  const params: any[] = []
  if (repoId) { sql += ' WHERE r.id = ?'; params.push(repoId) }
  sql += ' ORDER BY r.name, p.subject, p.action'
  res.json(db.prepare(sql).all(...params))
})

app.post('/api/permissions', (req, res) => {
  const { repoId, subject, action } = req.body
  if (!repoId || !subject || !action) return res.status(400).json({ error: '仓库、主体和操作类型必填' })
  try {
    const info = db.prepare('INSERT INTO permissions (repository_id, subject, action) VALUES (?, ?, ?)').run(repoId, subject, action)
    audit('GRANT_PERMISSION', 'permission', Number(info.lastInsertRowid), 'admin', `授予 ${subject} 在仓库#${repoId} 的 ${action} 权限`, getClientIp(req))
    res.status(201).json({ id: info.lastInsertRowid })
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) return res.status(409).json({ error: '该权限已存在' })
    res.status(400).json({ error: e.message })
  }
})

app.delete('/api/permissions/:id', (req, res) => {
  db.prepare('DELETE FROM permissions WHERE id = ?').run(req.params.id)
  audit('REVOKE_PERMISSION', 'permission', Number(req.params.id), 'admin', '撤销权限', getClientIp(req))
  res.json({ ok: true })
})

// ===== Access Tokens =====
app.get('/api/tokens', (_req, res) => {
  res.json(db.prepare('SELECT * FROM access_tokens ORDER BY created_at DESC').all())
})

app.post('/api/tokens', (req, res) => {
  const { name, subject, scope, expiresAt } = req.body
  const token = 'tk-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
  try {
    const info = db.prepare('INSERT INTO access_tokens (token, name, subject, scope, expires_at) VALUES (?, ?, ?, ?, ?)').run(token, name, subject, scope, expiresAt || null)
    audit('CREATE_TOKEN', 'token', Number(info.lastInsertRowid), 'admin', `创建 Token ${name}`, getClientIp(req))
    res.status(201).json({ id: info.lastInsertRowid, token })
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

app.delete('/api/tokens/:id', (req, res) => {
  db.prepare('DELETE FROM access_tokens WHERE id = ?').run(req.params.id)
  audit('DELETE_TOKEN', 'token', Number(req.params.id), 'admin', '删除 Token', getClientIp(req))
  res.json({ ok: true })
})

// ===== Users =====
app.get('/api/users', (_req, res) => {
  res.json(db.prepare('SELECT * FROM users ORDER BY username').all())
})

// ===== Audit Logs =====
app.get('/api/audit-logs', (req, res) => {
  const { action, entityType, limit } = req.query
  let sql = 'SELECT * FROM audit_logs'
  const params: any[] = []
  const conds: string[] = []
  if (action) { conds.push('action = ?'); params.push(action) }
  if (entityType) { conds.push('entity_type = ?'); params.push(entityType) }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ')
  sql += ' ORDER BY created_at DESC LIMIT ?'
  params.push(parseInt(limit as string) || 100)
  res.json(db.prepare(sql).all(...params))
})

// ===== Retention Policies =====
app.get('/api/retention-policies', (_req, res) => {
  res.json(db.prepare(`
    SELECT rp.*, r.name as repo_name
    FROM retention_policies rp
    JOIN repositories r ON r.id = rp.repository_id
    ORDER BY rp.created_at DESC
  `).all())
})

app.post('/api/retention-policies', (req, res) => {
  const { repoId, name, type, params } = req.body
  const info = db.prepare('INSERT INTO retention_policies (repository_id, name, type, params) VALUES (?, ?, ?, ?)').run(repoId, name, type, JSON.stringify(params || {}))
  audit('CREATE_POLICY', 'retention_policy', Number(info.lastInsertRowid), 'admin', `创建清理策略 ${name}`, getClientIp(req))
  res.status(201).json({ id: info.lastInsertRowid })
})

app.post('/api/retention-policies/:id/toggle', (req, res) => {
  const p = db.prepare('SELECT * FROM retention_policies WHERE id = ?').get(req.params.id)
  if (!p) return res.status(404).json({ error: '策略不存在' })
  db.prepare('UPDATE retention_policies SET enabled = 1 - enabled WHERE id = ?').run(req.params.id)
  audit('TOGGLE_POLICY', 'retention_policy', Number(req.params.id), 'admin', `切换策略状态`, getClientIp(req))
  res.json({ ok: true })
})

app.delete('/api/retention-policies/:id', (req, res) => {
  db.prepare('DELETE FROM retention_policies WHERE id = ?').run(req.params.id)
  audit('DELETE_POLICY', 'retention_policy', Number(req.params.id), 'admin', '删除清理策略', getClientIp(req))
  res.json({ ok: true })
})

// ===== Alerts =====
app.get('/api/alerts', (_req, res) => {
  res.json(db.prepare('SELECT * FROM alerts ORDER BY created_at DESC LIMIT 50').all())
})

app.post('/api/alerts/:id/resolve', (req, res) => {
  db.prepare('UPDATE alerts SET resolved = 1 WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// ===== Cleanup (execute retention) =====
app.post('/api/cleanup/execute', (req, res) => {
  const { policyId } = req.body
  const policy = db.prepare('SELECT * FROM retention_policies WHERE id = ? AND enabled = 1').get(policyId)
  if (!policy) return res.status(404).json({ error: '策略不存在或已禁用' })

  const params = JSON.parse(policy.params || '{}')
  let cleaned = 0

  if (policy.type === 'snapshot_expiry') {
    const days = params.days || 30
    const rows = db.prepare(`
      SELECT v.id FROM versions v
      JOIN artifacts a ON a.id = v.artifact_id
      JOIN namespaces n ON n.id = a.namespace_id
      WHERE n.repository_id = ? AND v.is_snapshot = 1 AND v.created_at < datetime('now', ?)
    `).all(policy.repository_id, `-${days} days`) as { id: number }[]
    for (const r of rows) {
      db.prepare('DELETE FROM versions WHERE id = ?').run(r.id)
      cleaned++
    }
  } else if (policy.type === 'low_frequency') {
    const days = params.days || 90
    const rows = db.prepare(`
      SELECT v.id FROM versions v
      JOIN artifacts a ON a.id = v.artifact_id
      JOIN namespaces n ON n.id = a.namespace_id
      WHERE n.repository_id = ? AND v.downloaded_count = 0 AND v.created_at < datetime('now', ?)
    `).all(policy.repository_id, `-${days} days`) as { id: number }[]
    for (const r of rows) {
      db.prepare('DELETE FROM versions WHERE id = ?').run(r.id)
      cleaned++
    }
  } else if (policy.type === 'count_based') {
    const keepCount = params.count || 20
    const rows = db.prepare(`
      SELECT v.id FROM versions v
      JOIN artifacts a ON a.id = v.artifact_id
      JOIN namespaces n ON n.id = a.namespace_id
      WHERE n.repository_id = ?
      ORDER BY v.created_at DESC
      LIMIT -1 OFFSET ?
    `).all(policy.repository_id, keepCount) as { id: number }[]
    for (const r of rows) {
      db.prepare('DELETE FROM versions WHERE id = ?').run(r.id)
      cleaned++
    }
  }

  audit('CLEANUP_EXECUTE', 'retention_policy', Number(policyId), 'admin', `执行清理策略 ${policy.name}，清理 ${cleaned} 个版本`, getClientIp(req))
  res.json({ cleaned, policy: policy.name })
})

// ===== Stats =====
app.get('/api/stats/overview', (_req, res) => {
  const repoCount = db.prepare('SELECT COUNT(*) as c FROM repositories').get() as { c: number }
  const artifactCount = db.prepare('SELECT COUNT(*) as c FROM artifacts').get() as { c: number }
  const versionCount = db.prepare('SELECT COUNT(*) as c FROM versions').get() as { c: number }
  const releasedCount = db.prepare("SELECT COUNT(*) as c FROM versions WHERE status = 'released'").get() as { c: number }
  const totalDownloads = db.prepare('SELECT SUM(download_count) as s FROM artifacts').get() as { s: number }
  const alertCount = db.prepare('SELECT COUNT(*) as c FROM alerts WHERE resolved = 0').get() as { c: number }
  const recentUploads = db.prepare("SELECT COUNT(*) as c FROM versions WHERE created_at > datetime('now','-7 days')").get() as { c: number }
  res.json({
    repositoryCount: repoCount.c,
    artifactCount: artifactCount.c,
    versionCount: versionCount.c,
    releasedCount: releasedCount.c,
    totalDownloads: totalDownloads.s || 0,
    activeAlerts: alertCount.c,
    recentUploads: recentUploads.c,
  })
})

// ===== Repository Endpoint Info Page =====
app.get('/:repoName', (req, res) => {
  const repo = db.prepare('SELECT * FROM repositories WHERE name = ?').get(req.params.repoName)
  if (!repo) {
    return res.status(404).send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>404 - 制品仓库</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.card{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:32px;text-align:center;max-width:480px}
h1{margin:0 0 12px;font-size:24px}p{margin:8px 0;color:#94a3b8}a{color:#60a5fa;text-decoration:none}</style>
</head><body><div class="card"><h1>404</h1><p>仓库 "${req.params.repoName}" 不存在</p>
<p><a href="http://127.0.0.1:43402/repositories">返回仓库管理 →</a></p></div></body></html>
    `)
  }
  const typeLabels: Record<string, string> = { maven: 'Maven', npm: 'NPM', docker: 'Docker', binary: 'Binary', generic: 'Generic' }
  const type = typeLabels[repo.type] || repo.type
  res.send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${repo.name} - 制品仓库</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px; max-width: 560px; width: 100%; }
    h1 { margin: 0 0 8px; font-size: 22px; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; margin: 8px 0 16px; }
    .badge-maven { background: #7c3aed; color: #ede9fe; }
    .badge-npm { background: #dc2626; color: #fee2e2; }
    .badge-docker { background: #2563eb; color: #dbeafe; }
    .badge-binary { background: #059669; color: #d1fae5; }
    .badge-generic { background: #64748b; color: #e2e8f0; }
    .info { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 13px; line-height: 1.6; }
    .code { font-family: 'SF Mono', Monaco, Menlo, monospace; font-size: 12px; background: #020617; padding: 12px; border-radius: 6px; overflow-x: auto; margin: 8px 0; }
    .label { color: #94a3b8; font-size: 12px; margin-bottom: 4px; }
    a { color: #60a5fa; text-decoration: none; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
    .stat { text-align: center; padding: 12px; background: #0f172a; border-radius: 8px; }
    .stat-value { font-size: 24px; font-weight: 700; }
    .stat-label { font-size: 12px; color: #64748b; margin-top: 4px; }
    .header { display: flex; align-items: center; justify-content: space-between; }
    .note { font-size: 12px; color: #64748b; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <h1>${repo.name}</h1>
        <span class="badge badge-${repo.type}">${type}</span>
      </div>
    </div>
    <p style="color:#94a3b8;margin:0 0 16px">${repo.description || '内部制品仓库'}</p>
    
    <div class="info">
      <div class="label">📡 仓库地址 (用于配置)</div>
      <div class="code">http://127.0.0.1:${BACKEND_PORT}/${repo.name}</div>
      
      ${repo.type === 'maven' ? `
      <div class="label" style="margin-top:16px">Maven settings.xml 配置:</div>
      <div class="code">&lt;repository&gt;
  &lt;id&gt;${repo.name}&lt;/id&gt;
  &lt;url&gt;http://127.0.0.1:${BACKEND_PORT}/${repo.name}&lt;/url&gt;
&lt;/repository&gt;</div>` : ''}
      
      ${repo.type === 'npm' ? `
      <div class="label" style="margin-top:16px">NPM Registry 配置:</div>
      <div class="code">npm config set @example:registry http://127.0.0.1:${BACKEND_PORT}/${repo.name}</div>` : ''}
      
      ${repo.type === 'docker' ? `
      <div class="label" style="margin-top:16px">Docker 镜像拉取:</div>
      <div class="code">docker pull 127.0.0.1:${BACKEND_PORT}/library/&lt;image&gt;:&lt;tag&gt;</div>` : ''}
    </div>

    <p style="text-align:center">
      <a href="http://127.0.0.1:43402/repositories">← 返回仓库管理</a>
    </p>
    <p class="note" style="text-align:center">
      ℹ️ 此为演示系统配置页，实际生产环境需对接真实的 Maven/Nexus/Harbor 等仓库服务
    </p>
  </div>
</body>
</html>
  `)
})

// ===== API 404 =====
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API 路径不存在' })
})

// ===== Root redirect =====
app.get('/', (_req, res) => {
  res.redirect('http://127.0.0.1:43402/')
})

app.listen(BACKEND_PORT, '127.0.0.1', () => {
  console.log(`Artifact Registry backend running on http://127.0.0.1:${BACKEND_PORT}`)
})