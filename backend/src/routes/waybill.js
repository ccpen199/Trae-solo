import express from 'express'
import db from '../utils/db.js'
import { authenticate, requireRole, requireVerified } from '../middleware/auth.js'
import { calculateSplit, generateWaybillNo, generateTransactionNo, generatePolicyNo } from '../utils/pricing.js'
import multer from 'multer'
import Tesseract from 'tesseract.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const router = express.Router()

function normalizeWaybill(waybill) {
  return {
    ...waybill,
    departure_city: waybill.departure_city || waybill.start_city,
    destination_city: waybill.destination_city || waybill.end_city,
    origin: waybill.origin || waybill.start_city,
    destination: waybill.destination || waybill.end_city,
    price: waybill.price ?? waybill.agreed_price,
    amount: waybill.amount ?? waybill.agreed_price,
    current_location: waybill.current_location || (
      waybill.current_lng && waybill.current_lat ? `${waybill.current_lng}, ${waybill.current_lat}` : ''
    )
  }
}

const uploadDir = path.resolve(__dirname, '../../../uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})
const upload = multer({ storage })

router.post('/create', authenticate, requireRole('shipper'), requireVerified, (req, res) => {
  const { cargo_id, driver_id, agreed_price } = req.body
  
  if (!cargo_id || !driver_id || !agreed_price) {
    return res.status(400).json({ code: 400, message: '缺少必要参数' })
  }
  
  const cargo = db.prepare('SELECT * FROM cargo_sources WHERE id = ? AND shipper_id = ?').get(cargo_id, req.user.id)
  if (!cargo) {
    return res.status(404).json({ code: 404, message: '货源不存在' })
  }
  
  if (cargo.status !== 'signed') {
    return res.status(400).json({ code: 400, message: '货源状态不正确，请先接受报价' })
  }
  
  const existingWaybill = db.prepare('SELECT id FROM waybills WHERE cargo_id = ?').get(cargo_id)
  if (existingWaybill) {
    return res.status(400).json({ code: 400, message: '该货源已生成运单' })
  }
  
  const split = calculateSplit(agreed_price)
  const waybillNo = generateWaybillNo()
  const estimatedHours = cargo.distance / 60
  const estimatedArrival = new Date(new Date(cargo.loading_time).getTime() + estimatedHours * 60 * 60 * 1000).toISOString()
  
  const tx = db.transaction(() => {
    const waybillResult = db.prepare(`
      INSERT INTO waybills (cargo_id, shipper_id, driver_id, waybill_no, agreed_price, platform_commission, insurance_fee, driver_receivable, status, sign_time, estimated_arrival, current_lng, current_lat)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'created', CURRENT_TIMESTAMP, ?, ?, ?)
    `).run(cargo_id, req.user.id, driver_id, waybillNo, split.agreedPrice, split.platformCommission, split.insuranceFee, split.driverReceivable, estimatedArrival, cargo.start_lng, cargo.start_lat)
    
    const waybillId = waybillResult.lastInsertRowid
    
    const policyNo = generatePolicyNo()
    db.prepare(`
      INSERT INTO insurance_policies (waybill_id, policy_no, insurance_company, insured_amount, premium, cargo_value, status)
      VALUES (?, ?, '平安保险', ?, ?, ?, 'valid')
    `).run(waybillId, policyNo, split.agreedPrice, split.insuranceFee, cargo.weight * 1000 || 10000)
    
    db.prepare(`
      UPDATE driver_info 
      SET total_orders = total_orders + 1
      WHERE driver_id = ?
    `).run(driver_id)
    
    const whitelist = db.prepare('SELECT id FROM whitelist_drivers WHERE shipper_id = ? AND driver_id = ?').get(req.user.id, driver_id)
    if (whitelist) {
      db.prepare(`
        UPDATE whitelist_drivers 
        SET cooperation_count = cooperation_count + 1, last_cooperation_time = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(whitelist.id)
    }
  })
  
  try {
    tx()
    res.json({ code: 200, message: '运单创建成功', data: { waybill_no: waybillNo, ...split } })
  } catch (err) {
    res.status(500).json({ code: 500, message: '运单创建失败', error: err.message })
  }
})

router.get('/', authenticate, (req, res) => {
  const { status, page = 1 } = req.query
  const pageSize = req.query.pageSize || req.query.page_size || 20
  const offset = (page - 1) * pageSize
  
  let query = `
    SELECT w.*, cs.cargo_name, cs.start_city, cs.end_city, cs.distance, cs.loading_time, cs.delivery_time,
      cs.base_price, cs.distance_factor, cs.vehicle_factor, cs.time_factor, cs.suggested_price, cs.min_price, cs.max_price,
      cs.status as cargo_status, cs.vehicle_type_required,
      s.real_name as shipper_name, s.phone as shipper_phone,
      d.real_name as driver_name, d.phone as driver_phone,
      di.vehicle_no, di.vehicle_type,
      ei.company_name,
      (SELECT COUNT(*) FROM price_negotiations pn WHERE pn.cargo_id = w.cargo_id) as bid_count
    FROM waybills w
    LEFT JOIN cargo_sources cs ON w.cargo_id = cs.id
    LEFT JOIN users s ON w.shipper_id = s.id
    LEFT JOIN enterprise_info ei ON w.shipper_id = ei.shipper_id
    LEFT JOIN users d ON w.driver_id = d.id
    LEFT JOIN driver_info di ON w.driver_id = di.driver_id
    WHERE 1=1
  `
  let params = []
  
  if (req.user.role === 'shipper') {
    query += ' AND w.shipper_id = ?'
    params.push(req.user.id)
  } else if (req.user.role === 'driver') {
    query += ' AND w.driver_id = ?'
    params.push(req.user.id)
  }
  
  if (status) {
    query += ' AND w.status = ?'
    params.push(status)
  }
  
  query += ' ORDER BY w.created_at DESC LIMIT ? OFFSET ?'
  params.push(parseInt(pageSize), offset)
  
  const list = db.prepare(query).all(...params).map(normalizeWaybill)
  
  let countQuery = 'SELECT COUNT(*) as total FROM waybills w WHERE 1=1'
  let countParams = []
  if (req.user.role === 'shipper') {
    countQuery += ' AND w.shipper_id = ?'
    countParams.push(req.user.id)
  } else if (req.user.role === 'driver') {
    countQuery += ' AND w.driver_id = ?'
    countParams.push(req.user.id)
  }
  if (status) {
    countQuery += ' AND w.status = ?'
    countParams.push(status)
  }
  const { total } = db.prepare(countQuery).get(...countParams)
  
  res.json({ code: 200, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } })
})

router.get('/:id', authenticate, (req, res) => {
  const waybill = db.prepare(`
    SELECT w.*, cs.*,
      s.real_name as shipper_name, s.phone as shipper_phone, ei.company_name,
      d.real_name as driver_name, d.phone as driver_phone, di.vehicle_no, di.vehicle_type, di.credit_score
    FROM waybills w
    LEFT JOIN cargo_sources cs ON w.cargo_id = cs.id
    LEFT JOIN users s ON w.shipper_id = s.id
    LEFT JOIN enterprise_info ei ON w.shipper_id = ei.shipper_id
    LEFT JOIN users d ON w.driver_id = d.id
    LEFT JOIN driver_info di ON w.driver_id = di.driver_id
    WHERE w.id = ?
  `).get(req.params.id)
  
  if (!waybill) {
    return res.status(404).json({ code: 404, message: '运单不存在' })
  }
  
  if (req.user.role === 'shipper' && waybill.shipper_id !== req.user.id) {
    return res.status(403).json({ code: 403, message: '无权查看此运单' })
  }
  if (req.user.role === 'driver' && waybill.driver_id !== req.user.id) {
    return res.status(403).json({ code: 403, message: '无权查看此运单' })
  }
  
  const tracking = db.prepare(`
    SELECT * FROM tracking_records 
    WHERE waybill_id = ? 
    ORDER BY created_at DESC 
    LIMIT 100
  `).all(req.params.id)
  
  const escrow = db.prepare('SELECT * FROM escrow_funds WHERE waybill_id = ?').get(req.params.id)
  const insurance = db.prepare('SELECT * FROM insurance_policies WHERE waybill_id = ?').get(req.params.id)
  const alerts = db.prepare('SELECT * FROM alerts WHERE waybill_id = ? ORDER BY created_at DESC').all(req.params.id)
  
  res.json({ code: 200, data: normalizeWaybill({ ...waybill, tracking, escrow, insurance, alerts }) })
})

router.put('/:id/start-loading', authenticate, requireRole('driver'), (req, res) => {
  const waybill = db.prepare('SELECT * FROM waybills WHERE id = ? AND driver_id = ?').get(req.params.id, req.user.id)
  if (!waybill) {
    return res.status(404).json({ code: 404, message: '运单不存在' })
  }
  if (waybill.status !== 'created') {
    return res.status(400).json({ code: 400, message: '当前状态无法开始装货' })
  }
  
  db.prepare("UPDATE waybills SET status = 'loading', loading_time = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id)
  res.json({ code: 200, message: '已开始装货' })
})

router.put('/:id/upload-waybill', authenticate, requireRole('driver'), upload.single('waybill_photo'), (req, res) => {
  const waybill = db.prepare('SELECT * FROM waybills WHERE id = ? AND driver_id = ?').get(req.params.id, req.user.id)
  if (!waybill) {
    return res.status(404).json({ code: 404, message: '运单不存在' })
  }
  
  const waybillPhoto = req.file ? `/uploads/${req.file.filename}` : null
  
  db.prepare('UPDATE waybills SET waybill_photo = ? WHERE id = ?').run(waybillPhoto, req.params.id)
  
  res.json({ code: 200, message: '运单照片已上传', data: { waybill_photo: waybillPhoto } })
})

router.post('/:id/ocr-waybill', authenticate, requireRole('driver'), upload.single('waybill_photo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ code: 400, message: '请上传运单照片' })
  }
  
  try {
    const result = await Tesseract.recognize(req.file.path, 'chi_sim+eng')
    const ocrText = result.data.text
    
    const waybillPhoto = `/uploads/${req.file.filename}`
    db.prepare('UPDATE waybills SET waybill_photo = ?, ocr_result = ? WHERE id = ?').run(waybillPhoto, ocrText, req.params.id)
    
    res.json({ code: 200, message: 'OCR识别完成', data: { ocr_result: ocrText, waybill_photo: waybillPhoto } })
  } catch (err) {
    res.status(500).json({ code: 500, message: 'OCR识别失败', error: err.message })
  }
})

router.put('/:id/start-transport', authenticate, requireRole('driver'), (req, res) => {
  const waybill = db.prepare('SELECT * FROM waybills WHERE id = ? AND driver_id = ?').get(req.params.id, req.user.id)
  if (!waybill) {
    return res.status(404).json({ code: 404, message: '运单不存在' })
  }
  if (waybill.status !== 'loading') {
    return res.status(400).json({ code: 400, message: '当前状态无法开始运输' })
  }
  
  db.prepare("UPDATE waybills SET status = 'in_transit', start_time = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id)
  res.json({ code: 200, message: '已开始运输' })
})

router.post('/:id/track', authenticate, requireRole('driver'), (req, res) => {
  const { lng, lat, speed, heading } = req.body
  
  if (lng === undefined || lat === undefined) {
    return res.status(400).json({ code: 400, message: '缺少位置参数' })
  }
  
  const waybill = db.prepare('SELECT * FROM waybills WHERE id = ? AND driver_id = ?').get(req.params.id, req.user.id)
  if (!waybill) {
    return res.status(404).json({ code: 404, message: '运单不存在' })
  }
  if (waybill.status !== 'in_transit') {
    return res.status(400).json({ code: 400, message: '运单未在运输中' })
  }
  
  const lastTrack = db.prepare(`
    SELECT * FROM tracking_records 
    WHERE waybill_id = ? 
    ORDER BY created_at DESC 
    LIMIT 1
  `).get(req.params.id)
  
  let isStationary = 0
  let stationaryMinutes = 0
  
  if (lastTrack) {
    const distance = Math.sqrt(
      Math.pow(lng - lastTrack.lng, 2) + Math.pow(lat - lastTrack.lat, 2)
    ) * 111000
    if (distance < 50 && (speed === undefined || speed < 5)) {
      isStationary = 1
      stationaryMinutes = lastTrack.stationary_minutes + 5
      
      if (stationaryMinutes >= 120) {
        const existingAlert = db.prepare(`
          SELECT id FROM alerts 
          WHERE waybill_id = ? AND alert_type = 'stationary' AND is_handled = 0
        `).get(req.params.id)
        
        if (!existingAlert) {
          db.prepare(`
            INSERT INTO alerts (waybill_id, alert_type, alert_level, alert_message)
            VALUES (?, 'stationary', 'warning', ?)
          `).run(req.params.id, `车辆已静止超过${stationaryMinutes}分钟`)
        }
      }
    }
  }
  
  const isOffRoute = 0
  
  db.prepare(`
    INSERT INTO tracking_records (waybill_id, driver_id, lng, lat, speed, heading, is_off_route, is_stationary, stationary_minutes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.id, req.user.id, lng, lat, speed || null, heading || null, isOffRoute, isStationary, stationaryMinutes)
  
  db.prepare('UPDATE waybills SET current_lng = ?, current_lat = ? WHERE id = ?').run(lng, lat, req.params.id)
  
  res.json({ code: 200, message: '位置已上报' })
})

router.get('/:id/tracking', authenticate, (req, res) => {
  const waybill = db.prepare('SELECT id, status, current_lng, current_lat FROM waybills WHERE id = ?').get(req.params.id)
  if (!waybill) {
    return res.status(404).json({ code: 404, message: '运单不存在' })
  }
  
  const records = db.prepare(`
    SELECT * FROM tracking_records 
    WHERE waybill_id = ? 
    ORDER BY created_at DESC 
    LIMIT 200
  `).all(req.params.id)
  
  res.json({ code: 200, data: { current: { lng: waybill.current_lng, lat: waybill.current_lat, status: waybill.status }, records } })
})

router.put('/:id/complete', authenticate, requireRole('driver'), (req, res) => {
  const waybill = db.prepare('SELECT * FROM waybills WHERE id = ? AND driver_id = ?').get(req.params.id, req.user.id)
  if (!waybill) {
    return res.status(404).json({ code: 404, message: '运单不存在' })
  }
  if (waybill.status !== 'in_transit') {
    return res.status(400).json({ code: 400, message: '当前状态无法完成运输' })
  }
  
  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE waybills 
      SET status = 'completed', complete_time = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(req.params.id)
    
    db.prepare(`
      UPDATE driver_info 
      SET success_orders = success_orders + 1,
          credit_score = MIN(100, credit_score + 1)
      WHERE driver_id = ?
    `).run(req.user.id)
    
    db.prepare(`
      INSERT INTO cooperation_records (shipper_id, driver_id, waybill_id, cargo_name, route, price)
      SELECT w.shipper_id, w.driver_id, ?, cs.cargo_name, cs.start_city || ' -> ' || cs.end_city, w.agreed_price
      FROM waybills w
      LEFT JOIN cargo_sources cs ON w.cargo_id = cs.id
      WHERE w.id = ?
    `).run(req.params.id, req.params.id)
  })
  
  try {
    tx()
    res.json({ code: 200, message: '运输已完成，等待收货确认' })
  } catch (err) {
    res.status(500).json({ code: 500, message: '操作失败' })
  }
})

router.put('/:id/confirm-receipt', authenticate, requireRole('shipper'), (req, res) => {
  const { rating, comment } = req.body
  
  const waybill = db.prepare('SELECT * FROM waybills WHERE id = ? AND shipper_id = ?').get(req.params.id, req.user.id)
  if (!waybill) {
    return res.status(404).json({ code: 404, message: '运单不存在' })
  }
  if (waybill.status !== 'completed') {
    return res.status(400).json({ code: 400, message: '运单未完成运输' })
  }
  
  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE cooperation_records 
      SET rating = ?, comment = ? 
      WHERE waybill_id = ?
    `).run(rating || null, comment || null, req.params.id)
    
    if (rating && rating < 3) {
      db.prepare(`
        UPDATE driver_info 
        SET credit_score = MAX(0, credit_score - 2)
        WHERE driver_id = ?
      `).run(waybill.driver_id)
    }
  })
  
  try {
    tx()
    res.json({ code: 200, message: '已确认收货，感谢您的评价' })
  } catch (err) {
    res.status(500).json({ code: 500, message: '操作失败' })
  }
})

router.get('/:id/split', authenticate, (req, res) => {
  const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(req.params.id)
  if (!waybill) {
    return res.status(404).json({ code: 404, message: '运单不存在' })
  }
  
  res.json({
    code: 200,
    data: {
      agreedPrice: waybill.agreed_price,
      platformCommission: waybill.platform_commission,
      insuranceFee: waybill.insurance_fee,
      driverReceivable: waybill.driver_receivable,
      commissionRate: process.env.PLATFORM_COMMISSION_RATE,
      insuranceRate: process.env.INSURANCE_RATE
    }
  })
})

router.get('/dashboard/stats', authenticate, (req, res) => {
  let result = {}
  
  if (req.user.role === 'shipper') {
    const totalCargo = db.prepare('SELECT COUNT(*) as count FROM cargo_sources WHERE shipper_id = ?').get(req.user.id).count
    const pendingWaybills = db.prepare('SELECT COUNT(*) as count FROM waybills WHERE shipper_id = ? AND status IN (\'created\', \'loading\', \'in_transit\')').get(req.user.id).count
    const wallet = db.prepare('SELECT balance FROM wallets WHERE user_id = ?').get(req.user.id)
    const pendingAlerts = db.prepare(`
      SELECT COUNT(*) as count FROM alerts a
      JOIN waybills w ON a.waybill_id = w.id
      WHERE w.shipper_id = ? AND a.is_handled = 0
    `).get(req.user.id).count
    
    result = {
      total_cargo: totalCargo,
      pending_waybills: pendingWaybills,
      balance: wallet?.balance || 0,
      pending_alerts: pendingAlerts,
      alerts: []
    }
    
    const recentAlerts = db.prepare(`
      SELECT a.*, w.waybill_no, cs.cargo_name
      FROM alerts a
      JOIN waybills w ON a.waybill_id = w.id
      LEFT JOIN cargo_sources cs ON w.cargo_id = cs.id
      WHERE w.shipper_id = ? AND a.is_handled = 0
      ORDER BY a.created_at DESC
      LIMIT 5
    `).all(req.user.id)
    result.alerts = recentAlerts.map(a => ({
      id: a.id,
      title: a.alert_message,
      type: a.alert_level,
      time: a.created_at
    }))
  } else if (req.user.role === 'driver') {
    const availableCargo = db.prepare('SELECT COUNT(*) as count FROM cargo_sources WHERE status IN (\'published\', \'trading\')').get().count
    const myBids = db.prepare('SELECT COUNT(*) as count FROM bids WHERE driver_id = ?').get(req.user.id).count
    const wallet = db.prepare('SELECT balance FROM wallets WHERE user_id = ?').get(req.user.id)
    const driverInfo = db.prepare('SELECT credit_score FROM driver_info WHERE driver_id = ?').get(req.user.id)
    
    result = {
      available_cargo: availableCargo,
      my_bids: myBids,
      balance: wallet?.balance || 0,
      credit_score: driverInfo?.credit_score || 0,
      alerts: []
    }
  } else if (req.user.role === 'admin') {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count
    const totalWaybills = db.prepare('SELECT COUNT(*) as count FROM waybills').get().count
    const platformFunds = db.prepare('SELECT SUM(balance) as total FROM wallets').get().total || 0
    const pendingAlerts = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE is_handled = 0').get().count
    
    result = {
      total_users: totalUsers,
      total_waybills: totalWaybills,
      platform_funds: platformFunds,
      pending_alerts: pendingAlerts,
      alerts: []
    }
    
    const recentAlerts = db.prepare(`
      SELECT a.*, w.waybill_no, cs.cargo_name
      FROM alerts a
      JOIN waybills w ON a.waybill_id = w.id
      LEFT JOIN cargo_sources cs ON w.cargo_id = cs.id
      WHERE a.is_handled = 0
      ORDER BY a.created_at DESC
      LIMIT 5
    `).all()
    result.alerts = recentAlerts.map(a => ({
      id: a.id,
      title: a.alert_message,
      type: a.alert_level,
      time: a.created_at
    }))
  }
  
  res.json({ code: 200, data: result })
})

export default router
