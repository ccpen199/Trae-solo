const express = require('express')
const { db } = require('../database')
const router = express.Router()

router.get('/', (req, res) => {
  const { customer_id, product_id, batch_no } = req.query
  let sql = `
    SELECT i.*,
           c.name as customer_name,
           p.name as product_name,
           p.code as product_code,
           l.code as location_code,
           l.name as location_name,
           tz.name as zone_name,
           julianday('now') - julianday(i.inbound_time) as storage_days
    FROM inventory i
    JOIN customers c ON i.customer_id = c.id
    JOIN products p ON i.product_id = p.id
    JOIN locations l ON i.location_id = l.id
    JOIN temperature_zones tz ON l.temperature_zone_id = tz.id
    WHERE i.available_quantity > 0
  `
  const params = []
  if (customer_id) {
    sql += ' AND i.customer_id = ?'
    params.push(customer_id)
  }
  if (product_id) {
    sql += ' AND i.product_id = ?'
    params.push(product_id)
  }
  if (batch_no) {
    sql += ' AND i.batch_no = ?'
    params.push(batch_no)
  }
  sql += ' ORDER BY i.inbound_time ASC'
  const inventory = db.prepare(sql).all(...params)
  res.json(inventory)
})

router.get('/batch/:batchNo', (req, res) => {
  const inventory = db.prepare(`
    SELECT i.*,
           c.name as customer_name,
           p.name as product_name,
           l.code as location_code,
           tz.name as zone_name,
           tz.min_temp,
           tz.max_temp
    FROM inventory i
    JOIN customers c ON i.customer_id = c.id
    JOIN products p ON i.product_id = p.id
    JOIN locations l ON i.location_id = l.id
    JOIN temperature_zones tz ON l.temperature_zone_id = tz.id
    WHERE i.batch_no = ?
  `).all(req.params.batchNo)
  res.json(inventory)
})

module.exports = router
