import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDatabase, db } from './database.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '../../data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const envPath = path.join(__dirname, '../../.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const val = match[2].trim()
      if (!process.env[key]) process.env[key] = val
    }
  })
}

initDatabase()

const app = express()
const PORT = parseInt(process.env.BACKEND_PORT) || 56935

app.use(cors({
  origin: [`http://127.0.0.1:${process.env.FRONTEND_PORT || 46935}`],
  credentials: true
}))
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.post('/api/auth/login', (req, res) => {
  const { phone, password } = req.body
  const user = db.prepare('SELECT * FROM users WHERE phone = ? AND password = ?').get(phone, password)
  if (user) {
    delete user.password
    res.json({ success: true, data: user })
  } else {
    res.json({ success: false, message: '手机号或密码错误' })
  }
})

app.post('/api/auth/register', (req, res) => {
  const { phone, password, name, role, company_name } = req.body
  try {
    const result = db.prepare('INSERT INTO users (phone, password, name, role, company_name) VALUES (?, ?, ?, ?, ?)').run(phone, password, name, role || 'shipper', company_name)
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid)

    if (role === 'driver') {
      db.prepare('INSERT INTO drivers (user_id, real_name, phone) VALUES (?, ?, ?)').run(result.lastInsertRowid, name, phone)
    }

    delete user.password
    res.json({ success: true, data: user })
  } catch (e) {
    res.json({ success: false, message: '手机号已存在' })
  }
})

app.get('/api/orders', (req, res) => {
  const { status, shipper_id, driver_id } = req.query
  let sql = 'SELECT o.*, u.name as shipper_name, d.real_name as driver_name, v.plate_number FROM orders o LEFT JOIN users u ON o.shipper_id = u.id LEFT JOIN drivers d ON o.driver_id = d.id LEFT JOIN vehicles v ON o.vehicle_id = v.id WHERE 1=1'
  const params = []
  if (status) {
    sql += ' AND o.status = ?'
    params.push(status)
  }
  if (shipper_id) {
    sql += ' AND o.shipper_id = ?'
    params.push(shipper_id)
  }
  if (driver_id) {
    sql += ' AND o.driver_id = ?'
    params.push(driver_id)
  }
  sql += ' ORDER BY o.created_at DESC LIMIT 50'
  const orders = db.prepare(sql).all(...params)
  res.json({ success: true, data: orders })
})

app.get('/api/orders/:id', (req, res) => {
  const order = db.prepare('SELECT o.*, u.name as shipper_name, u.phone as shipper_phone, d.real_name as driver_name, d.phone as driver_phone, v.plate_number, v.vehicle_type FROM orders o LEFT JOIN users u ON o.shipper_id = u.id LEFT JOIN drivers d ON o.driver_id = d.id LEFT JOIN vehicles v ON o.vehicle_id = v.id WHERE o.id = ?').get(req.params.id)
  if (order) {
    res.json({ success: true, data: order })
  } else {
    res.json({ success: false, message: '订单不存在' })
  }
})

app.post('/api/orders', (req, res) => {
  const orderNo = 'ORD' + Date.now()
  const { shipper_id, order_type, cargo_type, cargo_weight, cargo_volume, loading_address, unloading_address, loading_requirements, vehicle_type_required, vehicle_length_required, time_window_start, time_window_end, remark } = req.body

  const distance = Math.random() * 30 + 5
  const basePrice = calculatePrice(distance, vehicle_type_required || '厢货', order_type)
  const platformFee = basePrice * 0.1
  const driverIncome = basePrice - platformFee

  try {
    const result = db.prepare(`INSERT INTO orders (order_no, shipper_id, order_type, cargo_type, cargo_weight, cargo_volume, loading_address, unloading_address, loading_requirements, vehicle_type_required, vehicle_length_required, time_window_start, time_window_end, remark, distance, price, platform_fee, driver_income) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(orderNo, shipper_id, order_type || 'instant', cargo_type, cargo_weight, cargo_volume, loading_address, unloading_address, loading_requirements, vehicle_type_required, vehicle_length_required, time_window_start, time_window_end, remark, distance, basePrice, platformFee, driverIncome)

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid)
    res.json({ success: true, data: order })
  } catch (e) {
    console.error(e)
    res.json({ success: false, message: '创建订单失败' })
  }
})

function calculatePrice(distance, vehicleType, orderType) {
  const baseRate = {
    '面包车': 3,
    '厢货': 4,
    '平板': 4.5,
    '大货车': 6
  }
  const rate = baseRate[vehicleType] || 4
  let price = distance * rate
  if (orderType === 'appointment') price *= 1.1
  if (orderType === 'long_distance') price *= 1.2
  return Math.round(price * 100) / 100
}

app.post('/api/orders/:id/accept', (req, res) => {
  const { driver_id, vehicle_id } = req.body
  const orderId = req.params.id
  const now = new Date().toISOString()

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)
  if (order && order.status === 'pending') {
    db.prepare('UPDATE orders SET status = ?, driver_id = ?, vehicle_id = ?, accepted_at = ? WHERE id = ?').run('accepted', driver_id, vehicle_id, now, orderId)
    db.prepare('INSERT INTO order_tracking (order_id, status, remark) VALUES (?, ?, ?)').run(orderId, 'accepted', '司机已接单')

    const acceptTime = (new Date(now) - new Date(order.created_at)) / 1000
    db.prepare('INSERT INTO sla_records (order_id, accept_time, accept_standard, accept_passed) VALUES (?, ?, ?, ?)').run(orderId, acceptTime, 60, acceptTime <= 60 ? 1 : 0)

    res.json({ success: true })
  } else {
    res.json({ success: false, message: '订单状态不允许接单' })
  }
})

app.post('/api/orders/:id/arrive', (req, res) => {
  const orderId = req.params.id
  const now = new Date().toISOString()
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)

  if (order && order.status === 'accepted') {
    db.prepare('UPDATE orders SET status = ?, arrived_at = ? WHERE id = ?').run('arrived', now, orderId)
    db.prepare('INSERT INTO order_tracking (order_id, status, remark) VALUES (?, ?, ?)').run(orderId, 'arrived', '司机已到达装货点')

    const arriveTime = (new Date(now) - new Date(order.accepted_at)) / 1000
    const sla = db.prepare('SELECT * FROM sla_records WHERE order_id = ?').get(orderId)
    if (sla) {
      db.prepare('UPDATE sla_records SET arrive_time = ?, arrive_standard = ?, arrive_passed = ? WHERE id = ?').run(arriveTime, 300, arriveTime <= 300 ? 1 : 0, sla.id)
    }

    res.json({ success: true })
  } else {
    res.json({ success: false, message: '订单状态错误' })
  }
})

app.post('/api/orders/:id/complete', (req, res) => {
  const orderId = req.params.id
  const now = new Date().toISOString()

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)
  if (order && (order.status === 'arrived' || order.status === 'loaded')) {
    db.prepare('UPDATE orders SET status = ?, completed_at = ? WHERE id = ?').run('completed', now, orderId)
    db.prepare('INSERT INTO order_tracking (order_id, status, remark) VALUES (?, ?, ?)').run(orderId, 'completed', '订单已完成')

    const waybillNo = 'WB' + Date.now()
    db.prepare('INSERT INTO waybills (order_id, waybill_no) VALUES (?, ?)').run(orderId, waybillNo)

    res.json({ success: true })
  } else {
    res.json({ success: false, message: '订单状态错误' })
  }
})

app.get('/api/drivers', (req, res) => {
  const { status } = req.query
  let sql = 'SELECT d.*, u.name as user_name, u.phone FROM drivers d LEFT JOIN users u ON d.user_id = u.id WHERE 1=1'
  const params = []
  if (status) {
    sql += ' AND d.status = ?'
    params.push(status)
  }
  sql += ' ORDER BY d.created_at DESC'
  const drivers = db.prepare(sql).all(...params)
  res.json({ success: true, data: drivers })
})

app.post('/api/drivers/:id/verify', (req, res) => {
  const { status } = req.body
  const now = new Date().toISOString()
  db.prepare('UPDATE drivers SET status = ?, verified_at = ? WHERE id = ?').run(status, now, req.params.id)
  res.json({ success: true })
})

app.get('/api/vehicles', (req, res) => {
  const vehicles = db.prepare('SELECT v.*, d.real_name as driver_name FROM vehicles v LEFT JOIN drivers d ON v.driver_id = d.id').all()
  res.json({ success: true, data: vehicles })
})

app.get('/api/vehicles/driver/:driverId', (req, res) => {
  const vehicles = db.prepare('SELECT * FROM vehicles WHERE driver_id = ?').all(req.params.driverId)
  res.json({ success: true, data: vehicles })
})

app.post('/api/vehicles', (req, res) => {
  const { driver_id, plate_number, vehicle_type, vehicle_length, max_weight, max_volume } = req.body
  try {
    const result = db.prepare('INSERT INTO vehicles (driver_id, plate_number, vehicle_type, vehicle_length, max_weight, max_volume) VALUES (?, ?, ?, ?, ?, ?)').run(driver_id, plate_number, vehicle_type, vehicle_length, max_weight, max_volume)
    res.json({ success: true, data: { id: result.lastInsertRowid } })
  } catch (e) {
    res.json({ success: false, message: '车牌已存在' })
  }
})

app.get('/api/statistics/sla', (req, res) => {
  const slaStats = db.prepare(`
    SELECT
      COUNT(*) as total_orders,
      SUM(CASE WHEN accept_passed = 1 THEN 1 ELSE 0 END) as accept_passed_count,
      SUM(CASE WHEN arrive_passed = 1 THEN 1 ELSE 0 END) as arrive_passed_count,
      AVG(accept_time) as avg_accept_time,
      AVG(arrive_time) as avg_arrive_time
    FROM sla_records
    WHERE created_at >= datetime('now', '-7 day')
  `).get()

  res.json({
    success: true,
    data: {
      ...slaStats,
      accept_rate: slaStats.total_orders ? (slaStats.accept_passed_count / slaStats.total_orders * 100).toFixed(1) : 0,
      arrive_rate: slaStats.total_orders ? (slaStats.arrive_passed_count / slaStats.total_orders * 100).toFixed(1) : 0
    }
  })
})

app.get('/api/statistics/overview', (req, res) => {
  const todayOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE date(created_at) = date('now')").get().count
  const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").get().count
  const totalDrivers = db.prepare("SELECT COUNT(*) as count FROM drivers WHERE status = 'verified'").get().count
  const totalRevenue = db.prepare("SELECT SUM(price) as total FROM orders WHERE status = 'completed' AND date(created_at) >= date('now', '-30 day')").get().total || 0

  res.json({
    success: true,
    data: {
      today_orders: todayOrders,
      pending_orders: pendingOrders,
      active_drivers: totalDrivers,
      monthly_revenue: totalRevenue
    }
  })
})

app.get('/api/heatmap/routes', (req, res) => {
  const routes = db.prepare(`
    SELECT
      substr(loading_address, 1, 3) as from_city,
      substr(unloading_address, 1, 3) as to_city,
      COUNT(*) as order_count,
      SUM(price) as total_revenue
    FROM orders
    WHERE status = 'completed'
    GROUP BY from_city, to_city
    ORDER BY order_count DESC
    LIMIT 20
  `).all()
  res.json({ success: true, data: routes })
})

app.get('/api/exceptions', (req, res) => {
  const exceptions = db.prepare(`
    SELECT oe.*, o.order_no, u.name as reporter_name
    FROM order_exceptions oe
    LEFT JOIN orders o ON oe.order_id = o.id
    LEFT JOIN users u ON oe.reporter_id = u.id
    ORDER BY oe.created_at DESC
  `).all()
  res.json({ success: true, data: exceptions })
})

app.post('/api/exceptions', (req, res) => {
  const { order_id, reporter_id, type, description, evidence } = req.body
  const result = db.prepare(`
    INSERT INTO order_exceptions (order_id, reporter_id, type, description, evidence)
    VALUES (?, ?, ?, ?, ?)
  `).run(order_id, reporter_id, type, description, evidence)
  res.json({ success: true, data: { id: result.lastInsertRowid } })
})

app.post('/api/exceptions/:id/handle', (req, res) => {
  const { handler_id, result } = req.body
  const now = new Date().toISOString()
  db.prepare('UPDATE order_exceptions SET status = ?, handler_id = ?, result = ?, handled_at = ? WHERE id = ?').run('handled', handler_id, result, now, req.params.id)
  res.json({ success: true })
})

app.get('/api/capacity', (req, res) => {
  const { city } = req.query
  let sql = `
    SELECT cp.*, d.real_name, v.vehicle_type, v.vehicle_length, v.plate_number
    FROM capacity_pool cp
    LEFT JOIN drivers d ON cp.driver_id = d.id
    LEFT JOIN vehicles v ON cp.vehicle_id = v.id
    WHERE cp.status = 'online'
  `
  const params = []
  if (city) {
    sql += ' AND cp.city = ?'
    params.push(city)
  }
  const capacity = db.prepare(sql).all(...params)
  res.json({ success: true, data: capacity })
})

app.post('/api/capacity/update', (req, res) => {
  const { driver_id, vehicle_id, city, lat, lng } = req.body
  const existing = db.prepare('SELECT * FROM capacity_pool WHERE driver_id = ?').get(driver_id)
  const now = new Date().toISOString()

  if (existing) {
    db.prepare('UPDATE capacity_pool SET vehicle_id = ?, city = ?, lat = ?, lng = ?, last_updated = ? WHERE driver_id = ?').run(vehicle_id, city, lat, lng, now, driver_id)
  } else {
    db.prepare('INSERT INTO capacity_pool (driver_id, vehicle_id, city, lat, lng, last_updated) VALUES (?, ?, ?, ?, ?, ?)').run(driver_id, vehicle_id, city, lat, lng, now)
  }
  res.json({ success: true })
})

app.get('/api/pricing/calculate', (req, res) => {
  const { distance, vehicle_type, order_type } = req.query
  const price = calculatePrice(parseFloat(distance), vehicle_type, order_type)
  const platformFee = price * 0.1
  const driverIncome = price - platformFee
  res.json({
    success: true,
    data: {
      price,
      platform_fee: platformFee,
      driver_income: driverIncome
    }
  })
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`)
})
