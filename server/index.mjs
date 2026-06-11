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

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '')
    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

loadProjectEnv()

const host = process.env.HOST || '127.0.0.1'
const port = Number(process.env.BACKEND_PORT || 59156)
const dbPath = resolve(projectRoot, process.env.SQLITE_PATH || './data/app.sqlite')

mkdirSync(dirname(dbPath), { recursive: true })

const db = new DatabaseSync(dbPath)
db.exec(`
  CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS utility_metrics (
    key TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT NOT NULL
  );
`)

const upsertMeta = db.prepare(`
  INSERT INTO app_meta (key, value) VALUES (?, ?)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value
`)
const upsertMetric = db.prepare(`
  INSERT INTO utility_metrics (key, label, value, unit) VALUES (?, ?, ?, ?)
  ON CONFLICT(key) DO UPDATE SET
    label = excluded.label,
    value = excluded.value,
    unit = excluded.unit
`)

upsertMeta.run('service', '爱众公用事业服务平台')
upsertMeta.run('startedAt', new Date().toISOString())
upsertMetric.run('todayPayments', '今日缴费金额', 128430.55, 'CNY')
upsertMetric.run('pendingWorkOrders', '待处理工单', 18, 'count')
upsertMetric.run('activeHouseholds', '绑定户号', 3268, 'count')

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store',
  })
  res.end(body)
}

function readMetrics() {
  return db.prepare(`
    SELECT key, label, value, unit
    FROM utility_metrics
    ORDER BY key ASC
  `).all()
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
      service: 'may-89156-backend',
      app: '爱众公用事业服务平台',
      sqlite: sqliteCheck?.ok === 1 ? 'ok' : 'error',
      metrics: readMetrics(),
      timestamp: new Date().toISOString(),
    })
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/admin/summary') {
    sendJson(res, 200, {
      code: 0,
      message: 'success',
      data: {
        metrics: readMetrics(),
        modules: ['缴费管理', '公告管理', '工单管理', '监管数据同步'],
      },
      timestamp: new Date().toISOString(),
    })
    return
  }

  sendJson(res, 404, {
    ok: false,
    error: 'not_found',
    available: ['/api/health', '/api/admin/summary'],
  })
})

server.listen(port, host, () => {
  console.log(`may-89156 backend listening on http://${host}:${port}`)
  console.log(`sqlite database: ${dbPath}`)
})

process.on('SIGTERM', () => {
  server.close(() => {
    db.close()
    process.exit(0)
  })
})
