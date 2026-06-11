import { createServer } from 'node:http'
import { DatabaseSync } from 'node:sqlite'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))

function loadLocalEnv() {
  const envPath = resolve(projectRoot, '.env')
  if (!existsSync(envPath)) return
  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const [key, ...parts] = trimmed.split('=')
    if (!process.env[key]) process.env[key] = parts.join('=')
  }
}

loadLocalEnv()

const host = process.env.HOST || '127.0.0.1'
const port = Number(process.env.BACKEND_PORT || 59166)
const dbPath = resolve(projectRoot, process.env.SQLITE_PATH || './data/app.sqlite')

mkdirSync(dirname(dbPath), { recursive: true })
const db = new DatabaseSync(dbPath)
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS health_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS intervention_tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    duration INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`)

const snapshotCount = db.prepare('SELECT COUNT(*) AS count FROM health_snapshots').get().count
if (snapshotCount === 0) {
  const insertSnapshot = db.prepare('INSERT INTO health_snapshots (metric, value) VALUES (?, ?)')
  insertSnapshot.run('sleep_efficiency', '86')
  insertSnapshot.run('avg_breathing_rate', '16')
  insertSnapshot.run('night_turns', '12')
}

const trackCount = db.prepare('SELECT COUNT(*) AS count FROM intervention_tracks').get().count
if (trackCount === 0) {
  const insertTrack = db.prepare('INSERT INTO intervention_tracks (title, category, duration) VALUES (?, ?, ?)')
  insertTrack.run('深睡呼吸引导', 'insomnia', 1800)
  insertTrack.run('雨声放松', 'stress', 2400)
  insertTrack.run('晨间唤醒冥想', 'meditation', 900)
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  })
  res.end(JSON.stringify(payload))
}

const server = createServer((req, res) => {
  const requestUrl = new URL(req.url || '/', `http://${host}:${port}`)

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {})
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/health') {
    const sqliteCheck = db.prepare('SELECT 1 AS ok').get()
    sendJson(res, 200, {
      status: 'ok',
      service: 'sleep-health-intervention-platform',
      sqlite: sqliteCheck?.ok === 1 ? 'ok' : 'error',
      database: dbPath,
      timestamp: new Date().toISOString(),
    })
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/sleep/summary') {
    const rows = db.prepare('SELECT metric, value FROM health_snapshots ORDER BY id').all()
    sendJson(res, 200, {
      status: 'ok',
      data: Object.fromEntries(rows.map((row) => [row.metric, Number(row.value) || row.value])),
    })
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/audio/tracks') {
    sendJson(res, 200, {
      status: 'ok',
      data: db.prepare('SELECT id, title, category, duration FROM intervention_tracks ORDER BY id').all(),
    })
    return
  }

  sendJson(res, 404, {
    status: 'not_found',
    available: ['/api/health', '/api/sleep/summary', '/api/audio/tracks'],
  })
})

server.listen(port, host, () => {
  console.log(`may-89166 backend listening on http://${host}:${port}`)
  console.log(`sqlite database: ${dbPath}`)
})
