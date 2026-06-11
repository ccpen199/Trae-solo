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
const port = Number(process.env.BACKEND_PORT || 59167)
const dbPath = resolve(projectRoot, process.env.SQLITE_PATH || './data/app.sqlite')

mkdirSync(dirname(dbPath), { recursive: true })
const db = new DatabaseSync(dbPath)
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS service_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    order_count INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS admin_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    value TEXT NOT NULL
  );
`)

const categoryCount = db.prepare('SELECT COUNT(*) AS count FROM service_categories').get().count
if (categoryCount === 0) {
  const insertCategory = db.prepare('INSERT INTO service_categories (name, code, order_count) VALUES (?, ?, ?)')
  insertCategory.run('空调维修', 'air_conditioner', 1280)
  insertCategory.run('冰箱维修', 'refrigerator', 860)
  insertCategory.run('热水器维修', 'water_heater', 730)
  insertCategory.run('电视维修', 'tv', 420)
}

const metricCount = db.prepare('SELECT COUNT(*) AS count FROM admin_metrics').get().count
if (metricCount === 0) {
  const insertMetric = db.prepare('INSERT INTO admin_metrics (label, value) VALUES (?, ?)')
  insertMetric.run('总工单数', '3256')
  insertMetric.run('在线工程师', '127')
  insertMetric.run('AI质检通过率', '94.2%')
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
      service: 'smart-home-repair-platform',
      sqlite: sqliteCheck?.ok === 1 ? 'ok' : 'error',
      database: dbPath,
      timestamp: new Date().toISOString(),
    })
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/categories') {
    sendJson(res, 200, {
      status: 'ok',
      data: db.prepare('SELECT name, code, order_count AS orderCount FROM service_categories ORDER BY order_count DESC').all(),
    })
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/admin/summary') {
    sendJson(res, 200, {
      status: 'ok',
      data: db.prepare('SELECT label, value FROM admin_metrics ORDER BY id').all(),
    })
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/profile/summary') {
    const categories = db.prepare('SELECT COUNT(*) AS count, SUM(order_count) AS totalOrders FROM service_categories').get()
    const metrics = db.prepare('SELECT label, value FROM admin_metrics ORDER BY id').all()
    sendJson(res, 200, {
      status: 'ok',
      data: {
        orderCount: Number(categories?.totalOrders || 12),
        completedCount: 8,
        warrantyCount: Number(categories?.count || 4),
        savedAmount: 436,
        metrics,
      },
    })
    return
  }

  sendJson(res, 404, {
    status: 'not_found',
    available: ['/api/health', '/api/categories', '/api/admin/summary', '/api/profile/summary'],
  })
})

server.listen(port, host, () => {
  console.log(`may-89167 backend listening on http://${host}:${port}`)
  console.log(`sqlite database: ${dbPath}`)
})
