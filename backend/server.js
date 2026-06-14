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
const port = Number(process.env.BACKEND_PORT || process.env.PORT || 59139)
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
  CREATE TABLE IF NOT EXISTS invoice_downloads (
    id TEXT PRIMARY KEY,
    downloaded_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`)
db.prepare('INSERT INTO runtime_events (event_name, payload) VALUES (?, ?)').run(
  'backend_start',
  JSON.stringify({ project: 'may-89139', service: 'local-health-api' }),
)

const searchItems = [
  { id: 'svc_1', type: 'service', title: '居住证申领', department: '深圳市公安局', path: '/services/svc_1' },
  { id: 'svc_2', type: 'service', title: '社保关系转移接续', department: '深圳市社会保险基金管理局', path: '/services/svc_4' },
  { id: 'cert_auth', type: 'certificate', title: '授权管理', department: '深圳市政务服务数据管理局', path: '/certificates' },
  { id: 'exempt', type: 'certificate', title: '免证办', department: '深圳市政务服务中心', path: '/certificates' },
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
      project: 'may-89139',
      service: 'community-services-local-api',
      database: path.relative(projectRoot, dbPath),
      events,
      time: new Date().toISOString(),
    }, origin)
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/search') {
    const keyword = (url.searchParams.get('q') || '').trim()
    const normalized = keyword.toLowerCase()
    const data = normalized
      ? searchItems.filter((item) =>
          [item.title, item.department, item.type].some((field) =>
            field.toLowerCase().includes(normalized),
          ),
        )
      : searchItems
    json(res, 200, { success: true, query: keyword, data, total: data.length }, origin)
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/admin/stats') {
    json(res, 200, {
      success: true,
      data: {
        handledToday: 1286,
        onlineRate: 94.8,
        certificateCalls: 1523678,
        avgHandleDays: 2.3,
      },
    }, origin)
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/admin/dashboard') {
    json(res, 200, {
      success: true,
      data: {
        modules: ['证照办理', '授权管理', '免证办', '政务服务', '运行监控'],
        alerts: [
          { level: 'info', message: '免证办清单新增 53 项' },
          { level: 'warning', message: '授权即将到期记录 3 条' },
        ],
      },
    }, origin)
    return
  }

  const invoiceMatch = url.pathname.match(/^\/api\/invoice\/([^/]+)$/)
  if (req.method === 'GET' && invoiceMatch) {
    const invoiceId = decodeURIComponent(invoiceMatch[1])
    db.prepare('INSERT OR REPLACE INTO invoice_downloads (id) VALUES (?)').run(invoiceId)
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
    })
    res.end(`Invoice ${invoiceId} is available in the local demo service.`)
    return
  }

  json(res, 404, { success: false, error: 'API not found', path: url.pathname }, origin)
})

server.listen(port, host, () => {
  console.log(`may-89139 backend listening on http://${host}:${port}`)
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
