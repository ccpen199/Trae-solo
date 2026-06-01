const express = require('express')
const { auth, requireRole } = require('../middleware/auth')
const router = express.Router()

router.use(auth)

function now() { return new Date().toISOString().replace('T', ' ').substring(0, 19) }
function genNo() {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `ALERT-${ymd}-${String(Math.floor(Math.random() * 9000) + 1000)}`
}

router.get('/', (req, res) => {
  const { severity, status, source, app_id, keyword } = req.query
  let sql = `SELECT al.*, a.app_name, a.app_code FROM alerts al LEFT JOIN applications a ON a.id = al.app_id WHERE 1=1`
  const params = []
  if (severity) { sql += ' AND al.severity = ?'; params.push(severity) }
  if (status) { sql += ' AND al.status = ?'; params.push(status) }
  if (source) { sql += ' AND al.source = ?'; params.push(source) }
  if (app_id) { sql += ' AND al.app_id = ?'; params.push(app_id) }
  if (keyword) { sql += ' AND (al.alert_no LIKE ? OR al.title LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`) }
  sql += ' ORDER BY al.id DESC LIMIT 200'
  const rows = req.db.prepare(sql).all(...params)
  res.json({ code: 0, data: rows })
})

router.get('/:id', (req, res) => {
  const row = req.db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ code: 404 })
  res.json({ code: 0, data: row })
})

router.post('/', requireRole('admin', 'ops', 'platform', 'security'), (req, res) => {
  const { title, app_id, severity, source, detail, owner } = req.body
  if (!title) return res.status(400).json({ code: 400, message: '标题必填' })
  if (severity && !['info', 'low', 'medium', 'high', 'critical'].includes(severity)) {
    return res.status(400).json({ code: 400, message: '严重级别非法' })
  }
  const alert_no = genNo()
  const info = req.db.prepare(
    'INSERT INTO alerts (alert_no, title, app_id, severity, source, status, detail, owner) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(alert_no, title, app_id || null, severity || 'info', source || 'manual', 'open', detail || null, owner || req.user.username)
  res.json({ code: 0, data: req.db.prepare('SELECT * FROM alerts WHERE id = ?').get(info.lastInsertRowid) })
})

// 处理告警
router.post('/:id/handle', requireRole('admin', 'ops', 'platform', 'security'), (req, res) => {
  const { result, action } = req.body
  if (!result || !['auto_blocked', 'human_review', 'continue_watch', 'closed'].includes(result)) {
    return res.status(400).json({ code: 400, message: '处理结果必须为 auto_blocked / human_review / continue_watch / closed' })
  }
  const status = result === 'closed' ? 'closed' : result === 'auto_blocked' ? 'blocked' : result === 'human_review' ? 'reviewing' : 'watching'
  req.db.prepare("UPDATE alerts SET status = ?, handle_result = ?, handled_by = ?, handled_at = ?, auto_action = COALESCE(?, auto_action) WHERE id = ?")
    .run(status, result, req.user.username, now(), action || null, req.params.id)
  res.json({ code: 0 })
})

router.post('/:id/close', requireRole('admin', 'owner'), (req, res) => {
  const { reason } = req.body
  req.db.prepare("UPDATE alerts SET status = 'closed', handle_result = 'closed', handled_by = ?, handled_at = ? WHERE id = ?")
    .run(req.user.username, now(), req.params.id)
  res.json({ code: 0 })
})

router.delete('/:id', requireRole('admin'), (req, res) => {
  req.db.prepare('DELETE FROM alerts WHERE id = ?').run(req.params.id)
  res.json({ code: 0 })
})

module.exports = router
