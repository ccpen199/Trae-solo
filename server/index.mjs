import { createServer } from 'node:http'
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {}

  return readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce((acc, line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return acc

      const separator = trimmed.indexOf('=')
      if (separator < 0) return acc

      const key = trimmed.slice(0, separator).trim()
      const value = trimmed.slice(separator + 1).trim()
      acc[key] = value
      return acc
    }, {})
}

const env = {
  ...loadEnvFile(join(projectRoot, '.env')),
  ...process.env,
}

const host = env.BACKEND_HOST || '127.0.0.1'
const port = Number(env.BACKEND_PORT || 59314)
const frontendUrl = (env.FRONTEND_URL || 'http://127.0.0.1:49314/').replace(/\/$/, '')
const dbFile = resolve(projectRoot, env.SQLITE_PATH || 'data/app.sqlite')

mkdirSync(dirname(dbFile), { recursive: true })

const db = new DatabaseSync(dbFile)
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_no TEXT NOT NULL,
    origin_city TEXT NOT NULL,
    dest_city TEXT NOT NULL,
    budget INTEGER NOT NULL,
    status TEXT NOT NULL,
    status_label TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS capacity_resources (
    id TEXT PRIMARY KEY,
    carrier_name TEXT NOT NULL,
    plate_no TEXT NOT NULL,
    current_city TEXT NOT NULL,
    gps_status TEXT NOT NULL,
    vehicle_status TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    order_no TEXT NOT NULL,
    severity TEXT NOT NULL,
    type_label TEXT NOT NULL,
    location TEXT NOT NULL,
    resolved INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    contract_no TEXT NOT NULL,
    shipper_name TEXT NOT NULL,
    carrier_name TEXT NOT NULL,
    total_amount INTEGER NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`)

function seedTable(tableName, rows, columns) {
  const countRow = db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get()
  if (Number(countRow.count) > 0) return

  const placeholders = columns.map(() => '?').join(', ')
  const stmt = db.prepare(
    `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`
  )

  for (const row of rows) {
    stmt.run(...columns.map((column) => row[column]))
  }
}

seedTable(
  'orders',
  [
    {
      id: 'ord-001',
      order_no: 'WL20260622001',
      origin_city: '上海',
      dest_city: '苏州',
      budget: 12800,
      status: 'in_transit',
      status_label: '运输中',
      created_at: '2026-06-22 08:30',
    },
    {
      id: 'ord-002',
      order_no: 'WL20260622002',
      origin_city: '宁波',
      dest_city: '杭州',
      budget: 8600,
      status: 'published',
      status_label: '待匹配',
      created_at: '2026-06-22 09:10',
    },
    {
      id: 'ord-003',
      order_no: 'WL20260622003',
      origin_city: '无锡',
      dest_city: '南京',
      budget: 9800,
      status: 'completed',
      status_label: '已完成',
      created_at: '2026-06-21 17:45',
    },
    {
      id: 'ord-004',
      order_no: 'WL20260622004',
      origin_city: '嘉兴',
      dest_city: '合肥',
      budget: 15400,
      status: 'exception',
      status_label: '异常',
      created_at: '2026-06-22 07:55',
    },
  ],
  ['id', 'order_no', 'origin_city', 'dest_city', 'budget', 'status', 'status_label', 'created_at']
)

seedTable(
  'capacity_resources',
  [
    {
      id: 'cap-001',
      carrier_name: '顺达物流',
      plate_no: '沪A-9218',
      current_city: '上海',
      gps_status: 'online',
      vehicle_status: 'in_transit',
    },
    {
      id: 'cap-002',
      carrier_name: '恒通快运',
      plate_no: '苏B-4712',
      current_city: '苏州',
      gps_status: 'online',
      vehicle_status: 'idle',
    },
    {
      id: 'cap-003',
      carrier_name: '鑫源物流',
      plate_no: '浙C-6603',
      current_city: '杭州',
      gps_status: 'offline',
      vehicle_status: 'maintenance',
    },
  ],
  ['id', 'carrier_name', 'plate_no', 'current_city', 'gps_status', 'vehicle_status']
)

seedTable(
  'alerts',
  [
    {
      id: 'alt-001',
      order_no: 'WL20260622004',
      severity: 'high',
      type_label: '偏航预警',
      location: '宣城服务区',
      resolved: 0,
    },
    {
      id: 'alt-002',
      order_no: 'WL20260622001',
      severity: 'medium',
      type_label: '停留超时',
      location: '苏州北收费站',
      resolved: 0,
    },
    {
      id: 'alt-003',
      order_no: 'WL20260622003',
      severity: 'low',
      type_label: '签收延迟',
      location: '南京江北新区',
      resolved: 1,
    },
  ],
  ['id', 'order_no', 'severity', 'type_label', 'location', 'resolved']
)

seedTable(
  'contracts',
  [
    {
      id: 'con-001',
      contract_no: 'HT20260622001',
      shipper_name: '华东精工',
      carrier_name: '顺达物流',
      total_amount: 12800,
      status: 'signed',
      created_at: '2026-06-22 08:10',
    },
    {
      id: 'con-002',
      contract_no: 'HT20260622002',
      shipper_name: '宁港供应链',
      carrier_name: '恒通快运',
      total_amount: 8600,
      status: 'pending_sign',
      created_at: '2026-06-22 09:05',
    },
  ],
  ['id', 'contract_no', 'shipper_name', 'carrier_name', 'total_amount', 'status', 'created_at']
)

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': frontendUrl,
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
  })
  res.end(JSON.stringify(payload))
}

function getSummary() {
  const orders = Number(db.prepare('SELECT COUNT(*) AS count FROM orders').get().count)
  const activeOrders = Number(
    db
      .prepare(
        "SELECT COUNT(*) AS count FROM orders WHERE status IN ('published', 'matched', 'in_transit', 'exception')"
      )
      .get().count
  )
  const onlineCapacity = Number(
    db.prepare("SELECT COUNT(*) AS count FROM capacity_resources WHERE gps_status = 'online'").get().count
  )
  const unresolvedAlerts = Number(
    db.prepare('SELECT COUNT(*) AS count FROM alerts WHERE resolved = 0').get().count
  )
  const signedContracts = Number(
    db.prepare("SELECT COUNT(*) AS count FROM contracts WHERE status = 'signed'").get().count
  )

  return {
    orders,
    activeOrders,
    onlineCapacity,
    unresolvedAlerts,
    signedContracts,
  }
}

const server = createServer((req, res) => {
  if (!req.url) {
    sendJson(res, 400, { ok: false, message: 'Missing request URL' })
    return
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': frontendUrl,
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    res.end()
    return
  }

  const url = new URL(req.url, `http://${req.headers.host || `${host}:${port}`}`)

  if (req.method === 'GET' && url.pathname === '/api/health') {
    sendJson(res, 200, {
      ok: true,
      service: 'logistics-b2b-backend',
      host,
      port,
      database: {
        status: 'ok',
        path: dbFile,
      },
      summary: getSummary(),
      checkedAt: new Date().toISOString(),
    })
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/dashboard') {
    const recentOrders = db
      .prepare(
        'SELECT order_no AS orderNo, origin_city AS originCity, dest_city AS destCity, budget, status, status_label AS statusLabel, created_at AS createdAt FROM orders ORDER BY created_at DESC LIMIT 4'
      )
      .all()

    sendJson(res, 200, {
      ok: true,
      summary: getSummary(),
      recentOrders,
    })
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/orders') {
    const rows = db
      .prepare(
        'SELECT id, order_no AS orderNo, origin_city AS originCity, dest_city AS destCity, budget, status, status_label AS statusLabel, created_at AS createdAt FROM orders ORDER BY created_at DESC'
      )
      .all()

    sendJson(res, 200, {
      ok: true,
      items: rows,
    })
    return
  }

  sendJson(res, 404, {
    ok: false,
    message: 'Route not found',
    path: url.pathname,
  })
})

server.listen(port, host, () => {
  console.log(
    JSON.stringify({
      ok: true,
      message: 'Backend listening',
      host,
      port,
      dbFile,
      frontendUrl,
    })
  )
})
