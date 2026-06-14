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
const port = Number(process.env.BACKEND_PORT || process.env.PORT || 59138)
const dbPath = path.resolve(projectRoot, process.env.DB_PATH || 'data/app.sqlite')

fs.mkdirSync(path.dirname(dbPath), { recursive: true })
const db = new DatabaseSync(dbPath)
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS service_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT DEFAULT 'submitted',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`)

seedEvents([
  ['backend_ready', { module: '农链通服务 API', traces: 4 }],
  ['market_ready', { module: '交易市场', items: 9 }],
  ['submission_ready', { module: '供需/订单提交', status: 'available' }],
])

const traceRecords = [
  { traceCode: 'TR-2026-0001', productName: '有机西红柿', category: '蔬菜', origin: '山东省寿光市', status: '已上链', batchNo: 'B-SDSG-20260501' },
  { traceCode: 'TR-2026-0002', productName: '五常大米', category: '粮食', origin: '黑龙江省五常市', status: '运输中', batchNo: 'B-HLWC-20260420' },
  { traceCode: 'TR-2026-0003', productName: '新疆阿克苏苹果', category: '水果', origin: '新疆阿克苏市', status: '冷链运输中', batchNo: 'B-XJAKS-20260510' },
  { traceCode: 'TR-2026-0004', productName: '云南普洱茶饼', category: '茶叶', origin: '云南省普洱市', status: '零售上架', batchNo: 'B-YNPE-20260416' },
]

const marketItems = [
  { id: 'SD-001', type: 'supply', category: '蔬菜', productName: '有机西红柿', quantity: '2000kg', price: 5.6, region: '山东省寿光市', publisher: '寿光绿源种植基地' },
  { id: 'SD-002', type: 'demand', category: '蔬菜', productName: '有机西红柿', quantity: '500kg', price: 6.0, region: '北京市朝阳区', publisher: '盒马鲜生采购部' },
  { id: 'SD-003', type: 'supply', category: '粮食', productName: '五常大米', quantity: '5000kg', price: 14.5, region: '黑龙江省五常市', publisher: '五常金禾米业' },
]

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '*'
  if (req.method === 'OPTIONS') {
    writeCors(res, 204, origin)
    return
  }

  const url = new URL(req.url || '/', `http://${host}:${port}`)

  if (req.method === 'GET' && url.pathname === '/api/health') {
    json(res, 200, {
      ok: true,
      success: true,
      project: 'may-89138',
      service: '农链通后端',
      database: path.relative(projectRoot, dbPath),
      events: db.prepare('SELECT COUNT(*) AS count FROM service_events').get().count,
      submissions: db.prepare('SELECT COUNT(*) AS count FROM submissions').get().count,
      time: new Date().toISOString(),
    }, origin)
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/trace') {
    json(res, 200, { success: true, data: traceRecords, total: traceRecords.length }, origin)
    return
  }

  const traceMatch = url.pathname.match(/^\/api\/trace\/([^/]+)$/)
  if (req.method === 'GET' && traceMatch) {
    const code = decodeURIComponent(traceMatch[1])
    const record = traceRecords.find((item) => item.traceCode === code)
    json(res, record ? 200 : 404, record ? { success: true, data: record } : { success: false, error: 'trace not found' }, origin)
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/search') {
    const q = (url.searchParams.get('q') || url.searchParams.get('keyword') || '').trim()
    const traces = traceRecords.filter((item) => matchText(item, q))
    const market = marketItems.filter((item) => matchText(item, q))
    json(res, 200, { success: true, keyword: q, data: { traces, market }, total: traces.length + market.length }, origin)
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/market') {
    const category = url.searchParams.get('category') || ''
    const type = url.searchParams.get('type') || ''
    const data = marketItems.filter((item) => (!category || item.category === category) && (!type || item.type === type))
    json(res, 200, { success: true, data, total: data.length }, origin)
    return
  }

  if (req.method === 'POST' && (url.pathname === '/api/market' || url.pathname === '/api/submissions' || url.pathname === '/api/orders')) {
    const body = await readJson(req)
    const type = url.pathname === '/api/orders' ? 'order' : body.type || 'market'
    const result = db.prepare('INSERT INTO submissions (type, payload) VALUES (?, ?)').run(type, JSON.stringify(body))
    json(res, 201, {
      success: true,
      data: {
        id: result.lastInsertRowid,
        type,
        status: 'submitted',
        message: type === 'order' ? '订单已提交' : '信息已提交',
      },
    }, origin)
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/logistics') {
    json(res, 200, {
      success: true,
      data: [
        { id: 'LO-001', productName: '有机西红柿', status: 'delivered', carrier: '顺丰冷链物流' },
        { id: 'LO-002', productName: '新疆阿克苏苹果', status: 'in_transit', carrier: '中通冷链' },
      ],
    }, origin)
    return
  }

  json(res, 404, { success: false, error: 'API not found', path: url.pathname }, origin)
})

server.listen(port, host, () => {
  console.log(`may-89138 backend listening on http://${host}:${port}`)
})

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/)
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2]
  }
}

function seedEvents(events) {
  const count = db.prepare('SELECT COUNT(*) AS count FROM service_events').get().count
  if (count > 0) return
  const insert = db.prepare('INSERT INTO service_events (event_name, payload) VALUES (?, ?)')
  for (const [name, payload] of events) insert.run(name, JSON.stringify(payload))
}

function matchText(item, q) {
  if (!q) return true
  return Object.values(item).some((value) => String(value).includes(q))
}

async function readJson(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return { raw }
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
