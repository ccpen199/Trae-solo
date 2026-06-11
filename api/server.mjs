import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const host = process.env.HOST === 'localhost' ? '127.0.0.1' : (process.env.HOST || '127.0.0.1')
const port = Number(process.env.BACKEND_PORT || process.env.PORT || 59121)
const dbPath = path.resolve(projectRoot, process.env.DB_PATH || './data/app.sqlite')
const frontendPort = Number(process.env.FRONTEND_PORT || process.env.APP_PORT || 49121)

const workers = [
  { id: 'WK001', name: '李秀英', phone: '13812345678', level: 'L4', city: '北京', status: 'active', rating: 4.9, serviceCategories: ['月嫂', '育儿嫂'], totalOrders: 186 },
  { id: 'WK002', name: '王美华', phone: '13923456789', level: 'L3', city: '上海', status: 'active', rating: 4.7, serviceCategories: ['育儿嫂', '月嫂'], totalOrders: 98 },
  { id: 'WK003', name: '张建国', phone: '13634567890', level: 'L3', city: '广州', status: 'active', rating: 4.5, serviceCategories: ['家电清洗'], totalOrders: 142 },
  { id: 'WK004', name: '刘芳', phone: '13745678901', level: 'L2', city: '深圳', status: 'active', rating: 4.2, serviceCategories: ['保洁', '钟点工'], totalOrders: 45 },
  { id: 'WK005', name: '陈玉兰', phone: '13556789012', level: 'L4', city: '杭州', status: 'active', rating: 4.8, serviceCategories: ['养老护理'], totalOrders: 210 },
  { id: 'WK007', name: '孙伟', phone: '13178901234', level: 'L2', city: '北京', status: 'recertifying', rating: 4.1, serviceCategories: ['家电清洗'], totalOrders: 53 },
]

const employers = [
  { id: 'EM001', name: '林佳慧', phone: '15912345678', creditScore: 98, creditLevel: 'A+', city: '北京', totalOrders: 15, disputeRate: 0, status: 'active' },
  { id: 'EM002', name: '黄志强', phone: '15823456789', creditScore: 85, creditLevel: 'A', city: '上海', totalOrders: 8, disputeRate: 0.125, status: 'active' },
  { id: 'EM004', name: '郑磊', phone: '15645678901', creditScore: 58, creditLevel: 'C', city: '深圳', totalOrders: 5, disputeRate: 0.4, status: 'restricted' },
  { id: 'EM006', name: '马浩然', phone: '15467890123', creditScore: 35, creditLevel: 'D', city: '成都', totalOrders: 11, disputeRate: 0.545, status: 'blacklisted' },
]

const orders = [
  { id: 'SO001', employerId: 'EM001', employerName: '林佳慧', workerId: 'WK001', workerName: '李秀英', category: '月嫂', status: 'in_service', city: '北京', price: 15800, scheduledDate: '2026-07-15' },
  { id: 'SO002', employerId: 'EM002', employerName: '黄志强', workerId: 'WK002', workerName: '王美华', category: '育儿嫂', status: 'insurance_enrolled', city: '上海', price: 8500, scheduledDate: '2026-06-15' },
  { id: 'SO003', employerId: 'EM003', employerName: '吴雅琴', workerId: 'WK003', workerName: '张建国', category: '家电清洗', status: 'completed', city: '广州', price: 480, scheduledDate: '2026-04-15' },
  { id: 'SO005', employerId: 'EM004', employerName: '郑磊', workerId: 'WK004', workerName: '刘芳', category: '保洁', status: 'disputed', city: '深圳', price: 580, scheduledDate: '2026-04-25' },
  { id: 'SO008', employerId: 'EM003', employerName: '吴雅琴', workerId: 'WK008', workerName: '周桂兰', category: '月嫂', status: 'interview_scheduled', city: '广州', price: 13800, scheduledDate: '2026-09-01' },
]

const sessions = [
  { id: 'SS001', orderId: 'SO001', workerName: '李秀英', employerName: '林佳慧', status: 'in_progress', expectedDuration: 480, actualDuration: 455, deviationAlert: false },
  { id: 'SS002', orderId: 'SO005', workerName: '刘芳', employerName: '郑磊', status: 'disputed', expectedDuration: 240, actualDuration: 175, deviationAlert: true },
  { id: 'SS003', orderId: 'SO003', workerName: '张建国', employerName: '吴雅琴', status: 'completed', expectedDuration: 180, actualDuration: 190, deviationAlert: false },
]

const disputes = [
  { id: 'DP001', orderId: 'SO005', initiatorName: '郑磊', reason: '清洁质量不达标且中途离场', status: 'ai_judged', riskLevel: 'high', suggestedCompensation: 232 },
  { id: 'DP002', orderId: 'SO003', initiatorName: '张建国', reason: '雇主追加服务项目未补差价', status: 'pending', riskLevel: 'medium', suggestedCompensation: 120 },
]

const compensationClaims = [
  { id: 'CP001', orderId: 'SO005', employerName: '郑磊', workerName: '刘芳', reason: '服务时长不足', status: 'pending', claimAmount: 300, approvedAmount: 232 },
  { id: 'CP002', orderId: 'SO003', employerName: '吴雅琴', workerName: '张建国', reason: '工具损耗补偿', status: 'approved', claimAmount: 120, approvedAmount: 120 },
]

const packages = [
  { id: 'PKG001', name: '母婴护理标准包', providerName: '安心到家服务商', city: '北京', category: '月嫂', price: 15800, status: 'active' },
  { id: 'PKG002', name: '深度保洁小时包', providerName: '洁净家服务商', city: '深圳', category: '保洁', price: 580, status: 'active' },
  { id: 'PKG003', name: '养老陪护月度包', providerName: '康护到家', city: '杭州', category: '养老护理', price: 6800, status: 'reviewing' },
]

const corsOrigins = new Set([
  process.env.FRONTEND_URL,
  `http://127.0.0.1:${frontendPort}`,
  `http://localhost:${frontendPort}`,
].filter(Boolean))

function ensureDatabase() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  const schema = `
PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS api_probe (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
INSERT OR REPLACE INTO app_meta (key, value, updated_at) VALUES
  ('service', 'may-89121 B2C2B home service platform', CURRENT_TIMESTAMP),
  ('workers', '${workers.length}', CURRENT_TIMESTAMP),
  ('employers', '${employers.length}', CURRENT_TIMESTAMP),
  ('orders', '${orders.length}', CURRENT_TIMESTAMP),
  ('disputes', '${disputes.length}', CURRENT_TIMESTAMP);
`
  const result = spawnSync('sqlite3', [dbPath], { input: schema, encoding: 'utf8' })
  if (result.error || result.status !== 0) {
    throw new Error(result.error?.message || result.stderr || 'sqlite3 初始化失败')
  }
}

let databaseReady = false
let databaseError = ''

try {
  ensureDatabase()
  databaseReady = true
} catch (error) {
  databaseError = error instanceof Error ? error.message : String(error)
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Credentials': 'true',
  })
  res.end(JSON.stringify(payload))
}

function success(res, data, message = '获取成功') {
  sendJson(res, 200, { code: 200, success: true, message, data, timestamp: Date.now() })
}

function page(res, list, total = list.length, pageNo = 1, pageSize = 20) {
  success(res, { list, total, page: pageNo, pageSize }, '获取成功')
}

function notFound(res) {
  sendJson(res, 404, { code: 404, success: false, message: 'API 不存在', data: null, timestamp: Date.now() })
}

function filterList(list, keyword, fields) {
  const q = String(keyword || '').trim().toLowerCase()
  if (!q) return list
  return list.filter((item) => fields.some((field) => String(item[field] || '').toLowerCase().includes(q)))
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return Object.fromEntries(new URLSearchParams(raw))
  }
}

function routeGet(pathname, query, res) {
  if (pathname === '/api/health') {
    success(res, {
      service: 'may-89121',
      status: 'ok',
      database: {
        type: 'sqlite',
        path: dbPath,
        ready: databaseReady,
        error: databaseError,
      },
      frontendUrl: process.env.FRONTEND_URL || `http://127.0.0.1:${frontendPort}`,
      backendUrl: process.env.BACKEND_URL || `http://127.0.0.1:${port}`,
    }, 'ok')
    return
  }

  if (pathname === '/api/dashboard' || pathname === '/api/admin/dashboard') {
    success(res, {
      cards: [
        { label: '劳动者总数', value: workers.length },
        { label: '雇主总数', value: employers.length },
        { label: '进行中工单', value: orders.filter((order) => order.status === 'in_service').length },
        { label: '待处理纠纷', value: disputes.filter((item) => item.status !== 'closed').length },
      ],
      alerts: sessions.filter((item) => item.deviationAlert),
      latestOrders: orders.slice(0, 5),
    })
    return
  }

  if (pathname === '/api/workers') {
    const filtered = filterList(workers, query.get('q') || query.get('keyword'), ['name', 'phone', 'city', 'level'])
    page(res, filtered)
    return
  }

  if (pathname.startsWith('/api/workers/')) {
    success(res, workers.find((item) => item.id === pathname.split('/').pop()) || null)
    return
  }

  if (pathname === '/api/employers') {
    const filtered = filterList(employers, query.get('q') || query.get('keyword'), ['name', 'phone', 'city', 'creditLevel'])
    page(res, filtered)
    return
  }

  if (pathname.startsWith('/api/employers/')) {
    success(res, employers.find((item) => item.id === pathname.split('/').pop()) || null)
    return
  }

  if (pathname === '/api/orders') {
    const status = query.get('status')
    const filtered = filterList(orders, query.get('q') || query.get('keyword'), ['id', 'employerName', 'workerName', 'category'])
      .filter((item) => !status || item.status === status)
    page(res, filtered)
    return
  }

  if (pathname.startsWith('/api/orders/')) {
    success(res, orders.find((item) => item.id === pathname.split('/').pop()) || null)
    return
  }

  if (pathname === '/api/supervision/sessions' || pathname === '/api/service-sessions') {
    page(res, sessions)
    return
  }

  if (pathname === '/api/evaluations' || pathname === '/api/supervision/evaluations') {
    page(res, [
      { id: 'EV001', orderId: 'SO003', employerRating: 5, workerRating: 4, platformRating: 5, status: 'published' },
      { id: 'EV002', orderId: 'SO005', employerRating: 2, workerRating: 2, platformRating: 3, status: 'reviewing' },
    ])
    return
  }

  if (pathname === '/api/disputes') {
    page(res, disputes)
    return
  }

  if (pathname === '/api/compensation/claims' || pathname === '/api/compensation') {
    page(res, compensationClaims)
    return
  }

  if (pathname === '/api/provider/packages' || pathname === '/api/service-packages' || pathname === '/api/products') {
    page(res, packages)
    return
  }

  if (pathname === '/api/search') {
    const keyword = query.get('q') || query.get('keyword') || ''
    success(res, {
      keyword,
      list: [
        ...filterList(workers, keyword, ['name', 'phone', 'city']).map((item) => ({ id: item.id, type: '劳动者', title: item.name, summary: `${item.city} ${item.level} ${item.serviceCategories.join('/')}` })),
        ...filterList(employers, keyword, ['name', 'phone', 'city']).map((item) => ({ id: item.id, type: '雇主', title: item.name, summary: `${item.city} 信用${item.creditLevel}` })),
        ...filterList(orders, keyword, ['id', 'employerName', 'workerName', 'category']).map((item) => ({ id: item.id, type: '工单', title: item.category, summary: `${item.employerName} - ${item.workerName}` })),
      ],
    }, '搜索成功')
    return
  }

  notFound(res)
}

async function routePost(pathname, req, res) {
  const body = await readBody(req)

  if (pathname === '/api/orders' || pathname === '/api/submit') {
    const order = {
      id: `SO${String(orders.length + 1).padStart(3, '0')}`,
      employerId: body.employerId || 'EM001',
      employerName: body.employerName || '林佳慧',
      workerId: body.workerId || 'WK001',
      workerName: body.workerName || '李秀英',
      category: body.category || '保洁',
      status: 'pending',
      city: body.city || '北京',
      price: Number(body.price || 580),
      scheduledDate: body.scheduledDate || new Date().toISOString().slice(0, 10),
    }
    orders.unshift(order)
    success(res, order, '提交成功')
    return
  }

  if (pathname === '/api/disputes') {
    const dispute = {
      id: `DP${String(disputes.length + 1).padStart(3, '0')}`,
      orderId: body.orderId || 'SO001',
      initiatorName: body.initiatorName || '演示用户',
      reason: body.reason || '服务体验待核查',
      status: 'pending',
      riskLevel: 'medium',
      suggestedCompensation: Number(body.suggestedCompensation || 0),
    }
    disputes.unshift(dispute)
    success(res, dispute, '提交成功')
    return
  }

  notFound(res)
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin
  if (!origin || corsOrigins.has(origin) || /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*')
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || `${host}:${port}`}`)

  try {
    if (req.method === 'GET') {
      routeGet(requestUrl.pathname, requestUrl.searchParams, res)
      return
    }
    if (req.method === 'POST') {
      await routePost(requestUrl.pathname, req, res)
      return
    }
    notFound(res)
  } catch (error) {
    sendJson(res, 500, {
      code: 500,
      success: false,
      message: error instanceof Error ? error.message : '服务器内部错误',
      data: null,
      timestamp: Date.now(),
    })
  }
})

server.listen(port, host, () => {
  console.log(`Server ready on http://${host}:${port}`)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0))
  })
}
