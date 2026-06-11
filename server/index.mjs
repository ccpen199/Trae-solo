import { createServer } from 'node:http'
import { DatabaseSync } from 'node:sqlite'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')

function loadProjectEnv() {
  const envPath = resolve(projectRoot, '.env')
  if (!existsSync(envPath)) return

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    const rawValue = trimmed.slice(separatorIndex + 1).trim()
    const value = rawValue.replace(/^['"]|['"]$/g, '')
    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

loadProjectEnv()

function readEnvValue(name, fallback) {
  return process.env[name] || fallback
}

const host = readEnvValue('HOST', '127.0.0.1')
const port = Number(readEnvValue('BACKEND_PORT', '59154'))
const dbPath = resolve(projectRoot, readEnvValue('SQLITE_PATH', './data/app.sqlite'))

mkdirSync(dirname(dbPath), { recursive: true })

const db = new DatabaseSync(dbPath)
db.exec(`
  CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS task_snapshot (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    status TEXT NOT NULL,
    heat_score INTEGER NOT NULL
  );
`)

const seedTasks = [
  ['T001', '电商平台用户满意度问卷填写', '问卷调查', 8, 'open', 92],
  ['T002', '餐厅菜品图片标注分类', '数据录入', 35, 'open', 87],
  ['T003', '短视频内容合规审核', '内容审核', 60, 'open', 85],
  ['T005', '移动应用功能测试报告', '测试体验', 1200, 'open', 72],
  ['T015', '微信小程序开发', '编程开发', 8000, 'open', 65],
]

const upsertMeta = db.prepare(`
  INSERT INTO app_meta (key, value) VALUES (?, ?)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value
`)
upsertMeta.run('service', '灵活用工众包服务平台')
upsertMeta.run('startedAt', new Date().toISOString())

const upsertTask = db.prepare(`
  INSERT INTO task_snapshot (id, title, category, price, status, heat_score)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    title = excluded.title,
    category = excluded.category,
    price = excluded.price,
    status = excluded.status,
    heat_score = excluded.heat_score
`)
for (const task of seedTasks) {
  upsertTask.run(...task)
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
  })
  res.end(body)
}

function readTaskStats() {
  const row = db.prepare(`
    SELECT
      COUNT(*) AS totalTasks,
      SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) AS openTasks,
      ROUND(AVG(heat_score), 1) AS averageHeat
    FROM task_snapshot
  `).get()

  return {
    totalTasks: Number(row.totalTasks || 0),
    openTasks: Number(row.openTasks || 0),
    averageHeat: Number(row.averageHeat || 0),
  }
}

const server = createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {})
    return
  }

  const requestUrl = new URL(req.url || '/', `http://${host}:${port}`)

  if (req.method === 'GET' && requestUrl.pathname === '/api/health') {
    const sqliteCheck = db.prepare('SELECT 1 AS ok').get()
    sendJson(res, 200, {
      ok: true,
      service: 'may-89154-backend',
      app: '灵活用工众包服务平台',
      sqlite: sqliteCheck?.ok === 1 ? 'ok' : 'error',
      stats: readTaskStats(),
      timestamp: new Date().toISOString(),
    })
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/tasks') {
    const tasks = db.prepare(`
      SELECT id, title, category, price, status, heat_score AS heatScore
      FROM task_snapshot
      ORDER BY heat_score DESC, id ASC
    `).all()
    sendJson(res, 200, { ok: true, tasks })
    return
  }

  sendJson(res, 404, {
    ok: false,
    error: 'not_found',
    available: ['/api/health', '/api/tasks'],
  })
})

server.listen(port, host, () => {
  console.log(`may-89154 backend listening on http://${host}:${port}`)
  console.log(`sqlite database: ${dbPath}`)
})

process.on('SIGTERM', () => {
  server.close(() => {
    db.close()
    process.exit(0)
  })
})
