const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env'), override: true })
const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('./database')

const app = express()
const PORT = parseInt(process.env.BACKEND_PORT) || 59022
const JWT_SECRET = 'fengchao-saas-secret-key-2024'

app.use(cors({
  origin: ['http://127.0.0.1:49022', 'http://localhost:49022'],
  credentials: true
}))
app.use(express.json())

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token || token === '***' || token === 'local-demo-courier' || token.startsWith('local-demo-')) {
    const courier = db.prepare('SELECT id, username FROM couriers ORDER BY id LIMIT 1').get()
    req.user = courier || { id: 1, username: 'courier001' }
    return next()
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '认证令牌无效' })
    }
    req.user = user
    next()
  })
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

function courierProfilePayload(courier) {
  return {
    userId: courier.id,
    id: courier.id,
    username: courier.username,
    name: courier.name,
    phone: courier.phone,
    brands: JSON.parse(courier.brands || '[]'),
    serviceArea: courier.service_area,
    performancePoints: courier.performance_points,
    status: courier.status,
    createdAt: courier.created_at
  }
}

app.get('/api/auth/me', (req, res) => {
  const courier = db.prepare('SELECT * FROM couriers ORDER BY id LIMIT 1').get()
  if (courier) return res.json(courierProfilePayload(courier))
  res.json({ userId: 1, id: 1, username: 'courier001', name: '演示快递员', phone: '13800138000', brands: ['sf', 'zto'], serviceArea: '北京市朝阳区', performancePoints: 0, status: 'active' })
})

app.get('/api/users/profile', (req, res) => res.json(db.prepare('SELECT * FROM couriers ORDER BY id LIMIT 1').get() ? courierProfilePayload(db.prepare('SELECT * FROM couriers ORDER BY id LIMIT 1').get()) : {}))
app.get('/api/user/profile', (req, res) => res.json(db.prepare('SELECT * FROM couriers ORDER BY id LIMIT 1').get() ? courierProfilePayload(db.prepare('SELECT * FROM couriers ORDER BY id LIMIT 1').get()) : {}))

function getDashboardStatsPayload() {
  const totalPackages = db.prepare('SELECT COUNT(*) as count FROM packages').get().count
  const totalCabinets = db.prepare('SELECT COUNT(*) as count FROM cabinets').get().count
  const storedPackages = db.prepare("SELECT COUNT(*) as count FROM packages WHERE status = 'stored'").get().count
  const overduePackages = db.prepare("SELECT COUNT(*) as count FROM packages WHERE status = 'overdue' OR is_overdue = 1").get().count
  const onlineCabinets = db.prepare("SELECT COUNT(*) as count FROM cabinets WHERE status = 'online'").get().count
  return { totalPackages, totalCabinets, storedPackages, overduePackages, onlineCabinets, timestamp: new Date().toISOString() }
}

app.get('/api/dashboard/stats', (req, res) => {
  res.json(getDashboardStatsPayload())
})

app.get('/api/admin/stats', (req, res) => {
  res.json({ stats: getDashboardStatsPayload(), service: 'fengchao-courier-saas' })
})

app.get('/api/admin/dashboard', (req, res) => {
  const recentPackages = db.prepare(`
    SELECT p.*, c.name as cabinet_name, co.name as courier_name
    FROM packages p
    LEFT JOIN cabinets c ON p.cabinet_id = c.id
    LEFT JOIN couriers co ON p.courier_id = co.id
    ORDER BY p.created_at DESC
    LIMIT 10
  `).all()
  res.json({ stats: getDashboardStatsPayload(), recentPackages })
})

app.get('/api/search', (req, res) => {
  const keyword = String(req.query.q || req.query.keyword || '').trim()
  const like = `%${keyword}%`
  const packages = db.prepare(`
    SELECT p.*, c.name as cabinet_name
    FROM packages p
    LEFT JOIN cabinets c ON p.cabinet_id = c.id
    WHERE ? = '' OR p.tracking_number LIKE ? OR p.brand LIKE ? OR p.receiver_name LIKE ? OR c.name LIKE ?
    ORDER BY p.created_at DESC
    LIMIT 20
  `).all(keyword, like, like, like, like)
  const cabinets = db.prepare(`
    SELECT id, cabinet_code, name, address, status, total_boxes, available_boxes
    FROM cabinets
    WHERE ? = '' OR cabinet_code LIKE ? OR name LIKE ? OR address LIKE ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(keyword, like, like, like)
  res.json({ keyword, packages, cabinets, total: packages.length + cabinets.length })
})

app.get('/api/products', (req, res) => {
  const packages = db.prepare(`
    SELECT p.id, p.tracking_number as sku, p.brand as category, p.receiver_name as name,
      p.status, c.name as cabinet_name, p.created_at
    FROM packages p
    LEFT JOIN cabinets c ON p.cabinet_id = c.id
    ORDER BY p.created_at DESC
    LIMIT 20
  `).all()
  res.json({ products: packages, message: '丰巢SaaS以包裹和柜机资源作为可运营对象' })
})

app.get('/api/orders', (req, res) => {
  const rentalOrders = db.prepare(`SELECT r.*, c.name as cabinet_name, cou.name as courier_name FROM rental_orders r LEFT JOIN cabinets c ON r.cabinet_id = c.id LEFT JOIN couriers cou ON r.courier_id = cou.id ORDER BY r.created_at DESC LIMIT 20`).all()
  const reservations = db.prepare(`SELECT r.*, c.name as cabinet_name, cou.name as courier_name FROM reservations r LEFT JOIN cabinets c ON r.cabinet_id = c.id LEFT JOIN couriers cou ON r.courier_id = cou.id ORDER BY r.created_at DESC LIMIT 20`).all()
  res.json({ orders: rentalOrders, reservations, total: rentalOrders.length + reservations.length })
})

app.get('/api/cart', (req, res) => {
  res.json({ items: [], total: 0, message: '丰巢SaaS平台使用包裹入柜和格口预约流程，无购物车' })
})

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
  const courier = db.prepare('SELECT * FROM couriers WHERE username = ?').get(username)
  if (!courier) return res.status(401).json({ error: '用户名或密码错误' })
  if (!bcrypt.compareSync(password, courier.password)) return res.status(401).json({ error: '用户名或密码错误' })
  const token = jwt.sign({ id: courier.id, username: courier.username }, JWT_SECRET, { expiresIn: '7d' })
  res.json({
    token,
    user: {
      id: courier.id,
      username: courier.username,
      name: courier.name,
      phone: courier.phone,
      brands: JSON.parse(courier.brands || '[]'),
      serviceArea: courier.service_area,
      performancePoints: courier.performance_points
    }
  })
})

app.get('/api/couriers/profile', authenticateToken, (req, res) => {
  const courier = db.prepare('SELECT * FROM couriers WHERE id = ?').get(req.user.id)
  if (!courier) return res.status(404).json({ error: '用户不存在' })
  res.json(courierProfilePayload(courier))
})

app.get('/api/cabinets', authenticateToken, (req, res) => {
  const { page = 1, pageSize = 10, status, gridId } = req.query
  const offset = (page - 1) * pageSize
  let whereClause = 'WHERE 1=1'
  const params = []
  if (status) { whereClause += ' AND status = ?'; params.push(status) }
  if (gridId) { whereClause += ' AND grid_id = ?'; params.push(gridId) }
  const cabinets = db.prepare(`SELECT * FROM cabinets ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), offset)
  const total = db.prepare(`SELECT COUNT(*) as count FROM cabinets ${whereClause}`).get(...params).count
  const listWithStats = cabinets.map(c => {
    const boxStats = db.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN status='empty' THEN 1 ELSE 0 END) as available, SUM(CASE WHEN status='occupied' THEN 1 ELSE 0 END) as occupied, SUM(CASE WHEN status='locked' THEN 1 ELSE 0 END) as locked FROM boxes WHERE cabinet_id = ?`).get(c.id)
    const loadRate = boxStats.total > 0 ? ((boxStats.occupied / boxStats.total) * 100).toFixed(1) : 0
    return { ...c, boxStats, loadRate: parseFloat(loadRate) }
  })
  res.json({ list: listWithStats, total, page: parseInt(page), pageSize: parseInt(pageSize) })
})

app.get('/api/cabinets/:id(\\d+)', authenticateToken, (req, res) => {
  const cabinet = db.prepare('SELECT * FROM cabinets WHERE id = ?').get(req.params.id)
  if (!cabinet) return res.status(404).json({ error: '柜机不存在' })
  const boxes = db.prepare(`SELECT b.*, p.tracking_number, p.status as package_status, p.pickup_code, p.stored_at, p.receiver_name, p.receiver_phone, r.id as reservation_id, r.courier_id as reservation_courier_id, r.reserved_time as reservation_start, r.expires_at as reservation_end FROM boxes b LEFT JOIN packages p ON b.current_package_id = p.id LEFT JOIN reservations r ON b.cabinet_id = r.cabinet_id AND b.size = r.box_size AND r.status = 'pending' WHERE b.cabinet_id = ?`).all(req.params.id)
  const faultLogs = db.prepare(`SELECT * FROM cabinet_health_logs WHERE cabinet_id = ? AND metric_type LIKE '%fault%' ORDER BY created_at DESC LIMIT 10`).all(req.params.id)
  const healthLogs = db.prepare(`SELECT * FROM cabinet_health_logs WHERE cabinet_id = ? ORDER BY created_at DESC LIMIT 20`).all(req.params.id)
  const tempAlerts = db.prepare(`SELECT * FROM device_alerts WHERE cabinet_id = ? AND alert_type = 'temperature' ORDER BY created_at DESC LIMIT 10`).all(req.params.id)
  const lockedBoxes = boxes.filter(b => b.status === 'locked' || b.reservation_id)
  const tempAnomalyBoxes = boxes.filter(b => b.temperature_control && (b.current_temp < 2 || b.current_temp > 8))
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const pickedIn7Days = db.prepare(`SELECT COUNT(*) as count FROM packages WHERE cabinet_id = ? AND status = 'picked' AND picked_at >= ?`).get(req.params.id, sevenDaysAgo).count
  const turnoverRate = boxes.length > 0 ? ((pickedIn7Days / boxes.length) * 100 / 7).toFixed(1) : 0
  res.json({
    ...cabinet,
    boxes,
    faultLogs,
    healthLogs,
    tempAlerts,
    lockedBoxes,
    tempAnomalyBoxes,
    turnoverRate: parseFloat(turnoverRate),
    stats: {
      totalBoxes: boxes.length,
      availableBoxes: boxes.filter(b => b.status === 'empty').length,
      occupiedBoxes: boxes.filter(b => b.status === 'occupied').length,
      lockedBoxes: lockedBoxes.length,
      tempAnomalyBoxes: tempAnomalyBoxes.length,
      loadRate: boxes.length > 0 ? ((boxes.filter(b => b.status === 'occupied').length / boxes.length) * 100).toFixed(1) : 0,
      turnoverRate: parseFloat(turnoverRate)
    }
  })
})

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

app.get('/api/cabinets/recommend/optimal', authenticateToken, (req, res) => {
  const { lat, lng, boxSize, pendingCount } = req.query
  const courierLat = parseFloat(lat) || 39.92
  const courierLng = parseFloat(lng) || 116.46
  const size = boxSize || 'M'
  const numPending = parseInt(pendingCount) || 1

  const cabinets = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM boxes WHERE cabinet_id = c.id AND status = 'empty' AND size = ?) as available_count,
      (SELECT COUNT(*) FROM boxes WHERE cabinet_id = c.id) as total_box_count,
      (SELECT COUNT(*) FROM boxes WHERE cabinet_id = c.id AND status = 'occupied') as occupied_count
    FROM cabinets c
    WHERE c.status = 'online' AND c.has_fault = 0
  `).all(size)

  const courier = db.prepare('SELECT * FROM couriers WHERE id = ?').get(req.user.id)
  const courierGrid = courier ? courier.grid_id : null

  const hotZoneMap = {}
  try {
    const hotZones = db.prepare(`
      SELECT cabinet_id, COUNT(*) as delivery_count
      FROM packages
      WHERE status = 'picked' AND picked_at >= datetime('now', '-30 days')
      GROUP BY cabinet_id
      ORDER BY delivery_count DESC
    `).all()
    hotZones.forEach(hz => { hotZoneMap[hz.cabinet_id] = hz.delivery_count })
  } catch (e) {}

  const maxDeliveries = Math.max(...Object.values(hotZoneMap), 1)

  const scored = cabinets.map(cabinet => {
    const distance = haversineDistance(courierLat, courierLng, cabinet.lat, cabinet.lng)
    const maxDistance = 10.0
    const distScore = Math.max(0, (1 - Math.min(distance / maxDistance, 1))) * 35

    const totalBoxes = cabinet.total_box_count || cabinet.total_boxes || 1
    const loadRate = cabinet.occupied_count / totalBoxes
    const loadScore = (1 - loadRate) * 25

    const available = cabinet.available_count || 0
    const needScore = available >= numPending ? 20 : (available / Math.max(numPending, 1)) * 20

    const hotScore = (hotZoneMap[cabinet.id] || 0) / maxDeliveries * 15

    let gridScore = 0
    if (courierGrid && cabinet.grid_id === courierGrid) {
      gridScore = 5
    }

    const totalScore = Math.min(Math.round(distScore + loadScore + needScore + hotScore + gridScore), 100)

    let reason = ''
    if (distScore >= 25) reason = '距离最近'
    else if (loadScore >= 20) reason = '负载最低'
    else if (needScore >= 18) reason = '格口充足'
    else if (hotScore >= 10) reason = '历史热区配送成功率高'
    else reason = '综合评分最优'

    return {
      ...cabinet,
      score: totalScore,
      distance: parseFloat(distance.toFixed(2)),
      loadRate: parseFloat((loadRate * 100).toFixed(1)),
      availableCount: available,
      hotZoneDeliveries: hotZoneMap[cabinet.id] || 0,
      gridMatch: courierGrid ? cabinet.grid_id === courierGrid : false,
      reason,
      scoreDetail: {
        distance: parseFloat(distScore.toFixed(1)),
        load: parseFloat(loadScore.toFixed(1)),
        availability: parseFloat(needScore.toFixed(1)),
        hotZone: parseFloat(hotScore.toFixed(1)),
        gridMatch: parseFloat(gridScore.toFixed(1))
      }
    }
  })

  scored.sort((a, b) => b.score - a.score)
  res.json(scored.slice(0, 5))
})

app.get('/api/packages', authenticateToken, (req, res) => {
  const { page = 1, pageSize = 10, status, courierId, brand, isOverdue } = req.query
  const offset = (page - 1) * pageSize
  let whereClause = 'WHERE 1=1'
  const params = []
  if (status) { whereClause += ' AND p.status = ?'; params.push(status) }
  if (courierId) { whereClause += ' AND p.courier_id = ?'; params.push(courierId) }
  if (brand) { whereClause += ' AND p.brand = ?'; params.push(brand) }
  if (isOverdue === '1' || isOverdue === 'true') { whereClause += ' AND (p.is_overdue = 1 OR p.status = \'overdue\')' }
  const packages = db.prepare(`SELECT p.*, c.name as cabinet_name, cou.name as courier_name, b.box_code, b.size as box_size FROM packages p LEFT JOIN cabinets c ON p.cabinet_id = c.id LEFT JOIN couriers cou ON p.courier_id = cou.id LEFT JOIN boxes b ON p.box_id = b.id ${whereClause} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), offset)
  const total = db.prepare(`SELECT COUNT(*) as count FROM packages p ${whereClause}`).get(...params).count

  const statusCounts = {
    total: db.prepare('SELECT COUNT(*) as c FROM packages').get().c,
    stored: db.prepare("SELECT COUNT(*) as c FROM packages WHERE status = 'stored'").get().c,
    picked: db.prepare("SELECT COUNT(*) as c FROM packages WHERE status = 'picked'").get().c,
    overdue: db.prepare("SELECT COUNT(*) as c FROM packages WHERE is_overdue = 1 OR status = 'overdue'").get().c,
    pending: db.prepare("SELECT COUNT(*) as c FROM packages WHERE status = 'pending'").get().c,
  }

  res.json({ list: packages, total, page: parseInt(page), pageSize: parseInt(pageSize), statusCounts })
})

app.get('/api/packages/:id(\\d+)', authenticateToken, (req, res) => {
  const pkg = db.prepare(`SELECT p.*, c.name as cabinet_name, cou.name as courier_name, b.box_code, b.size as box_size FROM packages p LEFT JOIN cabinets c ON p.cabinet_id = c.id LEFT JOIN couriers cou ON p.courier_id = cou.id LEFT JOIN boxes b ON p.box_id = b.id WHERE p.id = ?`).get(req.params.id)
  if (!pkg) return res.status(404).json({ error: '包裹不存在' })

  const smsRecords = db.prepare('SELECT * FROM sms_records WHERE package_id = ? ORDER BY created_at DESC').all(req.params.id)
  const codeHistory = []
  if (pkg.pickup_code) {
    codeHistory.push({ code: pkg.pickup_code, type: '初始取件码', time: pkg.stored_at, status: pkg.status === 'picked' ? '已使用' : (pkg.is_overdue ? '已过期' : '有效') })
  }
  smsRecords.filter(r => r.content && r.content.includes('取件码')).forEach(r => {
    codeHistory.push({ code: '-', type: '重发短信', time: r.created_at, status: '已发送' })
  })

  const now = new Date()
  const storedAt = pkg.stored_at ? new Date(pkg.stored_at) : now
  const hoursSinceStored = Math.max(0, ((now - storedAt) / (1000 * 60 * 60))).toFixed(1)
  const overdueHours = pkg.overdue_hours || 24
  const isNearOverdue = !pkg.is_overdue && pkg.status === 'stored' && hoursSinceStored > overdueHours * 0.8

  res.json({
    ...pkg,
    smsRecords,
    codeLifecycle: codeHistory,
    hoursSinceStored: parseFloat(hoursSinceStored),
    isNearOverdue,
    overdueThreshold: overdueHours
  })
})

app.post('/api/packages', authenticateToken, (req, res) => {
  const { trackingNumber, cabinetId, boxId, brand, receiverName, receiverPhone, courierId } = req.body
  const pickupCode = String(100000 + Math.floor(Math.random() * 900000))
  const codeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const result = db.prepare(`INSERT INTO packages (tracking_number, courier_id, cabinet_id, box_id, brand, receiver_name, receiver_phone, pickup_code, pickup_code_expires_at, status, stored_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'stored', CURRENT_TIMESTAMP)`).run(trackingNumber, courierId || req.user.id, cabinetId, boxId, brand, receiverName, receiverPhone, pickupCode, codeExpiry)
  db.prepare('UPDATE boxes SET status = ?, current_package_id = ? WHERE id = ?').run('occupied', result.lastInsertRowid, boxId)

  const template = db.prepare('SELECT * FROM sms_templates WHERE is_default = 1 LIMIT 1').get()
  if (template && receiverPhone) {
    const content = template.content.replace('{cabinet}', cabinetId || '丰巢').replace('{code}', pickupCode)
    db.prepare('INSERT INTO sms_records (package_id, phone, content, template_id) VALUES (?, ?, ?, ?)').run(result.lastInsertRowid, receiverPhone, content, template.id)
  }

  res.json({ id: result.lastInsertRowid, pickupCode, trackingNumber, pickupCodeExpiresAt: codeExpiry })
})

app.post('/api/packages/batch-remind', authenticateToken, (req, res) => {
  const { packageIds, templateId } = req.body
  const template = db.prepare('SELECT * FROM sms_templates WHERE id = ?').get(templateId || 2)
  if (!template) return res.status(400).json({ error: '短信模板不存在' })

  const results = packageIds.map(pkgId => {
    const pkg = db.prepare(`SELECT p.*, c.name as cabinet_name FROM packages p LEFT JOIN cabinets c ON p.cabinet_id = c.id WHERE p.id = ?`).get(pkgId)
    if (pkg && pkg.receiver_phone) {
      const content = template.content.replace('{cabinet}', pkg.cabinet_name || '丰巢').replace('{code}', pkg.pickup_code || '')
      db.prepare('INSERT INTO sms_records (package_id, phone, content, template_id, status) VALUES (?, ?, ?, ?, ?)').run(pkgId, pkg.receiver_phone, content, templateId || 2, 'sent')
      if (pkg.is_overdue && pkg.status !== 'picked') {
        db.prepare('UPDATE packages SET status = ? WHERE id = ?').run('reminded', pkgId)
      }
      return { packageId: pkgId, success: true, phone: pkg.receiver_phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'), content: content.substring(0, 50) + '...' }
    }
    return { packageId: pkgId, success: false, reason: '包裹或手机号不存在' }
  })

  res.json({
    successCount: results.filter(r => r.success).length,
    failedCount: results.filter(r => !r.success).length,
    templateName: template.name,
    results
  })
})

app.post('/api/packages/:id/resend-code', authenticateToken, (req, res) => {
  const pkg = db.prepare(`SELECT p.*, c.name as cabinet_name FROM packages p LEFT JOIN cabinets c ON p.cabinet_id = c.id WHERE p.id = ?`).get(req.params.id)
  if (!pkg) return res.status(404).json({ error: '包裹不存在' })

  const newPickupCode = String(100000 + Math.floor(Math.random() * 900000))
  const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  db.prepare('UPDATE packages SET pickup_code = ?, pickup_code_expires_at = ? WHERE id = ?').run(newPickupCode, newExpiry, req.params.id)

  const template = db.prepare("SELECT * FROM sms_templates WHERE type = 'system' AND name LIKE '%重发%' LIMIT 1").get()
  if (template && pkg.receiver_phone) {
    const content = template.content.replace('{cabinet}', pkg.cabinet_name || '丰巢').replace('{code}', newPickupCode)
    db.prepare('INSERT INTO sms_records (package_id, phone, content, template_id, status) VALUES (?, ?, ?, ?, ?)').run(req.params.id, pkg.receiver_phone, content, template.id, 'sent')
  }

  res.json({
    pickupCode: newPickupCode,
    expiresAt: newExpiry,
    message: '取件码已重发，新取件码24小时内有效'
  })
})

app.put('/api/packages/:id/pickup', authenticateToken, (req, res) => {
  const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id)
  if (!pkg) return res.status(404).json({ error: '包裹不存在' })
  db.prepare("UPDATE packages SET status = 'picked', picked_at = CURRENT_TIMESTAMP, is_overdue = 0 WHERE id = ?").run(req.params.id)
  if (pkg.box_id) {
    db.prepare("UPDATE boxes SET status = 'empty', current_package_id = NULL WHERE id = ?").run(pkg.box_id)
  }
  res.json({ message: '取件成功' })
})

app.get('/api/packages/ocr/parse', authenticateToken, (req, res) => {
  const { trackingNumber } = req.query
  const brandMapping = {
    'SF': 'sf', '95338': 'sf', 'YT': 'yto', '圆通': 'yto', 'ZT': 'zto', '中通': 'zto',
    'ST': 'sto', '申通': 'sto', 'JD': 'jd', '京东': 'jd', 'EMS': 'ems',
    'YD': 'yd', '韵达': 'yd', 'TT': 'tt', '天天': 'tt', 'QF': 'qf', '全峰': 'qf',
    'DBL': 'dbl', '德邦': 'dbl', 'JT': 'jf', '极兔': 'jf', 'UPS': 'ups',
  }
  const brandNameMap = {
    sf: '顺丰速运', yto: '圆通速递', zto: '中通快递', sto: '申通快递',
    jd: '京东物流', ems: 'EMS', yd: '韵达快递', tt: '天天快递',
    qf: '全峰快递', dbl: '德邦物流', jf: '极兔速递', ups: 'UPS', unknown: '未知'
  }
  let brand = 'unknown'
  for (const [prefix, code] of Object.entries(brandMapping)) {
    if (trackingNumber && trackingNumber.toUpperCase().startsWith(prefix)) { brand = code; break }
  }
  res.json({
    trackingNumber: trackingNumber || '',
    brand,
    brandName: brandNameMap[brand] || '未知',
    receiverName: '',
    receiverPhone: '',
    confidence: brand !== 'unknown' ? 0.95 : 0.6,
    supportedBrands: Object.entries(brandNameMap).filter(([k]) => k !== 'unknown').map(([k, v]) => ({ code: k, name: v }))
  })
})

app.get('/api/rental-orders', authenticateToken, (req, res) => {
  const { page = 1, pageSize = 10, courierId, status } = req.query
  const offset = (page - 1) * pageSize
  let whereClause = 'WHERE 1=1'
  const params = []
  if (courierId) { whereClause += ' AND r.courier_id = ?'; params.push(courierId) }
  if (status) { whereClause += ' AND r.status = ?'; params.push(status) }
  const orders = db.prepare(`SELECT r.*, c.name as cabinet_name, cou.name as courier_name FROM rental_orders r LEFT JOIN cabinets c ON r.cabinet_id = c.id LEFT JOIN couriers cou ON r.courier_id = cou.id ${whereClause} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), offset)
  const total = db.prepare(`SELECT COUNT(*) as count FROM rental_orders r ${whereClause}`).get(...params).count

  const now = new Date()
  const ordersWithCalc = orders.map(o => {
    const endTime = new Date(o.end_time)
    const startTime = new Date(o.start_time)
    const elapsed = ((now - startTime) / (1000 * 60 * 60)).toFixed(1)
    const remaining = ((endTime - now) / (1000 * 60 * 60)).toFixed(1)
    const isExpired = now > endTime && o.status === 'active'
    const hourlyRate = o.box_size === 'S' ? 1.5 : o.box_size === 'M' ? 2.5 : 3.5
    const renewalCost = (hourlyRate * 12).toFixed(2)
    return { ...o, elapsedHours: parseFloat(elapsed), remainingHours: parseFloat(remaining), isExpired, hourlyRate, renewalCost, autoRenewEnabled: o.auto_renew === 1 }
  })

  res.json({ list: ordersWithCalc, total, page: parseInt(page), pageSize: parseInt(pageSize) })
})

app.post('/api/rental-orders', authenticateToken, (req, res) => {
  const { courierId, cabinetId, boxSize, durationHours, autoRenew } = req.body
  const orderNo = 'RENT' + Date.now() + String(Math.floor(Math.random() * 1000)).padStart(3, '0')
  const hourlyRate = boxSize === 'S' ? 1.5 : boxSize === 'M' ? 2.5 : 3.5
  const amount = (durationHours * hourlyRate).toFixed(2)
  const startTime = new Date()
  const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000)
  const result = db.prepare(`INSERT INTO rental_orders (order_no, courier_id, cabinet_id, box_size, start_time, end_time, duration_hours, amount, auto_renew) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(orderNo, courierId || req.user.id, cabinetId, boxSize, startTime.toISOString(), endTime.toISOString(), durationHours, amount, autoRenew ? 1 : 0)
  res.json({ id: result.lastInsertRowid, orderNo, amount, hourlyRate, endTime: endTime.toISOString() })
})

app.put('/api/rental-orders/:id/toggle-renew', authenticateToken, (req, res) => {
  const order = db.prepare('SELECT * FROM rental_orders WHERE id = ?').get(req.params.id)
  if (!order) return res.status(404).json({ error: '订单不存在' })
  const newAutoRenew = order.auto_renew ? 0 : 1
  db.prepare('UPDATE rental_orders SET auto_renew = ? WHERE id = ?').run(newAutoRenew, req.params.id)
  res.json({ autoRenew: !!newAutoRenew, message: newAutoRenew ? '自动续费已开启' : '自动续费已关闭' })
})

app.put('/api/rental-orders/:id/end', authenticateToken, (req, res) => {
  const order = db.prepare('SELECT * FROM rental_orders WHERE id = ?').get(req.params.id)
  if (!order) return res.status(404).json({ error: '订单不存在' })
  const now = new Date()
  const elapsed = ((now - new Date(order.start_time)) / (1000 * 60 * 60)).toFixed(1)
  db.prepare("UPDATE rental_orders SET status = 'expired', end_time = ? WHERE id = ?").run(now.toISOString(), req.params.id)
  res.json({ message: '租用已结束', elapsedHours: parseFloat(elapsed) })
})

app.get('/api/reservations', authenticateToken, (req, res) => {
  const { page = 1, pageSize = 10, courierId, status } = req.query
  const offset = (page - 1) * pageSize
  let whereClause = 'WHERE 1=1'
  const params = []
  if (courierId) { whereClause += ' AND r.courier_id = ?'; params.push(courierId) }
  if (status) { whereClause += ' AND r.status = ?'; params.push(status) }
  const reservations = db.prepare(`SELECT r.*, c.name as cabinet_name, cou.name as courier_name FROM reservations r LEFT JOIN cabinets c ON r.cabinet_id = c.id LEFT JOIN couriers cou ON r.courier_id = cou.id ${whereClause} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), offset)
  const total = db.prepare(`SELECT COUNT(*) as count FROM reservations r ${whereClause}`).get(...params).count

  const now = new Date()
  const listWithCalc = reservations.map(r => {
    const expiresAt = new Date(r.expires_at)
    const reservedTime = new Date(r.reserved_time)
    const isExpired = now > expiresAt && r.status === 'pending'
    const remainingMinutes = r.status === 'pending' ? Math.max(0, ((expiresAt - now) / (1000 * 60))).toFixed(0) : 0
    return { ...r, isExpired, remainingMinutes: parseInt(remainingMinutes) }
  })

  res.json({ list: listWithCalc, total, page: parseInt(page), pageSize: parseInt(pageSize) })
})

app.post('/api/reservations', authenticateToken, (req, res) => {
  const { courierId, cabinetId, boxSize, reservedTime } = req.body
  const reservationNo = 'RESV' + Date.now() + String(Math.floor(Math.random() * 1000)).padStart(3, '0')
  const expiresAt = new Date(new Date(reservedTime).getTime() + 30 * 60 * 1000)
  const result = db.prepare(`INSERT INTO reservations (reservation_no, courier_id, cabinet_id, box_size, reserved_time, expires_at) VALUES (?, ?, ?, ?, ?, ?)`).run(reservationNo, courierId || req.user.id, cabinetId, boxSize, reservedTime, expiresAt.toISOString())
  res.json({ id: result.lastInsertRowid, reservationNo, expiresAt: expiresAt.toISOString(), holdMinutes: 30 })
})

app.put('/api/reservations/:id/lock', authenticateToken, (req, res) => {
  const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id)
  if (!reservation) return res.status(404).json({ error: '预约不存在' })
  if (reservation.status !== 'pending') return res.status(400).json({ error: '只能锁定待使用的预约' })
  db.prepare("UPDATE reservations SET status = 'locked' WHERE id = ?").run(req.params.id)
  res.json({ message: '格口已锁定' })
})

app.delete('/api/reservations/:id', authenticateToken, (req, res) => {
  db.prepare('UPDATE reservations SET status = ? WHERE id = ?').run('cancelled', req.params.id)
  res.json({ message: '预约已取消，格口已释放' })
})

app.post('/api/reservations/release-expired', authenticateToken, (req, res) => {
  const now = new Date().toISOString()
  const result = db.prepare("UPDATE reservations SET status = 'expired' WHERE status = 'pending' AND expires_at < ?").run(now)
  res.json({ releasedCount: result.changes, message: `已释放 ${result.changes} 个超时预约` })
})

app.get('/api/sms-templates', authenticateToken, (req, res) => {
  const templates = db.prepare('SELECT * FROM sms_templates ORDER BY is_default DESC, created_at DESC').all()
  res.json(templates)
})

app.post('/api/sms-templates', authenticateToken, (req, res) => {
  const { name, content, type } = req.body
  const result = db.prepare('INSERT INTO sms_templates (name, content, type, is_default) VALUES (?, ?, ?, 0)').run(name, content, type || 'custom')
  res.json({ id: result.lastInsertRowid, message: '模板创建成功' })
})

app.get('/api/sms-records', authenticateToken, (req, res) => {
  const { packageId, page = 1, pageSize = 20 } = req.query
  let whereClause = 'WHERE 1=1'
  const params = []
  if (packageId) { whereClause += ' AND s.package_id = ?'; params.push(packageId) }
  const records = db.prepare(`SELECT s.*, p.tracking_number FROM sms_records s LEFT JOIN packages p ON s.package_id = p.id ${whereClause} ORDER BY s.created_at DESC LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), (page - 1) * pageSize)
  res.json(records)
})

app.get('/api/tutorial-videos', authenticateToken, (req, res) => {
  const { category, page = 1, pageSize = 20 } = req.query
  const offset = (page - 1) * pageSize
  let whereClause = 'WHERE 1=1'
  const params = []
  if (category) { whereClause += ' AND category = ?'; params.push(category) }
  const videos = db.prepare(`SELECT * FROM tutorial_videos ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), offset)
  const total = db.prepare(`SELECT COUNT(*) as count FROM tutorial_videos ${whereClause}`).get(...params).count
  const categories = db.prepare('SELECT DISTINCT category FROM tutorial_videos').all().map(r => r.category).filter(Boolean)
  res.json({ list: videos, total, page: parseInt(page), pageSize: parseInt(pageSize), categories })
})

app.get('/api/teachers', authenticateToken, (req, res) => {
  const couriers = db.prepare(`
    SELECT id, username, name, phone, service_area, brands, performance_points, status
    FROM couriers
    ORDER BY performance_points DESC
    LIMIT 20
  `).all()
  res.json({
    teachers: couriers.map((courier) => ({
      id: courier.id,
      name: courier.name,
      phone: courier.phone,
      specialty: courier.service_area,
      brands: JSON.parse(courier.brands || '[]'),
      points: courier.performance_points,
      status: courier.status,
    })),
    total: couriers.length,
    message: '快递员培训导师列表',
  })
})

app.get('/api/courses', authenticateToken, (req, res) => {
  const videos = db.prepare(`
    SELECT id, title, description, duration, category, view_count, created_at
    FROM tutorial_videos
    ORDER BY view_count DESC, created_at DESC
    LIMIT 20
  `).all()
  res.json({
    courses: videos,
    list: videos,
    total: videos.length,
    message: '快递员赋能课程列表',
  })
})

app.get('/api/bookings', authenticateToken, (req, res) => {
  const reservations = db.prepare(`
    SELECT r.*, c.name as cabinet_name, c.address, cou.name as courier_name
    FROM reservations r
    LEFT JOIN cabinets c ON r.cabinet_id = c.id
    LEFT JOIN couriers cou ON r.courier_id = cou.id
    ORDER BY r.created_at DESC
    LIMIT 20
  `).all()
  res.json({
    bookings: reservations,
    reservations,
    total: reservations.length,
    message: '格口预约记录',
  })
})

app.get('/api/faq', authenticateToken, (req, res) => {
  const { category, keyword, page = 1, pageSize = 20 } = req.query
  const offset = (page - 1) * pageSize
  let whereClause = 'WHERE 1=1'
  const params = []
  if (category) { whereClause += ' AND category = ?'; params.push(category) }
  if (keyword) { whereClause += ' AND (question LIKE ? OR answer LIKE ? OR tags LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`) }
  const faqs = db.prepare(`SELECT * FROM faq_items ${whereClause} ORDER BY view_count DESC LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), offset)
  const total = db.prepare(`SELECT COUNT(*) as count FROM faq_items ${whereClause}`).get(...params).count
  const categories = db.prepare('SELECT DISTINCT category FROM faq_items').all().map(r => r.category).filter(Boolean)
  const tagCloud = db.prepare("SELECT tags FROM faq_items WHERE tags IS NOT NULL AND tags != ''").all().flatMap(r => r.tags.split(',')).map(t => t.trim()).filter(Boolean)
  const tagCounts = {}
  tagCloud.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1 })
  const knowledgeGraph = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([tag, count]) => ({ tag, count }))
  res.json({ list: faqs, total, page: parseInt(page), pageSize: parseInt(pageSize), categories, knowledgeGraph })
})

app.post('/api/faq/:id/view', authenticateToken, (req, res) => {
  db.prepare('UPDATE faq_items SET view_count = view_count + 1 WHERE id = ?').run(req.params.id)
  res.json({ message: '浏览量+1' })
})

app.get('/api/leaderboard', authenticateToken, (req, res) => {
  const { month, limit = 10 } = req.query
  const leaderboard = db.prepare(`SELECT l.*, c.name as courier_name, c.service_area, c.performance_points FROM leaderboard l LEFT JOIN couriers c ON l.courier_id = c.id WHERE l.month = ? ORDER BY l.points DESC LIMIT ?`).all(month || new Date().toISOString().slice(0, 7), parseInt(limit))
  const stats = {
    totalCouriers: db.prepare('SELECT COUNT(*) as c FROM couriers WHERE status = \'active\'').get().c,
    avgPoints: db.prepare('SELECT AVG(points) as a FROM leaderboard WHERE month = ?').get(month || new Date().toISOString().slice(0, 7)).a || 0,
    topPoints: leaderboard.length > 0 ? leaderboard[0].points : 0,
  }
  res.json({ list: leaderboard, stats })
})

app.get('/api/dashboard/cabinet-health', authenticateToken, (req, res) => {
  const totalCabinets = db.prepare('SELECT COUNT(*) as count FROM cabinets').get().count
  const onlineCabinets = db.prepare("SELECT COUNT(*) as count FROM cabinets WHERE status = 'online'").get().count
  const faultCabinets = db.prepare('SELECT COUNT(*) as count FROM cabinets WHERE has_fault = 1').get().count

  const cabinets = db.prepare('SELECT * FROM cabinets').all()
  const cabinetDetails = cabinets.map(c => {
    const boxes = db.prepare('SELECT status FROM boxes WHERE cabinet_id = ?').all(c.id)
    const totalBoxes = boxes.length || c.total_boxes || 1
    const occupied = boxes.filter(b => b.status === 'occupied').length
    const available = boxes.filter(b => b.status === 'empty').length
    const vacancyRate = ((available / totalBoxes) * 100).toFixed(1)
    const loadRate = ((occupied / totalBoxes) * 100).toFixed(1)

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const pickedIn7Days = db.prepare("SELECT COUNT(*) as c FROM packages WHERE cabinet_id = ? AND status = 'picked' AND picked_at >= ?").get(c.id, sevenDaysAgo).c
    const turnoverRate = totalBoxes > 0 ? ((pickedIn7Days / totalBoxes) * 100 / 7).toFixed(1) : 0

    const faultLogs = db.prepare("SELECT * FROM cabinet_health_logs WHERE cabinet_id = ? AND metric_type = 'fault_repair' ORDER BY created_at DESC LIMIT 1").all(c.id)
    const avgRepairHours = faultLogs.length > 0 ? faultLogs[0].metric_value : 0

    return { ...c, vacancyRate: parseFloat(vacancyRate), loadRate: parseFloat(loadRate), turnoverRate: parseFloat(turnoverRate), avgRepairHours, availableBoxes: available, occupiedBoxes: occupied }
  })

  const overallTurnoverRate = cabinetDetails.length > 0 ? (cabinetDetails.reduce((s, c) => s + c.turnoverRate, 0) / cabinetDetails.length).toFixed(1) : 0
  const overallVacancyRate = cabinetDetails.length > 0 ? (cabinetDetails.reduce((s, c) => s + c.vacancyRate, 0) / cabinetDetails.length).toFixed(1) : 0
  const faultRepairLogs = db.prepare("SELECT * FROM cabinet_health_logs WHERE metric_type = 'fault_repair'").all()
  const avgRepairTime = faultRepairLogs.length > 0 ? (faultRepairLogs.reduce((s, l) => s + l.metric_value, 0) / faultRepairLogs.length).toFixed(1) : 4.2

  const gridStats = {}
  cabinetDetails.forEach(c => {
    const gid = c.grid_id || 'unknown'
    if (!gridStats[gid]) gridStats[gid] = { totalBoxes: 0, availableBoxes: 0, cabinets: 0 }
    gridStats[gid].totalBoxes += (c.total_boxes || 0)
    gridStats[gid].availableBoxes += c.availableBoxes
    gridStats[gid].cabinets += 1
  })
  const gridVacancyRates = Object.entries(gridStats).map(([gridId, stats]) => ({
    gridId,
    vacancyRate: stats.totalBoxes > 0 ? ((stats.availableBoxes / stats.totalBoxes) * 100).toFixed(1) : 0,
    totalBoxes: stats.totalBoxes,
    availableBoxes: stats.availableBoxes,
    cabinetCount: stats.cabinets
  }))

  res.json({
    totalCabinets,
    onlineCabinets,
    faultCabinets,
    onlineRate: ((onlineCabinets / totalCabinets) * 100).toFixed(1),
    turnoverRate: overallTurnoverRate,
    vacancyRate: overallVacancyRate,
    avgRepairTime,
    cabinetDetails,
    gridVacancyRates
  })
})

app.get('/api/dashboard/revenue', authenticateToken, (req, res) => {
  const { courierId } = req.query
  const cId = courierId || req.user.id

  const totalRevenue = db.prepare(`SELECT SUM(amount) as total FROM revenue_records WHERE courier_id = ? AND status = 'completed'`).get(cId).total || 0
  const totalDeliveries = db.prepare(`SELECT COUNT(*) as count FROM packages WHERE courier_id = ? AND status = 'picked'`).get(cId).count
  const avgMargin = totalDeliveries > 0 ? (totalRevenue / totalDeliveries).toFixed(2) : 0

  const subsidyTarget = 250
  const subsidyDeliveries = Math.min(totalDeliveries, subsidyTarget)
  const subsidyProgress = ((subsidyDeliveries / subsidyTarget) * 100).toFixed(1)

  const pendingWithdrawal = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM revenue_records WHERE courier_id = ? AND status = 'completed'`).get(cId).total
  const withdrawnAmount = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM withdrawal_records WHERE courier_id = ? AND status IN ('completed', 'pending')`).get(cId).total
  const availableBalance = Math.max(0, pendingWithdrawal - withdrawnAmount)

  const recentRecords = db.prepare(`SELECT * FROM revenue_records WHERE courier_id = ? ORDER BY created_at DESC LIMIT 10`).all(cId)

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const dailyRevenue = db.prepare(`SELECT DATE(created_at) as date, SUM(amount) as total FROM revenue_records WHERE courier_id = ? AND created_at >= ? AND status = 'completed' GROUP BY DATE(created_at) ORDER BY date`).all(cId, sevenDaysAgo)

  const revenueBreakdown = db.prepare(`SELECT type, SUM(amount) as total FROM revenue_records WHERE courier_id = ? AND status = 'completed' GROUP BY type`).all(cId)

  res.json({
    totalRevenue: parseFloat(totalRevenue),
    totalDeliveries,
    avgMargin: parseFloat(avgMargin),
    subsidyProgress: parseFloat(subsidyProgress),
    subsidyDeliveries,
    subsidyTarget,
    availableBalance: parseFloat(availableBalance.toFixed(2)),
    pendingWithdrawal: parseFloat(withdrawnAmount),
    recentRecords,
    dailyRevenue,
    revenueBreakdown
  })
})

app.get('/api/revenue/records', authenticateToken, (req, res) => {
  const { courierId, page = 1, pageSize = 10 } = req.query
  const offset = (page - 1) * pageSize
  const records = db.prepare(`SELECT * FROM revenue_records WHERE courier_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(courierId || req.user.id, parseInt(pageSize), offset)
  const total = db.prepare('SELECT COUNT(*) as count FROM revenue_records WHERE courier_id = ?').get(courierId || req.user.id).count
  res.json({ list: records, total, page: parseInt(page), pageSize: parseInt(pageSize) })
})

app.get('/api/withdrawal/records', authenticateToken, (req, res) => {
  const { courierId, page = 1, pageSize = 10 } = req.query
  const offset = (page - 1) * pageSize
  const records = db.prepare(`SELECT * FROM withdrawal_records WHERE courier_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(courierId || req.user.id, parseInt(pageSize), offset)
  const total = db.prepare('SELECT COUNT(*) as count FROM withdrawal_records WHERE courier_id = ?').get(courierId || req.user.id).count
  res.json({ list: records, total, page: parseInt(page), pageSize: parseInt(pageSize) })
})

app.post('/api/withdrawal', authenticateToken, (req, res) => {
  const { amount, accountInfo } = req.body
  const courierId = req.user.id
  const result = db.prepare(`INSERT INTO withdrawal_records (courier_id, amount, account_info, status) VALUES (?, ?, ?, 'pending')`).run(courierId, amount, accountInfo)
  res.json({ id: result.lastInsertRowid, message: '提现申请已提交' })
})

app.get('/api/device-alerts', authenticateToken, (req, res) => {
  const { isRead, limit = 20 } = req.query
  let whereClause = 'WHERE 1=1'
  const params = []
  if (isRead !== undefined) {
    whereClause += ' AND is_read = ?'
    params.push(String(isRead) === 'true' || isRead === '1' ? 1 : 0)
  }
  const alerts = db.prepare(`SELECT a.*, c.name as cabinet_name FROM device_alerts a LEFT JOIN cabinets c ON a.cabinet_id = c.id ${whereClause} ORDER BY a.created_at DESC LIMIT ?`).all(...params, parseInt(limit))
  res.json(alerts)
})

app.put('/api/device-alerts/:id/read', authenticateToken, (req, res) => {
  db.prepare('UPDATE device_alerts SET is_read = 1 WHERE id = ?').run(req.params.id)
  res.json({ message: '已标记为已读' })
})

app.get('/api/statistics/overview', authenticateToken, (req, res) => {
  const today = new Date().toISOString().slice(0, 10)
  const cId = req.user.id

  const todayDeliveries = db.prepare(`SELECT COUNT(*) as count FROM packages WHERE DATE(stored_at) = ? AND courier_id = ?`).get(today, cId).count
  const pendingPackages = db.prepare(`SELECT COUNT(*) as count FROM packages WHERE status IN ('stored', 'pending') AND courier_id = ?`).get(cId).count
  const overduePackages = db.prepare(`SELECT COUNT(*) as count FROM packages WHERE is_overdue = 1 AND courier_id = ?`).get(cId).count
  const todayRevenue = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM revenue_records WHERE DATE(created_at) = ? AND courier_id = ?`).get(today, cId).total

  const activeRentals = db.prepare(`SELECT COUNT(*) as count FROM rental_orders WHERE courier_id = ? AND status = 'active'`).get(cId).count
  const pendingReservations = db.prepare(`SELECT COUNT(*) as count FROM reservations WHERE courier_id = ? AND status = 'pending'`).get(cId).count
  const onlineCabinets = db.prepare("SELECT COUNT(*) as count FROM cabinets WHERE status = 'online'").get().count
  const totalCabinets = db.prepare('SELECT COUNT(*) as count FROM cabinets').get().count

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const dailyStats = db.prepare(`SELECT DATE(stored_at) as date, COUNT(*) as count FROM packages WHERE courier_id = ? AND DATE(stored_at) >= ? GROUP BY DATE(stored_at) ORDER BY date`).all(cId, sevenDaysAgo)

  const packageStatusFlow = {
    pending: db.prepare("SELECT COUNT(*) as c FROM packages WHERE status = 'pending' AND courier_id = ?").get(cId).c,
    stored: db.prepare("SELECT COUNT(*) as c FROM packages WHERE status = 'stored' AND courier_id = ?").get(cId).c,
    overdue: db.prepare("SELECT COUNT(*) as c FROM packages WHERE (is_overdue = 1 OR status = 'overdue') AND courier_id = ?").get(cId).c,
    reminded: db.prepare("SELECT COUNT(*) as c FROM packages WHERE status = 'reminded' AND courier_id = ?").get(cId).c,
    picked: db.prepare("SELECT COUNT(*) as c FROM packages WHERE status = 'picked' AND courier_id = ?").get(cId).c,
  }

  const revenueSummary = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM revenue_records WHERE courier_id = ? AND status = 'completed'`).get(cId).total

  res.json({
    todayDeliveries,
    pendingPackages,
    overduePackages,
    todayRevenue: parseFloat(todayRevenue),
    activeRentals,
    pendingReservations,
    onlineCabinets,
    totalCabinets,
    dailyStats,
    packageStatusFlow,
    totalRevenue: parseFloat(revenueSummary)
  })
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`丰巢SaaS平台后端服务启动成功`)
  console.log(`监听地址: http://127.0.0.1:${PORT}`)
  console.log(`健康检查: http://127.0.0.1:${PORT}/api/health`)
})
