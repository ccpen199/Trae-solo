require('dotenv').config({ path: '../.env' })
const express = require('express')
const cors = require('cors')
const path = require('path')
const db = require('./database')

const app = express()
const PORT = parseInt(process.env.BACKEND_PORT || 58847)

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48847}`,
  credentials: true
}))
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/cranes', (req, res) => {
  const cranes = db.prepare('SELECT * FROM cranes ORDER BY id').all()
  res.json(cranes)
})

app.get('/api/cranes/:id', (req, res) => {
  const crane = db.prepare('SELECT * FROM cranes WHERE id = ?').get(req.params.id)
  if (!crane) return res.status(404).json({ error: '设备不存在' })
  res.json(crane)
})

app.post('/api/cranes', (req, res) => {
  const { device_code, install_location, record_info, driver_name, driver_phone, maintenance_unit, maintenance_phone, test_valid_until } = req.body
  try {
    const result = db.prepare(`
      INSERT INTO cranes (device_code, install_location, record_info, driver_name, driver_phone, maintenance_unit, maintenance_phone, test_valid_until)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(device_code, install_location, record_info, driver_name, driver_phone, maintenance_unit, maintenance_phone, test_valid_until)
    res.json({ id: result.lastInsertRowid, ...req.body })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.put('/api/cranes/:id', (req, res) => {
  const { device_code, install_location, record_info, driver_name, driver_phone, maintenance_unit, maintenance_phone, test_valid_until, status } = req.body
  db.prepare(`
    UPDATE cranes SET device_code=?, install_location=?, record_info=?, driver_name=?, driver_phone=?, maintenance_unit=?, maintenance_phone=?, test_valid_until=?, status=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(device_code, install_location, record_info, driver_name, driver_phone, maintenance_unit, maintenance_phone, test_valid_until, status, req.params.id)
  res.json({ id: req.params.id, ...req.body })
})

app.delete('/api/cranes/:id', (req, res) => {
  db.prepare('DELETE FROM cranes WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

app.get('/api/monitor-data', (req, res) => {
  const { crane_id, limit = 50 } = req.query
  let query = 'SELECT md.*, c.device_code FROM monitor_data md LEFT JOIN cranes c ON md.crane_id = c.id'
  const params = []
  if (crane_id) {
    query += ' WHERE crane_id = ?'
    params.push(crane_id)
  }
  query += ' ORDER BY recorded_at DESC LIMIT ?'
  params.push(parseInt(limit))
  const data = db.prepare(query).all(...params)
  res.json(data)
})

app.get('/api/monitor-data/latest', (req, res) => {
  const data = db.prepare(`
    SELECT md.*, c.device_code, c.install_location, c.status as crane_status
    FROM monitor_data md
    INNER JOIN (
      SELECT crane_id, MAX(recorded_at) as max_time
      FROM monitor_data
      GROUP BY crane_id
    ) latest ON md.crane_id = latest.crane_id AND md.recorded_at = latest.max_time
    LEFT JOIN cranes c ON md.crane_id = c.id
    ORDER BY md.crane_id
  `).all()
  res.json(data)
})

app.post('/api/monitor-data', (req, res) => {
  const { crane_id, weight, weight_status, range, range_status, height, height_status, wind_speed, wind_speed_status, tilt_angle, tilt_status, collision_risk, data_source } = req.body
  const result = db.prepare(`
    INSERT INTO monitor_data (crane_id, weight, weight_status, range, range_status, height, height_status, wind_speed, wind_speed_status, tilt_angle, tilt_status, collision_risk, data_source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(crane_id, weight, weight_status, range, range_status, height, height_status, wind_speed, wind_speed_status, tilt_angle, tilt_status, collision_risk, data_source)
  res.json({ id: result.lastInsertRowid })
})

app.get('/api/alerts', (req, res) => {
  const { status, crane_id } = req.query
  let query = 'SELECT a.*, c.device_code, c.install_location FROM alerts a LEFT JOIN cranes c ON a.crane_id = c.id'
  const params = []
  const conditions = []
  if (status) {
    conditions.push('a.status = ?')
    params.push(status)
  }
  if (crane_id) {
    conditions.push('a.crane_id = ?')
    params.push(crane_id)
  }
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ')
  }
  query += ' ORDER BY a.created_at DESC'
  const alerts = db.prepare(query).all(...params)
  res.json(alerts)
})

app.get('/api/alerts/:id', (req, res) => {
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id)
  res.json(alert)
})

app.post('/api/alerts', (req, res) => {
  const { crane_id, alert_type, alert_level, message } = req.body
  const result = db.prepare(`
    INSERT INTO alerts (crane_id, alert_type, alert_level, message)
    VALUES (?, ?, ?, ?)
  `).run(crane_id, alert_type, alert_level, message)
  res.json({ id: result.lastInsertRowid })
})

app.put('/api/alerts/:id/handle', (req, res) => {
  const { handler, handle_result, status } = req.body
  db.prepare(`
    UPDATE alerts SET handler=?, handle_result=?, status=?, handled_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(handler, handle_result, status, req.params.id)
  
  db.prepare(`
    INSERT INTO handle_records (alert_id, operator, action, remark)
    VALUES (?, ?, ?, ?)
  `).run(req.params.id, handler, status, handle_result)
  
  res.json({ success: true })
})

app.get('/api/maintenance', (req, res) => {
  const { status, crane_id } = req.query
  let query = 'SELECT mp.*, c.device_code, c.install_location FROM maintenance_plans mp LEFT JOIN cranes c ON mp.crane_id = c.id'
  const params = []
  const conditions = []
  if (status) {
    conditions.push('mp.status = ?')
    params.push(status)
  }
  if (crane_id) {
    conditions.push('mp.crane_id = ?')
    params.push(crane_id)
  }
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ')
  }
  query += ' ORDER BY mp.plan_date DESC'
  const plans = db.prepare(query).all(...params)
  res.json(plans)
})

app.post('/api/maintenance', (req, res) => {
  const { crane_id, plan_date, check_items } = req.body
  const result = db.prepare(`
    INSERT INTO maintenance_plans (crane_id, plan_date, check_items)
    VALUES (?, ?, ?)
  `).run(crane_id, plan_date, check_items)
  res.json({ id: result.lastInsertRowid })
})

app.put('/api/maintenance/:id', (req, res) => {
  const { check_items, found_problems, rectify_photos, recheck_result, status } = req.body
  const updates = []
  const params = []
  
  if (check_items !== undefined) { updates.push('check_items=?'); params.push(check_items) }
  if (found_problems !== undefined) { updates.push('found_problems=?'); params.push(found_problems) }
  if (rectify_photos !== undefined) { updates.push('rectify_photos=?'); params.push(rectify_photos) }
  if (recheck_result !== undefined) { updates.push('recheck_result=?'); params.push(recheck_result) }
  if (status !== undefined) { updates.push('status=?'); params.push(status) }
  
  if (status === 'completed') {
    updates.push('completed_at=CURRENT_TIMESTAMP')
  }
  
  params.push(req.params.id)
  db.prepare(`UPDATE maintenance_plans SET ${updates.join(',')} WHERE id=?`).run(...params)
  res.json({ success: true })
})

app.get('/api/dashboard/summary', (req, res) => {
  const totalCranes = db.prepare('SELECT COUNT(*) as count FROM cranes').get().count
  const normalCranes = db.prepare("SELECT COUNT(*) as count FROM cranes WHERE status='normal'").get().count
  const warningCranes = db.prepare("SELECT COUNT(*) as count FROM cranes WHERE status='warning'").get().count
  const offlineCranes = db.prepare("SELECT COUNT(*) as count FROM cranes WHERE status='offline'").get().count
  const pendingAlerts = db.prepare("SELECT COUNT(*) as count FROM alerts WHERE status='pending'").get().count
  const overdueMaintenance = db.prepare("SELECT COUNT(*) as count FROM maintenance_plans WHERE status='overdue'").get().count
  
  res.json({
    totalCranes,
    normalCranes,
    warningCranes,
    offlineCranes,
    pendingAlerts,
    overdueMaintenance
  })
})

app.get('/api/handle-records/:alertId', (req, res) => {
  const records = db.prepare('SELECT * FROM handle_records WHERE alert_id = ? ORDER BY created_at DESC').all(req.params.alertId)
  res.json(records)
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务运行在 http://127.0.0.1:${PORT}`)
})
