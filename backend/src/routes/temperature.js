const express = require('express')
const { db } = require('../database')
const router = express.Router()

router.get('/records', (req, res) => {
  const { zone_id, start_time, end_time } = req.query
  let sql = `
    SELECT tr.*, tz.name as zone_name, l.code as location_code
    FROM temperature_records tr
    JOIN temperature_zones tz ON tr.temperature_zone_id = tz.id
    LEFT JOIN locations l ON tr.location_id = l.id
    WHERE 1=1
  `
  const params = []
  if (zone_id) {
    sql += ' AND tr.temperature_zone_id = ?'
    params.push(zone_id)
  }
  if (start_time) {
    sql += ' AND tr.record_time >= ?'
    params.push(start_time)
  }
  if (end_time) {
    sql += ' AND tr.record_time <= ?'
    params.push(end_time)
  }
  sql += ' ORDER BY tr.record_time DESC LIMIT 500'
  const records = db.prepare(sql).all(...params)
  res.json(records)
})

router.get('/trend', (req, res) => {
  const { zone_id, hours = 24 } = req.query
  const records = db.prepare(`
    SELECT 
      strftime('%Y-%m-%d %H:00:00', record_time) as time_bucket,
      temperature_zone_id,
      AVG(temperature) as avg_temp,
      MIN(temperature) as min_temp,
      MAX(temperature) as max_temp
    FROM temperature_records
    WHERE temperature_zone_id = ?
      AND record_time >= datetime('now', '-' || ? || ' hours')
    GROUP BY time_bucket, temperature_zone_id
    ORDER BY time_bucket ASC
  `).all(zone_id, hours)
  res.json(records)
})

router.get('/alerts', (req, res) => {
  const { status } = req.query
  let sql = `
    SELECT ta.*, tz.name as zone_name, tz.min_temp, tz.max_temp, l.code as location_code
    FROM temperature_alerts ta
    JOIN temperature_zones tz ON ta.temperature_zone_id = tz.id
    LEFT JOIN locations l ON ta.location_id = l.id
  `
  const params = []
  if (status) {
    sql += ' WHERE ta.status = ?'
    params.push(status)
  }
  sql += ' ORDER BY ta.created_at DESC'
  const alerts = db.prepare(sql).all(...params)
  res.json(alerts)
})

router.post('/alerts/:id/handle', (req, res) => {
  const { handling_measures } = req.body
  const alert = db.prepare('SELECT * FROM temperature_alerts WHERE id = ?').get(req.params.id)
  if (!alert) return res.status(404).json({ error: '告警不存在' })

  const affectedInventory = db.prepare(`
    SELECT i.*, p.name as product_name, c.name as customer_name
    FROM inventory i
    JOIN locations l ON i.location_id = l.id
    JOIN products p ON i.product_id = p.id
    JOIN customers c ON i.customer_id = c.id
    WHERE l.temperature_zone_id = ?
  `).all(alert.temperature_zone_id)

  db.prepare(`
    UPDATE temperature_alerts 
    SET status = 'handled', 
        end_time = CURRENT_TIMESTAMP,
        affected_inventory = ?,
        handling_measures = ?
    WHERE id = ?
  `).run(JSON.stringify(affectedInventory.map(i => ({ id: i.id, batch_no: i.batch_no, quantity: i.available_quantity }))), 
         handling_measures, req.params.id)

  res.json({ success: true, affected_inventory: affectedInventory })
})

module.exports = router
