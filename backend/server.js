import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

loadEnv(path.join(projectRoot, '.env'))

const host = process.env.HOST || '127.0.0.1'
const port = Number(process.env.BACKEND_PORT || process.env.PORT || 59136)
const dbPath = path.resolve(projectRoot, process.env.DB_PATH || 'data/app.sqlite')

fs.mkdirSync(path.dirname(dbPath), { recursive: true })

const db = new DatabaseSync(dbPath)
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS runtime_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`)
db.prepare('INSERT INTO runtime_events (event_name, payload) VALUES (?, ?)').run(
  'backend_start',
  JSON.stringify({ project: 'may-89136', service: 'local-health-api' }),
)

const modules = [
  { id: 'personal', name: 'Personal portal', status: 'available' },
  { id: 'enterprise', name: 'Enterprise portal', status: 'available' },
  { id: 'social-security', name: 'Social security service', status: 'available' },
  { id: 'employment', name: 'Employment service', status: 'available' },
  { id: 'talent', name: 'Talent service', status: 'available' },
  { id: 'monitoring', name: 'Monitoring dashboard', status: 'available' },
]

const server = http.createServer((req, res) => {
  const origin = req.headers.origin || '*'

  if (req.method === 'OPTIONS') {
    writeCors(res, 204, origin)
    return
  }

  const url = new URL(req.url || '/', `http://${host}:${port}`)

  if (req.method === 'GET' && url.pathname === '/api/health') {
    const events = db.prepare('SELECT COUNT(*) AS count FROM runtime_events').get().count
    json(res, 200, {
      success: true,
      ok: true,
      project: 'may-89136',
      service: 'cq-hrss-local-api',
      database: path.relative(projectRoot, dbPath),
      events,
      time: new Date().toISOString(),
    }, origin)
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/modules') {
    json(res, 200, { success: true, data: modules }, origin)
    return
  }

  json(res, 404, { success: false, error: 'API not found', path: url.pathname }, origin)
})

server.listen(port, host, () => {
  console.log(`may-89136 backend listening on http://${host}:${port}`)
})

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return

  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/)
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2]
  }
}

function writeCors(res, status, origin) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  })
  res.end()
}

function json(res, status, body, origin) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
  })
  res.end(JSON.stringify(body))
}
