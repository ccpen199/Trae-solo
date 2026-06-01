import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

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

const dbPath = path.resolve(__dirname, '..', '..', process.env.SQLITE_PATH || 'data/app.sqlite')
const dbDir = path.dirname(dbPath)
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS repositories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('maven','npm','docker','binary','generic')),
      description TEXT,
      format TEXT NOT NULL DEFAULT 'release' CHECK(format IN ('release','snapshot','mixed')),
      url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS namespaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repository_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
      UNIQUE(repository_id, name)
    );

    CREATE TABLE IF NOT EXISTS artifacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      namespace_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      latest_version TEXT,
      description TEXT,
      download_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
      UNIQUE(namespace_id, name)
    );

    CREATE TABLE IF NOT EXISTS versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      artifact_id INTEGER NOT NULL,
      version TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','validated','released','deprecated','blocked')),
      uploader TEXT NOT NULL,
      build_source TEXT,
      release_notes TEXT,
      signature_verified INTEGER NOT NULL DEFAULT 0,
      scan_status TEXT NOT NULL DEFAULT 'not_scanned' CHECK(scan_status IN ('not_scanned','scanning','passed','failed','warning')),
      vulnerabilities INTEGER NOT NULL DEFAULT 0,
      size_bytes INTEGER NOT NULL DEFAULT 0,
      digest TEXT,
      is_snapshot INTEGER NOT NULL DEFAULT 0,
      downloaded_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      released_at TEXT,
      FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE,
      UNIQUE(artifact_id, version)
    );

    CREATE TABLE IF NOT EXISTS version_dependencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version_id INTEGER NOT NULL,
      dep_name TEXT NOT NULL,
      dep_version TEXT,
      dep_type TEXT,
      FOREIGN KEY (version_id) REFERENCES versions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS referenced_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version_id INTEGER NOT NULL,
      project_name TEXT NOT NULL,
      project_url TEXT,
      FOREIGN KEY (version_id) REFERENCES versions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS deployments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version_id INTEGER NOT NULL,
      environment TEXT NOT NULL,
      deployed_by TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'deployed',
      deployed_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (version_id) REFERENCES versions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repository_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('upload','download','delete','promote','manage')),
      granted INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
      UNIQUE(repository_id, subject, action)
    );

    CREATE TABLE IF NOT EXISTS access_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      scope TEXT NOT NULL,
      expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_used_at TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      actor TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS retention_policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repository_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('snapshot_expiry','low_frequency','size_based','count_based')),
      params TEXT NOT NULL DEFAULT '{}',
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('illegal_delete','abnormal_download','snapshot_expiry','low_frequency')),
      severity TEXT NOT NULL DEFAULT 'warning' CHECK(severity IN ('info','warning','critical')),
      entity_type TEXT,
      entity_id INTEGER,
      message TEXT NOT NULL,
      resolved INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'developer' CHECK(role IN ('admin','developer','tester','release','security','viewer')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
}

initSchema()

function seedData() {
  const repoCount = db.prepare('SELECT COUNT(*) as c FROM repositories').get() as { c: number }
  if (repoCount.c > 0) return

  const repos = [
    { name: 'maven-release', type: 'maven', description: 'Maven 正式发布仓库', format: 'release' },
    { name: 'maven-snapshot', type: 'maven', description: 'Maven 快照仓库', format: 'snapshot' },
    { name: 'npm-release', type: 'npm', description: 'NPM 发布仓库', format: 'release' },
    { name: 'docker-release', type: 'docker', description: 'Docker 镜像仓库', format: 'release' },
    { name: 'binary-release', type: 'binary', description: '二进制制品仓库', format: 'release' },
  ]
  const insRepo = db.prepare('INSERT INTO repositories (name, type, description, format) VALUES (?, ?, ?, ?)')
  const repoIds: Record<string, number> = {}
  for (const r of repos) {
    const info = insRepo.run(r.name, r.type, r.description, r.format)
    repoIds[r.name] = Number(info.lastInsertRowid)
  }

  const insNs = db.prepare('INSERT INTO namespaces (repository_id, name, description) VALUES (?, ?, ?)')
  const mavenNsId = Number(insNs.run(repoIds['maven-release'], 'com.example', '示例公司命名空间').lastInsertRowid)
  const npmNsId = Number(insNs.run(repoIds['npm-release'], '@example', '示例公司 NPM scope').lastInsertRowid)
  const dockerNsId = Number(insNs.run(repoIds['docker-release'], 'library', '官方镜像命名空间').lastInsertRowid)
  const binaryNsId = Number(insNs.run(repoIds['binary-release'], 'tools', '工具类制品命名空间').lastInsertRowid)

  const insArt = db.prepare('INSERT INTO artifacts (namespace_id, name, description) VALUES (?, ?, ?)')
  const mvnArtId = Number(insArt.run(mavenNsId, 'user-service', '用户服务 Maven 制品').lastInsertRowid)
  const npmArtId = Number(insArt.run(npmNsId, 'design-system', '前端设计系统组件包').lastInsertRowid)
  const dockerArtId = Number(insArt.run(dockerNsId, 'api-gateway', 'API 网关 Docker 镜像').lastInsertRowid)
  const binaryArtId = Number(insArt.run(binaryNsId, 'deploy-tool', '部署工具二进制包').lastInsertRowid)

  const insVer = db.prepare(
    'INSERT INTO versions (artifact_id, version, status, uploader, build_source, release_notes, signature_verified, scan_status, vulnerabilities, size_bytes, is_snapshot, released_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )
  insVer.run(mvnArtId, '1.0.0', 'released', 'alice', 'ci-build-12345', '初始正式版本', 1, 'passed', 0, 2457600, 0, '2026-01-15 10:30:00')
  insVer.run(mvnArtId, '1.1.0', 'released', 'bob', 'ci-build-12400', '新增用户分组功能', 1, 'passed', 1, 2580480, 0, '2026-03-01 14:22:00')
  insVer.run(mvnArtId, '2.0.0-SNAPSHOT', 'validated', 'charlie', 'ci-build-12500', '大版本重构开发中', 0, 'warning', 2, 3145728, 1, null)
  insVer.run(npmArtId, '2.3.0', 'released', 'diana', 'npm-publish-88', '升级 React 版本至 18', 1, 'passed', 0, 524288, 0, '2026-02-20 09:15:00')
  insVer.run(npmArtId, '2.4.0', 'pending', 'diana', 'npm-publish-99', '新增暗模式组件', 0, 'scanning', 0, 614400, 0, null)
  insVer.run(dockerArtId, '1.5.0', 'released', 'eve', 'docker-build-55', '增加限流和熔断', 1, 'passed', 0, 157286400, 0, '2026-04-01 16:00:00')
  insVer.run(binaryArtId, '0.9.0', 'released', 'frank', 'manual-upload', '首个可用版本', 1, 'passed', 0, 10485760, 0, '2026-01-05 08:00:00')

  const insDep = db.prepare('INSERT INTO version_dependencies (version_id, dep_name, dep_version, dep_type) VALUES (?, ?, ?, ?)')
  insDep.run(1, 'spring-core', '6.1.0', 'compile')
  insDep.run(1, 'spring-web', '6.1.0', 'compile')
  insDep.run(2, 'react', '18.3.1', 'runtime')
  insDep.run(2, 'antd', '5.20.0', 'runtime')

  const insDeploy = db.prepare('INSERT INTO deployments (version_id, environment, deployed_by, status, deployed_at) VALUES (?, ?, ?, ?, ?)')
  insDeploy.run(1, 'production', 'alice', 'deployed', '2026-01-15 10:35:00')
  insDeploy.run(2, 'staging', 'bob', 'deployed', '2026-02-28 11:00:00')
  insDeploy.run(2, 'production', 'bob', 'deployed', '2026-03-01 14:30:00')
  insDeploy.run(5, 'production', 'eve', 'deployed', '2026-04-01 16:10:00')

  const insPerm = db.prepare('INSERT INTO permissions (repository_id, subject, action) VALUES (?, ?, ?)')
  for (const repoId of Object.values(repoIds)) {
    insPerm.run(repoId, 'admin', 'manage')
    insPerm.run(repoId, 'developer', 'upload')
    insPerm.run(repoId, 'developer', 'download')
    insPerm.run(repoId, 'tester', 'download')
    insPerm.run(repoId, 'release', 'promote')
    insPerm.run(repoId, 'release', 'delete')
  }

  const insUser = db.prepare('INSERT INTO users (username, role) VALUES (?, ?)')
  insUser.run('admin', 'admin')
  insUser.run('alice', 'developer')
  insUser.run('bob', 'release')
  insUser.run('charlie', 'tester')
  insUser.run('diana', 'developer')
  insUser.run('eve', 'security')
  insUser.run('frank', 'viewer')

  const insToken = db.prepare('INSERT INTO access_tokens (token, name, subject, scope, expires_at) VALUES (?, ?, ?, ?, ?)')
  insToken.run('tk-prod-001', '生产部署 Token', 'ci-bot', 'docker-release:download', '2026-12-31 23:59:59')
  insToken.run('tk-dev-002', '开发测试 Token', 'test-bot', 'maven-release:download,maven-snapshot:download', '2026-06-30 23:59:59')

  const insPolicy = db.prepare('INSERT INTO retention_policies (repository_id, name, type, params) VALUES (?, ?, ?, ?)')
  insPolicy.run(repoIds['maven-snapshot'], '快照30天过期', 'snapshot_expiry', JSON.stringify({ days: 30 }))
  insPolicy.run(repoIds['maven-release'], '低频制品90天清理', 'low_frequency', JSON.stringify({ days: 90 }))
  insPolicy.run(repoIds['docker-release'], '镜像保留最近20版本', 'count_based', JSON.stringify({ count: 20 }))

  const insAlert = db.prepare('INSERT INTO alerts (type, severity, entity_type, entity_id, message) VALUES (?, ?, ?, ?, ?)')
  insAlert.run('illegal_delete', 'critical', 'artifact', mvnArtId, '检测到非授权用户尝试删除 user-service:1.0.0')
  insAlert.run('abnormal_download', 'warning', 'version', 1, 'user-service:1.0.0 在1小时内被下载超过50次')

  const insAudit = db.prepare('INSERT INTO audit_logs (action, entity_type, entity_id, actor, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
  insAudit.run('UPLOAD', 'version', 1, 'alice', '上传 user-service:1.0.0', '10.0.1.5')
  insAudit.run('PROMOTE', 'version', 1, 'bob', '将 user-service:1.0.0 从 validated 晋级到 released', '10.0.1.5')
  insAudit.run('DOWNLOAD', 'version', 2, 'charlie', '下载 user-service:1.1.0', '10.0.2.8')
}

seedData()

export default db