import { createServer } from 'node:http'
import { mkdirSync, existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')
const envPath = resolve(projectRoot, '.env')

loadEnvFile(envPath)

const host = process.env.HOST || '127.0.0.1'
const port = Number(process.env.BACKEND_PORT || 59317)
const sqlitePath = resolve(projectRoot, process.env.SQLITE_PATH || './data/app.db')

mkdirSync(dirname(sqlitePath), { recursive: true })

const db = new DatabaseSync(sqlitePath)
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS service_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS service_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`)

const upsertMeta = db.prepare(`
  INSERT INTO service_meta (key, value)
  VALUES (?, ?)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value
`)
const insertEvent = db.prepare(`
  INSERT INTO service_events (type, created_at)
  VALUES (?, ?)
`)
const selectMeta = db.prepare(`
  SELECT value
  FROM service_meta
  WHERE key = ?
`)
const selectEventCount = db.prepare(`
  SELECT COUNT(*) AS count
  FROM service_events
`)

const bootTime = new Date().toISOString()
upsertMeta.run('service_name', 'may-89317-backend')
upsertMeta.run('last_started_at', bootTime)
insertEvent.run('backend_boot', bootTime)

const server = createServer((req, res) => {
  setCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url || '/', `http://${host}:${port}`)

  if (req.method === 'GET' && url.pathname === '/api/health') {
    const eventCount = Number(selectEventCount.get().count || 0)
    const lastStartedAt = selectMeta.get('last_started_at')?.value || bootTime

    sendJson(res, 200, {
      ok: true,
      service: 'may-89317-backend',
      host,
      port,
      sqlite: {
        path: sqlitePath,
        reachable: true,
        eventCount,
      },
      lastStartedAt,
      now: new Date().toISOString(),
    })
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/stats') {
    const eventCount = Number(selectEventCount.get().count || 0)

    sendJson(res, 200, {
      ok: true,
      service: 'may-89317-backend',
      stats: {
        eventCount,
      },
    })
    return
  }

  sendJson(res, 404, {
    ok: false,
    error: 'Not Found',
    path: url.pathname,
  })
})

server.listen(port, host, () => {
  console.log(`Backend listening on http://${host}:${port}`)
  console.log(`SQLite file: ${sqlitePath}`)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => {
      db.close()
      process.exit(0)
    })
  })
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return
  }

  const contents = readFileSync(filePath, 'utf8')
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {
      continue
    }

    const equalsIndex = line.indexOf('=')
    if (equalsIndex === -1) {
      continue
    }

    const key = line.slice(0, equalsIndex).trim()
    const value = line.slice(equalsIndex + 1).trim()

    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
  })
  res.end(JSON.stringify(payload))
}
