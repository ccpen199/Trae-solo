const express = require('express')
const Joi = require('joi')
const { db } = require('../database')
const router = express.Router()

const appointmentSchema = Joi.object({
  customer_id: Joi.number().required(),
  product_id: Joi.number().required(),
  expected_quantity: Joi.number().required(),
  expected_arrival: Joi.string().allow(''),
  batch_no: Joi.string().allow(''),
  production_date: Joi.string().allow(''),
  expiry_date: Joi.string().allow(''),
  vehicle_no: Joi.string().allow(''),
  driver: Joi.string().allow(''),
  remark: Joi.string().allow('')
})

const inboundSchema = Joi.object({
  appointment_id: Joi.number().allow(null),
  customer_id: Joi.number().required(),
  product_id: Joi.number().required(),
  location_id: Joi.number().allow(null),
  batch_no: Joi.string().allow(''),
  production_date: Joi.string().allow(''),
  expiry_date: Joi.string().allow(''),
  quantity: Joi.number().required(),
  weight: Joi.number().allow(null),
  vehicle_no: Joi.string().allow(''),
  remark: Joi.string().allow('')
})

function generateNo(prefix) {
  const date = new Date()
  const dateStr = date.getFullYear().toString() + 
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${prefix}${dateStr}${random}`
}

router.get('/appointments', (req, res) => {
  const appointments = db.prepare(`
    SELECT ia.*,
           c.name as customer_name,
           p.name as product_name,
           p.code as product_code
    FROM inbound_appointments ia
    JOIN customers c ON ia.customer_id = c.id
    JOIN products p ON ia.product_id = p.id
    ORDER BY ia.created_at DESC
  `).all()
  res.json(appointments)
})

router.post('/appointments', (req, res) => {
  const { error, value } = appointmentSchema.validate(req.body)
  if (error) return res.status(400).json({ error: error.details[0].message })

  const appointmentNo = generateNo('IA')
  const result = db.prepare(`
    INSERT INTO inbound_appointments 
    (appointment_no, customer_id, product_id, expected_quantity, expected_arrival, 
     batch_no, production_date, expiry_date, vehicle_no, driver, status, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(appointmentNo, value.customer_id, value.product_id, value.expected_quantity, 
         value.expected_arrival, value.batch_no, value.production_date, value.expiry_date,
         value.vehicle_no, value.driver, value.remark)

  res.json({ id: result.lastInsertRowid, appointment_no: appointmentNo, ...value })
})

router.get('/records', (req, res) => {
  const records = db.prepare(`
    SELECT ir.*,
           c.name as customer_name,
           p.name as product_name,
           p.code as product_code,
           l.code as location_code,
           l.name as location_name
    FROM inbound_records ir
    JOIN customers c ON ir.customer_id = c.id
    JOIN products p ON ir.product_id = p.id
    LEFT JOIN locations l ON ir.location_id = l.id
    ORDER BY ir.created_at DESC
  `).all()
  res.json(records)
})

router.post('/receive', (req, res) => {
  const { error, value } = inboundSchema.validate(req.body)
  if (error) return res.status(400).json({ error: error.details[0].message })

  const product = db.prepare(`
    SELECT p.*, tz.min_temp, tz.max_temp, tz.id as zone_id
    FROM products p 
    JOIN temperature_zones tz ON p.temperature_zone_id = tz.id
    WHERE p.id = ?
  `).get(value.product_id)
  if (!product) return res.status(400).json({ error: '货品不存在' })

  if (value.location_id) {
    const location = db.prepare('SELECT temperature_zone_id FROM locations WHERE id = ?').get(value.location_id)
    if (!location) return res.status(400).json({ error: '库位不存在' })
    if (location.temperature_zone_id !== product.zone_id) {
      return res.status(400).json({ 
        error: '温区不匹配，该货品要求的温区与库位温区不一致',
        product_zone: product.temperature_zone_id,
        location_zone: location.temperature_zone_id
      })
    }
  }

  const recordNo = generateNo('IR')
  const result = db.prepare(`
    INSERT INTO inbound_records
    (record_no, appointment_id, customer_id, product_id, location_id, batch_no,
     production_date, expiry_date, quantity, weight, vehicle_no, arrival_time, status, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'receiving', ?)
  `).run(recordNo, value.appointment_id, value.customer_id, value.product_id, value.location_id,
         value.batch_no, value.production_date, value.expiry_date, value.quantity, value.weight,
         value.vehicle_no, value.remark)

  res.json({ id: result.lastInsertRowid, record_no: recordNo, ...value })
})

router.post('/inspect/:id', (req, res) => {
  const { inspection_result, is_qualified, damaged_quantity } = req.body
  const record = db.prepare('SELECT * FROM inbound_records WHERE id = ?').get(req.params.id)
  if (!record) return res.status(404).json({ error: '入库记录不存在' })

  const newStatus = is_qualified ? 'inspected' : 'exception'
  
  db.prepare(`
    UPDATE inbound_records 
    SET inspection_status = ?, inspection_result = ?, status = ?
    WHERE id = ?
  `).run(is_qualified ? 'passed' : 'failed', inspection_result, newStatus, req.params.id)

  if (!is_qualified || damaged_quantity > 0) {
    const exceptionNo = generateNo('EX')
    db.prepare(`
      INSERT INTO exception_orders
      (exception_no, type, related_type, related_id, description, quantity, status)
      VALUES (?, 'damage', 'inbound', ?, ?, ?, 'pending')
    `).run(exceptionNo, req.params.id, inspection_result || '质检不合格', damaged_quantity || record.quantity)
  }

  res.json({ success: true, status: newStatus })
})

router.post('/putaway/:id', (req, res) => {
  const { location_id } = req.body
  const record = db.prepare('SELECT * FROM inbound_records WHERE id = ?').get(req.params.id)
  if (!record) return res.status(404).json({ error: '入库记录不存在' })

  const product = db.prepare(`
    SELECT p.*, tz.id as zone_id
    FROM products p 
    JOIN temperature_zones tz ON p.temperature_zone_id = tz.id
    WHERE p.id = ?
  `).get(record.product_id)

  const location = db.prepare('SELECT * FROM locations WHERE id = ?').get(location_id)
  if (!location) return res.status(400).json({ error: '库位不存在' })

  if (location.temperature_zone_id !== product.zone_id) {
    return res.status(400).json({ error: '温区不匹配，无法上架' })
  }

  const insertInventory = db.prepare(`
    INSERT INTO inventory
    (customer_id, product_id, location_id, batch_no, production_date, expiry_date,
     quantity, available_quantity, inbound_time, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'normal')
  `)

  const invResult = insertInventory.run(
    record.customer_id, record.product_id, location_id,
    record.batch_no || 'NO-BATCH', record.production_date, record.expiry_date,
    record.quantity, record.quantity
  )

  db.prepare(`
    UPDATE inbound_records 
    SET location_id = ?, status = 'completed'
    WHERE id = ?
  `).run(location_id, req.params.id)

  db.prepare("UPDATE locations SET status = 'occupied' WHERE id = ?").run(location_id)

  res.json({ success: true, inventory_id: invResult.lastInsertRowid })
})

module.exports = router
