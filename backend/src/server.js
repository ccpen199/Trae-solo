require('dotenv').config({ path: '../.env' })
const express = require('express')
const cors = require('cors')
const path = require('path')
const db = require('./database')

const app = express()
const PORT = 58876

app.use(cors({
  origin: ['http://127.0.0.1:48876', 'http://localhost:48876'],
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/units', (req, res) => {
  const { risk_level, is_focus } = req.query
  let sql = 'SELECT * FROM units WHERE 1=1'
  const params = []
  
  if (risk_level) {
    sql += ' AND risk_level = ?'
    params.push(risk_level)
  }
  if (is_focus) {
    sql += ' AND is_focus = ?'
    params.push(is_focus === 'true' ? 1 : 0)
  }
  
  sql += ' ORDER BY created_at DESC'
  const units = db.prepare(sql).all(...params)
  res.json(units)
})

app.get('/api/units/:id', (req, res) => {
  const unit = db.prepare('SELECT * FROM units WHERE id = ?').get(req.params.id)
  if (!unit) return res.status(404).json({ error: '单位不存在' })
  res.json(unit)
})

app.post('/api/units', (req, res) => {
  const { name, address, industry, risk_level, fire_facilities, responsible_person, phone } = req.body
  const is_focus = risk_level === 'high' ? 1 : 0
  
  const result = db.prepare(`
    INSERT INTO units (name, address, industry, risk_level, fire_facilities, responsible_person, phone, is_focus)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, address, industry || 'medium', fire_facilities, responsible_person, phone, is_focus)
  
  res.json({ id: result.lastInsertRowid, ...req.body, is_focus })
})

app.put('/api/units/:id', (req, res) => {
  const { name, address, industry, risk_level, fire_facilities, responsible_person, phone } = req.body
  const is_focus = risk_level === 'high' ? 1 : 0
  
  db.prepare(`
    UPDATE units SET name=?, address=?, industry=?, risk_level=?, fire_facilities=?, responsible_person=?, phone=?, is_focus=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(name, address, industry, risk_level || 'medium', fire_facilities, responsible_person, phone, is_focus, req.params.id)
  
  res.json({ success: true })
})

app.delete('/api/units/:id', (req, res) => {
  db.prepare('DELETE FROM units WHERE id=?').run(req.params.id)
  res.json({ success: true })
})

app.get('/api/inspection-records', (req, res) => {
  const { unit_id } = req.query
  let sql = `
    SELECT ir.*, u.name as unit_name 
    FROM inspection_records ir
    LEFT JOIN units u ON ir.unit_id = u.id
    WHERE 1=1
  `
  const params = []
  
  if (unit_id) {
    sql += ' AND ir.unit_id = ?'
    params.push(unit_id)
  }
  
  sql += ' ORDER BY ir.created_at DESC'
  const records = db.prepare(sql).all(...params)
  res.json(records)
})

app.get('/api/inspection-records/:id', (req, res) => {
  const record = db.prepare('SELECT * FROM inspection_records WHERE id = ?').get(req.params.id)
  if (!record) return res.status(404).json({ error: '记录不存在' })
  res.json(record)
})

app.post('/api/inspection-records', (req, res) => {
  const { unit_id, inspector, inspection_date, fire_extinguisher, fire_extinguisher_photo, evacuation_route, evacuation_route_photo, electrical_circuit, electrical_circuit_photo, control_room, control_room_photo, other_issues, overall_status } = req.body
  
  const result = db.prepare(`
    INSERT INTO inspection_records (unit_id, inspector, inspection_date, fire_extinguisher, fire_extinguisher_photo, evacuation_route, evacuation_route_photo, electrical_circuit, electrical_circuit_photo, control_room, control_room_photo, other_issues, overall_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(unit_id, inspector, inspection_date, fire_extinguisher, fire_extinguisher_photo, evacuation_route, evacuation_route_photo, electrical_circuit, electrical_circuit_photo, control_room, control_room_photo, other_issues, overall_status)
  
  const recordId = result.lastInsertRowid
  
  const hazardTypes = [
    { key: 'fire_extinguisher', label: '灭火器' },
    { key: 'evacuation_route', label: '疏散通道' },
    { key: 'electrical_circuit', label: '电气线路' },
    { key: 'control_room', label: '消防控制室' }
  ]
  
  const insertHazard = db.prepare('INSERT INTO hazards (record_id, unit_id, hazard_type, description, photo, status) VALUES (?, ?, ?, ?, ?, ?)')
  
  const statusMap = {
    minor: '一般问题',
    serious: '严重问题'
  }
  
  hazardTypes.forEach(({ key, label }) => {
    const value = req.body[key]
    if (value && value !== 'normal') {
      const photo = req.body[`${key}_photo`]
      let level = 'general'
      if (value === 'serious') level = 'major'
      const statusText = statusMap[value] || value
      insertHazard.run(recordId, unit_id, label, `检查项[${label}]存在问题: ${statusText}`, photo || '', 'pending')
    }
  })
  
  res.json({ id: recordId, success: true })
})

app.get('/api/hazards', (req, res) => {
  const { unit_id, status } = req.query
  let sql = `
    SELECT h.*, u.name as unit_name, ir.inspection_date
    FROM hazards h
    LEFT JOIN units u ON h.unit_id = u.id
    LEFT JOIN inspection_records ir ON h.record_id = ir.id
    WHERE 1=1
  `
  const params = []
  
  if (unit_id) {
    sql += ' AND h.unit_id = ?'
    params.push(unit_id)
  }
  if (status) {
    sql += ' AND h.status = ?'
    params.push(status)
  }
  
  sql += ' ORDER BY h.created_at DESC'
  const hazards = db.prepare(sql).all(...params)
  res.json(hazards)
})

app.get('/api/hazards/:id', (req, res) => {
  const hazard = db.prepare('SELECT * FROM hazards WHERE id = ?').get(req.params.id)
  if (!hazard) return res.status(404).json({ error: '隐患不存在' })
  res.json(hazard)
})

app.put('/api/hazards/:id/status', (req, res) => {
  const { status } = req.body
  db.prepare('UPDATE hazards SET status = ? WHERE id = ?').run(status, req.params.id)
  res.json({ success: true })
})

app.get('/api/rectifications', (req, res) => {
  const { hazard_id, unit_id, status } = req.query
  let sql = `
    SELECT r.*, u.name as unit_name, h.description as hazard_description, h.hazard_type
    FROM rectifications r
    LEFT JOIN units u ON r.unit_id = u.id
    LEFT JOIN hazards h ON r.hazard_id = h.id
    WHERE 1=1
  `
  const params = []
  
  if (hazard_id) {
    sql += ' AND r.hazard_id = ?'
    params.push(hazard_id)
  }
  if (unit_id) {
    sql += ' AND r.unit_id = ?'
    params.push(unit_id)
  }
  if (status) {
    sql += ' AND r.status = ?'
    params.push(status)
  }
  
  sql += ' ORDER BY r.created_at DESC'
  const rectifications = db.prepare(sql).all(...params)
  res.json(rectifications)
})

app.post('/api/rectifications', (req, res) => {
  const { hazard_id, unit_id, responsible_person, deadline, measures, attachment_required } = req.body
  
  const result = db.prepare(`
    INSERT INTO rectifications (hazard_id, unit_id, responsible_person, deadline, measures, attachment_required, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `).run(hazard_id, unit_id, responsible_person, deadline, measures, attachment_required ? 1 : 0)
  
  db.prepare('UPDATE hazards SET status = ? WHERE id = ?').run('rectifying', hazard_id)
  
  res.json({ id: result.lastInsertRowid, success: true })
})

app.put('/api/rectifications/:id', (req, res) => {
  const { responsible_person, deadline, measures, status, actual_completion_date, escalation_level } = req.body
  
  db.prepare(`
    UPDATE rectifications SET responsible_person=?, deadline=?, measures=?, status=?, actual_completion_date=?, escalation_level=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(responsible_person, deadline, measures, status, actual_completion_date, escalation_level || 0, req.params.id)
  
  const rect = db.prepare('SELECT hazard_id FROM rectifications WHERE id = ?').get(req.params.id)
  if (status === 'completed') {
    db.prepare('UPDATE hazards SET status = ? WHERE id = ?').run('rechecking', rect.hazard_id)
  }
  
  res.json({ success: true })
})

app.get('/api/rectifications/overdue', (req, res) => {
  const today = new Date().toISOString().split('T')[0]
  const overdue = db.prepare(`
    SELECT r.*, u.name as unit_name, h.description as hazard_description, h.hazard_type
    FROM rectifications r
    LEFT JOIN units u ON r.unit_id = u.id
    LEFT JOIN hazards h ON r.hazard_id = h.id
    WHERE r.status IN ('pending', 'processing') AND r.deadline < ?
    ORDER BY r.deadline ASC
  `).all(today)
  
  overdue.forEach(r => {
    const deadline = new Date(r.deadline)
    const now = new Date(today)
    const daysOverdue = Math.floor((now - deadline) / (1000 * 60 * 60 * 24))
    const newLevel = Math.min(3, Math.floor(daysOverdue / 3) + 1)
    
    if (newLevel > r.escalation_level) {
      db.prepare('UPDATE rectifications SET escalation_level = ? WHERE id = ?').run(newLevel, r.id)
      r.escalation_level = newLevel
    }
    r.days_overdue = daysOverdue
  })
  
  res.json(overdue)
})

app.get('/api/rechecks', (req, res) => {
  const { rectification_id, unit_id } = req.query
  let sql = `
    SELECT rc.*, u.name as unit_name, h.description as hazard_description, 
           r.responsible_person, r.deadline
    FROM rechecks rc
    LEFT JOIN units u ON rc.unit_id = u.id
    LEFT JOIN hazards h ON rc.hazard_id = h.id
    LEFT JOIN rectifications r ON rc.rectification_id = r.id
    WHERE 1=1
  `
  const params = []
  
  if (rectification_id) {
    sql += ' AND rc.rectification_id = ?'
    params.push(rectification_id)
  }
  if (unit_id) {
    sql += ' AND rc.unit_id = ?'
    params.push(unit_id)
  }
  
  sql += ' ORDER BY rc.created_at DESC'
  const rechecks = db.prepare(sql).all(...params)
  res.json(rechecks)
})

app.post('/api/rechecks', (req, res) => {
  const { rectification_id, hazard_id, unit_id, rechecker, recheck_date, is_passed, need_again_rectify, punishment_suggestion, close_evidence, notes } = req.body
  
  const result = db.prepare(`
    INSERT INTO rechecks (rectification_id, hazard_id, unit_id, rechecker, recheck_date, is_passed, need_again_rectify, punishment_suggestion, close_evidence, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(rectification_id, hazard_id, unit_id, rechecker, recheck_date, is_passed ? 1 : 0, need_again_rectify ? 1 : 0, punishment_suggestion, close_evidence, notes)
  
  if (is_passed) {
    db.prepare('UPDATE hazards SET status = ? WHERE id = ?').run('closed', hazard_id)
    db.prepare('UPDATE rectifications SET status = ? WHERE id = ?').run('passed', rectification_id)
  } else if (need_again_rectify) {
    db.prepare('UPDATE hazards SET status = ? WHERE id = ?').run('rectifying', hazard_id)
    db.prepare('UPDATE rectifications SET status = ? WHERE id = ?').run('pending', rectification_id)
  } else {
    db.prepare('UPDATE hazards SET status = ? WHERE id = ?').run('recheck_failed', hazard_id)
  }
  
  res.json({ id: result.lastInsertRowid, success: true })
})

app.get('/api/dashboard/stats', (req, res) => {
  const totalUnits = db.prepare('SELECT COUNT(*) as count FROM units').get().count
  const focusUnits = db.prepare('SELECT COUNT(*) as count FROM units WHERE is_focus = 1').get().count
  const highRiskUnits = db.prepare("SELECT COUNT(*) as count FROM units WHERE risk_level = 'high'").get().count
  
  const pendingHazards = db.prepare("SELECT COUNT(*) as count FROM hazards WHERE status IN ('pending', 'rectifying')").get().count
  const recheckingHazards = db.prepare("SELECT COUNT(*) as count FROM hazards WHERE status = 'rechecking'").get().count
  const closedHazards = db.prepare("SELECT COUNT(*) as count FROM hazards WHERE status = 'closed'").get().count
  
  const today = new Date().toISOString().split('T')[0]
  const overdueRectifications = db.prepare("SELECT COUNT(*) as count FROM rectifications WHERE status IN ('pending', 'processing') AND deadline < ?").get(today).count
  
  const recentRecords = db.prepare(`
    SELECT ir.*, u.name as unit_name
    FROM inspection_records ir
    LEFT JOIN units u ON ir.unit_id = u.id
    ORDER BY ir.created_at DESC
    LIMIT 10
  `).all()
  
  res.json({
    totalUnits,
    focusUnits,
    highRiskUnits,
    pendingHazards,
    recheckingHazards,
    closedHazards,
    overdueRectifications,
    recentRecords
  })
})

app.get('/api/dashboard/hazard-trend', (req, res) => {
  const trend = db.prepare(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as count
    FROM hazards
    WHERE created_at >= date('now', '-30 days')
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all()
  res.json(trend)
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`)
})

module.exports = app
