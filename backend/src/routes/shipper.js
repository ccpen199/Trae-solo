import express from 'express'
import db from '../utils/db.js'
import { authenticate, requireRole, requireVerified } from '../middleware/auth.js'
import { calculatePricing } from '../utils/pricing.js'

const router = express.Router()

function normalizePricing(pricing) {
  return {
    ...pricing,
    base_price: pricing.basePrice,
    distance_weight: pricing.distanceFactor,
    vehicle_weight: pricing.vehicleFactor,
    time_weight: pricing.timeFactor,
    suggested_price: pricing.suggestedPrice,
    min_price: pricing.minPrice,
    max_price: pricing.maxPrice
  }
}

function normalizeCargo(cargo) {
  return {
    ...cargo,
    departure_city: cargo.departure_city || cargo.start_city,
    departure_address: cargo.departure_address || cargo.start_address,
    destination_city: cargo.destination_city || cargo.end_city,
    destination_address: cargo.destination_address || cargo.end_address,
    expected_price: cargo.expected_price ?? cargo.suggested_price,
    remarks: cargo.remarks ?? cargo.remark
  }
}

function normalizeCooperation(record) {
  const [departure_city = '', destination_city = ''] = String(record.route || '').split(/\s*->\s*|\s*→\s*/)
  return {
    ...record,
    departure_city: record.departure_city || departure_city,
    destination_city: record.destination_city || destination_city,
    completed_at: record.completed_at || record.created_at
  }
}

router.post('/enterprise-cert', authenticate, requireRole('shipper'), (req, res) => {
  const { company_name, business_license, tax_registration_no, legal_person_name, legal_person_id_card, company_address, contact_phone } = req.body
  
  if (!company_name || !business_license) {
    return res.status(400).json({ code: 400, message: '缺少必要参数' })
  }
  
  const existing = db.prepare('SELECT id FROM enterprise_info WHERE shipper_id = ?').get(req.user.id)
  
  let result
  if (existing) {
    result = db.prepare(`
      UPDATE enterprise_info 
      SET company_name = ?, business_license = ?, tax_registration_no = ?, legal_person_name = ?, legal_person_id_card = ?, company_address = ?, contact_phone = ?, status = 'pending'
      WHERE shipper_id = ?
    `).run(company_name, business_license, tax_registration_no || null, legal_person_name || null, legal_person_id_card || null, company_address || null, contact_phone || null, req.user.id)
  } else {
    result = db.prepare(`
      INSERT INTO enterprise_info (shipper_id, company_name, business_license, tax_registration_no, legal_person_name, legal_person_id_card, company_address, contact_phone, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(req.user.id, company_name, business_license, tax_registration_no || null, legal_person_name || null, legal_person_id_card || null, company_address || null, contact_phone || null)
  }
  
  db.prepare('UPDATE users SET status = ? WHERE id = ?').run('pending', req.user.id)
  
  res.json({ code: 200, message: '企业资质已提交，等待审核' })
})

router.get('/enterprise-cert', authenticate, requireRole('shipper'), (req, res) => {
  const info = db.prepare('SELECT * FROM enterprise_info WHERE shipper_id = ?').get(req.user.id)
  res.json({ code: 200, data: info })
})

router.post('/calculate-price', authenticate, requireRole('shipper'), (req, res) => {
  const {
    distance,
    vehicleType,
    vehicle_type,
    loadingTime,
    loading_time,
    deliveryTime,
    delivery_time,
    weight,
    volume
  } = req.body
  
  const resolvedVehicleType = vehicleType || vehicle_type
  const resolvedLoadingTime = loadingTime || loading_time
  const resolvedDeliveryTime = deliveryTime || delivery_time

  if (!distance || !resolvedVehicleType || !resolvedLoadingTime || !resolvedDeliveryTime) {
    return res.status(400).json({ code: 400, message: '缺少必要参数' })
  }
  
  const pricing = calculatePricing({
    distance,
    vehicleType: resolvedVehicleType,
    loadingTime: resolvedLoadingTime,
    deliveryTime: resolvedDeliveryTime,
    weight,
    volume
  })
  
  res.json({ code: 200, data: normalizePricing(pricing) })
})

router.post('/cargo', authenticate, requireRole('shipper'), requireVerified, (req, res) => {
  const {
    cargo_name, cargo_type, weight, volume, quantity,
    start_city, start_address, start_lng, start_lat,
    end_city, end_address, end_lng, end_lat,
    departure_city, departure_address,
    destination_city, destination_address,
    distance, vehicle_type_required, vehicle_length_required,
    loading_time, delivery_time, remark, remarks
  } = req.body

  const resolvedStartCity = start_city || departure_city
  const resolvedStartAddress = start_address || departure_address
  const resolvedEndCity = end_city || destination_city
  const resolvedEndAddress = end_address || destination_address
  const resolvedRemark = remark || remarks
  
  if (!cargo_name || !cargo_type || !resolvedStartCity || !resolvedStartAddress || !resolvedEndCity || !resolvedEndAddress || !distance || !vehicle_type_required || !loading_time || !delivery_time) {
    return res.status(400).json({ code: 400, message: '缺少必要参数' })
  }
  
  const pricing = calculatePricing({ distance, vehicleType: vehicle_type_required, loadingTime: loading_time, deliveryTime: delivery_time, weight, volume })
  
  const result = db.prepare(`
    INSERT INTO cargo_sources (shipper_id, cargo_name, cargo_type, weight, volume, quantity, start_city, start_address, start_lng, start_lat, end_city, end_address, end_lng, end_lat, distance, vehicle_type_required, vehicle_length_required, loading_time, delivery_time, base_price, distance_factor, vehicle_factor, time_factor, suggested_price, min_price, max_price, status, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?)
  `).run(req.user.id, cargo_name, cargo_type, weight || null, volume || null, quantity || null, resolvedStartCity, resolvedStartAddress, start_lng || null, start_lat || null, resolvedEndCity, resolvedEndAddress, end_lng || null, end_lat || null, distance, vehicle_type_required, vehicle_length_required || null, loading_time, delivery_time, pricing.basePrice, pricing.distanceFactor, pricing.vehicleFactor, pricing.timeFactor, pricing.suggestedPrice, pricing.minPrice, pricing.maxPrice, resolvedRemark || null)
  
  res.json({ code: 200, message: '货源发布成功', data: { id: result.lastInsertRowid, cargoId: result.lastInsertRowid, ...normalizePricing(pricing) } })
})

router.get('/cargo', authenticate, requireRole('shipper'), (req, res) => {
  const { status, page = 1 } = req.query
  const pageSize = req.query.pageSize || req.query.page_size || 20
  const offset = (page - 1) * pageSize
  
  let query = 'SELECT * FROM cargo_sources WHERE shipper_id = ?'
  let params = [req.user.id]
  
  if (status) {
    const statusMap = { pending: 'published', accepted: 'signed', transporting: 'trading' }
    query += ' AND status = ?'
    params.push(statusMap[status] || status)
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(parseInt(pageSize), offset)
  
  const list = db.prepare(query).all(...params).map(normalizeCargo)
  
  let countQuery = 'SELECT COUNT(*) as total FROM cargo_sources WHERE shipper_id = ?'
  let countParams = [req.user.id]
  if (status) {
    const statusMap = { pending: 'published', accepted: 'signed', transporting: 'trading' }
    countQuery += ' AND status = ?'
    countParams.push(statusMap[status] || status)
  }
  const { total } = db.prepare(countQuery).get(...countParams)
  
  res.json({ code: 200, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } })
})

router.get('/cargo/:id', authenticate, requireRole('shipper'), (req, res) => {
  const cargo = db.prepare('SELECT * FROM cargo_sources WHERE id = ? AND shipper_id = ?').get(req.params.id, req.user.id)
  if (!cargo) {
    return res.status(404).json({ code: 404, message: '货源不存在' })
  }
  
  const negotiations = db.prepare(`
    SELECT pn.*, u.real_name as driver_name, u.phone as driver_phone,
      di.vehicle_no, di.vehicle_no as plate_number, di.vehicle_type, di.vehicle_length, di.credit_score,
      pn.created_at as bid_time
    FROM price_negotiations pn
    LEFT JOIN users u ON pn.driver_id = u.id
    LEFT JOIN driver_info di ON pn.driver_id = di.driver_id
    WHERE pn.cargo_id = ?
    ORDER BY pn.created_at DESC
  `).all(req.params.id)
  
  res.json({ code: 200, data: normalizeCargo({ ...cargo, negotiations }) })
})

router.put('/cargo/:id/cancel', authenticate, requireRole('shipper'), (req, res) => {
  const cargo = db.prepare('SELECT * FROM cargo_sources WHERE id = ? AND shipper_id = ?').get(req.params.id, req.user.id)
  if (!cargo) {
    return res.status(404).json({ code: 404, message: '货源不存在' })
  }
  
  if (!['published', 'matched', 'trading'].includes(cargo.status)) {
    return res.status(400).json({ code: 400, message: '当前状态无法取消' })
  }
  
  db.prepare("UPDATE cargo_sources SET status = 'cancelled' WHERE id = ?").run(req.params.id)
  
  res.json({ code: 200, message: '货源已取消' })
})

router.post('/cargo/:id/accept-bid', authenticate, requireRole('shipper'), requireVerified, (req, res) => {
  const { negotiation_id, bid_id, driver_id } = req.body
  const resolvedNegotiationId = negotiation_id || bid_id
  
  const cargo = db.prepare('SELECT * FROM cargo_sources WHERE id = ? AND shipper_id = ?').get(req.params.id, req.user.id)
  if (!cargo) {
    return res.status(404).json({ code: 404, message: '货源不存在' })
  }
  
  if (cargo.status !== 'trading') {
    return res.status(400).json({ code: 400, message: '当前状态无法签约' })
  }
  
  const negotiation = db.prepare('SELECT * FROM price_negotiations WHERE id = ? AND cargo_id = ? AND driver_id = ?').get(resolvedNegotiationId, req.params.id, driver_id)
  if (!negotiation) {
    return res.status(404).json({ code: 404, message: '议价记录不存在' })
  }
  
  db.prepare("UPDATE cargo_sources SET status = 'signed' WHERE id = ?").run(req.params.id)
  db.prepare("UPDATE price_negotiations SET status = 'accepted' WHERE id = ?").run(resolvedNegotiationId)
  
  res.json({ code: 200, message: '已接受报价，请前往运单管理' })
})

router.get('/whitelist', authenticate, requireRole('shipper'), (req, res) => {
  const list = db.prepare(`
    SELECT wl.*, u.real_name as driver_name, u.phone, di.vehicle_no, di.vehicle_type, di.credit_score, di.total_orders, di.success_orders
    FROM whitelist_drivers wl
    LEFT JOIN users u ON wl.driver_id = u.id
    LEFT JOIN driver_info di ON wl.driver_id = di.driver_id
    WHERE wl.shipper_id = ?
    ORDER BY wl.created_at DESC
  `).all(req.user.id)
  
  res.json({ code: 200, data: list })
})

router.post('/whitelist', authenticate, requireRole('shipper'), (req, res) => {
  const { driver_id, remark } = req.body
  
  if (!driver_id) {
    return res.status(400).json({ code: 400, message: '缺少司机ID' })
  }
  
  const driver = db.prepare('SELECT id, role FROM users WHERE id = ? AND role = ?').get(driver_id, 'driver')
  if (!driver) {
    return res.status(404).json({ code: 404, message: '司机不存在' })
  }
  
  try {
    db.prepare('INSERT INTO whitelist_drivers (shipper_id, driver_id, remark) VALUES (?, ?, ?)').run(req.user.id, driver_id, remark || null)
    res.json({ code: 200, message: '已添加到熟车白名单' })
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ code: 400, message: '该司机已在白名单中' })
    }
    throw err
  }
})

router.delete('/whitelist/:id', authenticate, requireRole('shipper'), (req, res) => {
  db.prepare('DELETE FROM whitelist_drivers WHERE id = ? AND shipper_id = ?').run(req.params.id, req.user.id)
  res.json({ code: 200, message: '已从白名单移除' })
})

router.get('/cooperation-records', authenticate, requireRole('shipper'), (req, res) => {
  const { driver_id, page = 1 } = req.query
  const pageSize = req.query.pageSize || req.query.page_size || 20
  const offset = (page - 1) * pageSize
  
  let query = `
    SELECT cr.*, u.real_name as driver_name, u.phone as driver_phone, di.vehicle_no
    FROM cooperation_records cr
    LEFT JOIN users u ON cr.driver_id = u.id
    LEFT JOIN driver_info di ON cr.driver_id = di.driver_id
    WHERE cr.shipper_id = ?
  `
  let params = [req.user.id]
  
  if (driver_id) {
    query += ' AND cr.driver_id = ?'
    params.push(driver_id)
  }
  
  query += ' ORDER BY cr.created_at DESC LIMIT ? OFFSET ?'
  params.push(parseInt(pageSize), offset)
  
  const list = db.prepare(query).all(...params).map(normalizeCooperation)
  
  res.json({ code: 200, data: list })
})

export default router
