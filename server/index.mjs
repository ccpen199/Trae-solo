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
const port = Number(process.env.BACKEND_PORT || 59161)
const dbPath = resolve(projectRoot, process.env.SQLITE_PATH || './data/app.sqlite')

mkdirSync(dirname(dbPath), { recursive: true })

const db = new DatabaseSync(dbPath)
db.exec(`
  CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS operation_summary (
    key TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    value INTEGER NOT NULL
  );
`)

const upsertMeta = db.prepare(`
  INSERT INTO app_meta (key, value) VALUES (?, ?)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value
`)
const upsertSummary = db.prepare(`
  INSERT INTO operation_summary (key, label, value) VALUES (?, ?, ?)
  ON CONFLICT(key) DO UPDATE SET label = excluded.label, value = excluded.value
`)

upsertMeta.run('service', '快递作业协同 H5')
upsertMeta.run('startedAt', new Date().toISOString())
upsertSummary.run('pickupToday', '今日揽件', 128)
upsertSummary.run('deliveryToday', '今日派件', 356)
upsertSummary.run('exceptions', '异常待处理', 7)

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

function readSummary() {
  return db.prepare(`
    SELECT key, label, value
    FROM operation_summary
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
      service: 'may-89161-backend',
      app: '快递作业协同 H5',
      sqlite: sqliteCheck?.ok === 1 ? 'ok' : 'error',
      summary: readSummary(),
      timestamp: new Date().toISOString(),
    })
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/operations/summary') {
    sendJson(res, 200, {
      ok: true,
      summary: readSummary(),
      timestamp: new Date().toISOString(),
    })
    return
  }

  sendJson(res, 404, {
    ok: false,
    error: 'not_found',
    available: ['/api/health', '/api/operations/summary'],
  })
})

server.listen(port, host, () => {
  console.log(`may-89161 backend listening on http://${host}:${port}`)
  console.log(`sqlite database: ${dbPath}`)
})

process.on('SIGTERM', () => {
  server.close(() => {
    db.close()
    process.exit(0)
  })
})
