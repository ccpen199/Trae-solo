import express from 'express'
import db from '../utils/db.js'
import { authenticate, requireRole, requireVerified } from '../middleware/auth.js'

const router = express.Router()

router.post('/driver-info', authenticate, requireRole('driver'), (req, res) => {
  const { driver_license_no, driver_license_type, vehicle_no, vehicle_type, vehicle_length, vehicle_load } = req.body
  
  if (!driver_license_no || !driver_license_type || !vehicle_no || !vehicle_type) {
    return res.status(400).json({ code: 400, message: '缺少必要参数' })
  }
  
  const existing = db.prepare('SELECT id FROM driver_info WHERE driver_id = ?').get(req.user.id)
  
  if (existing) {
    db.prepare(`
      UPDATE driver_info 
      SET driver_license_no = ?, driver_license_type = ?, vehicle_no = ?, vehicle_type = ?, vehicle_length = ?, vehicle_load = ?
      WHERE driver_id = ?
    `).run(driver_license_no, driver_license_type, vehicle_no, vehicle_type, vehicle_length || null, vehicle_load || null, req.user.id)
  } else {
    db.prepare(`
      INSERT INTO driver_info (driver_id, driver_license_no, driver_license_type, vehicle_no, vehicle_type, vehicle_length, vehicle_load)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, driver_license_no, driver_license_type, vehicle_no, vehicle_type, vehicle_length || null, vehicle_load || null)
  }
  
  res.json({ code: 200, message: '司机信息已保存' })
})

router.post('/update-location', authenticate, requireRole('driver'), (req, res) => {
  const { lng, lat, city, is_online, is_available } = req.body
  
  if (lng === undefined || lat === undefined) {
    return res.status(400).json({ code: 400, message: '缺少位置参数' })
  }
  
  const existing = db.prepare('SELECT id FROM driver_location WHERE driver_id = ?').get(req.user.id)
  
  if (existing) {
    db.prepare(`
      UPDATE driver_location 
      SET lng = ?, lat = ?, city = ?, is_online = ?, is_available = ?, last_update = CURRENT_TIMESTAMP
      WHERE driver_id = ?
    `).run(lng, lat, city || null, is_online ? 1 : 0, is_available ? 1 : 0, req.user.id)
  } else {
    db.prepare(`
      INSERT INTO driver_location (driver_id, lng, lat, city, is_online, is_available)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, lng, lat, city || null, is_online ? 1 : 0, is_available ? 1 : 0)
  }
  
  res.json({ code: 200, message: '位置已更新' })
})

router.get('/cargo-pool', authenticate, requireRole('driver'), requireVerified, (req, res) => {
  const { city, vehicle_type, page = 1, pageSize = 20 } = req.query
  const offset = (page - 1) * pageSize
  
  const driverInfo = db.prepare('SELECT vehicle_type FROM driver_info WHERE driver_id = ?').get(req.user.id)
  
  let query = `
    SELECT cs.*, u.real_name as shipper_name, ei.company_name
    FROM cargo_sources cs
    LEFT JOIN users u ON cs.shipper_id = u.id
    LEFT JOIN enterprise_info ei ON cs.shipper_id = ei.shipper_id
    WHERE cs.status = 'published'
  `
  let params = []
  
  if (city) {
    query += ' AND (cs.start_city LIKE ? OR cs.end_city LIKE ?)'
    params.push(`%${city}%`, `%${city}%`)
  }
  
  if (vehicle_type || driverInfo?.vehicle_type) {
    query += ' AND cs.vehicle_type_required = ?'
    params.push(vehicle_type || driverInfo.vehicle_type)
  }
  
  query += ' ORDER BY cs.created_at DESC LIMIT ? OFFSET ?'
  params.push(parseInt(pageSize), offset)
  
  const list = db.prepare(query).all(...params)
  
  const countQuery = 'SELECT COUNT(*) as total FROM cargo_sources cs WHERE cs.status = ?'
  const countParams = ['published']
  const { total } = db.prepare(countQuery).get(...countParams)
  
  res.json({ code: 200, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } })
})

router.get('/nearby-cargo', authenticate, requireRole('driver'), requireVerified, (req, res) => {
  const { radius = 50 } = req.query
  
  const location = db.prepare('SELECT lng, lat FROM driver_location WHERE driver_id = ?').get(req.user.id)
  if (!location || !location.lng || !location.lat) {
    return res.status(400).json({ code: 400, message: '请先上传位置信息' })
  }
  
  const list = db.prepare(`
    SELECT cs.*, u.real_name as shipper_name, ei.company_name,
      (6371 * acos(cos(radians(?)) * cos(radians(cs.start_lat)) * cos(radians(cs.start_lng) - radians(?)) + sin(radians(?)) * sin(radians(cs.start_lat)))) as distance_km
    FROM cargo_sources cs
    LEFT JOIN users u ON cs.shipper_id = u.id
    LEFT JOIN enterprise_info ei ON cs.shipper_id = ei.shipper_id
    WHERE cs.status = 'published' AND cs.start_lng IS NOT NULL AND cs.start_lat IS NOT NULL
    HAVING distance_km <= ?
    ORDER BY distance_km ASC
    LIMIT 20
  `).all(location.lat, location.lng, location.lat, radius)
  
  res.json({ code: 200, data: list })
})

router.post('/cargo/:id/bid', authenticate, requireRole('driver'), requireVerified, (req, res) => {
  const { bid_price, message } = req.body
  
  if (!bid_price) {
    return res.status(400).json({ code: 400, message: '请输入报价' })
  }
  
  const cargo = db.prepare('SELECT * FROM cargo_sources WHERE id = ?').get(req.params.id)
  if (!cargo) {
    return res.status(404).json({ code: 404, message: '货源不存在' })
  }
  
  if (cargo.status !== 'published' && cargo.status !== 'trading') {
    return res.status(400).json({ code: 400, message: '该货源已不可接单' })
  }
  
  if (cargo.min_price && bid_price < cargo.min_price) {
    return res.status(400).json({ code: 400, message: `报价不能低于最低价 ${cargo.min_price}` })
  }
  
  if (cargo.max_price && bid_price > cargo.max_price) {
    return res.status(400).json({ code: 400, message: `报价不能高于最高价 ${cargo.max_price}` })
  }
  
  const tx = db.transaction(() => {
    db.prepare("UPDATE cargo_sources SET status = 'trading' WHERE id = ? AND status = 'published'").run(req.params.id)
    
    db.prepare(`
      INSERT INTO price_negotiations (cargo_id, shipper_id, driver_id, bid_price, negotiator, message, status)
      VALUES (?, ?, ?, ?, 'driver', ?, 'pending')
    `).run(req.params.id, cargo.shipper_id, req.user.id, bid_price, message || null)
  })
  
  try {
    tx()
    res.json({ code: 200, message: '报价已发送，等待货主确认' })
  } catch (err) {
    res.status(500).json({ code: 500, message: '报价失败' })
  }
})

router.get('/my-bids', authenticate, requireRole('driver'), (req, res) => {
  const { status, page = 1, pageSize = 20 } = req.query
  const offset = (page - 1) * pageSize
  
  let query = `
    SELECT pn.*, cs.cargo_name, cs.start_city, cs.end_city, cs.distance, cs.loading_time,
      u.real_name as shipper_name, ei.company_name
    FROM price_negotiations pn
    LEFT JOIN cargo_sources cs ON pn.cargo_id = cs.id
    LEFT JOIN users u ON pn.shipper_id = u.id
    LEFT JOIN enterprise_info ei ON pn.shipper_id = ei.shipper_id
    WHERE pn.driver_id = ?
  `
  let params = [req.user.id]
  
  if (status) {
    query += ' AND pn.status = ?'
    params.push(status)
  }
  
  query += ' ORDER BY pn.created_at DESC LIMIT ? OFFSET ?'
  params.push(parseInt(pageSize), offset)
  
  const list = db.prepare(query).all(...params)
  
  res.json({ code: 200, data: list })
})

export default router
