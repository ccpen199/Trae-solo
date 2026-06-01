const express = require('express')
const { auth } = require('../middleware/auth')
const router = express.Router()

router.use(auth)

router.get('/', (req, res) => {
  const { app_id, status, action, date_from, date_to, keyword } = req.query
  let sql = `SELECT l.*, a.app_name, a.app_code FROM execution_logs l LEFT JOIN applications a ON a.id = l.app_id WHERE 1=1`
  const params = []
  if (app_id) { sql += ' AND l.app_id = ?'; params.push(app_id) }
  if (status) { sql += ' AND l.status = ?'; params.push(status) }
  if (action) { sql += ' AND l.action = ?'; params.push(action) }
  if (date_from) { sql += ' AND l.started_at >= ?'; params.push(date_from) }
  if (date_to) { sql += ' AND l.started_at <= ?'; params.push(date_to) }
  if (keyword) { sql += ' AND (l.request_payload LIKE ? OR l.response_payload LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`) }
  sql += ' ORDER BY l.id DESC LIMIT 500'
  const rows = req.db.prepare(sql).all(...params)
  res.json({ code: 0, data: rows })
})

router.get('/:id', (req, res) => {
  const row = req.db.prepare('SELECT * FROM execution_logs WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ code: 404, message: '不存在' })
  res.json({ code: 0, data: row })
})

router.get('/stats/summary', (req, res) => {
  const data = {
    total: req.db.prepare('SELECT COUNT(*) AS c FROM execution_logs').get().c,
    success: req.db.prepare("SELECT COUNT(*) AS c FROM execution_logs WHERE status = 'success'").get().c,
    failed: req.db.prepare("SELECT COUNT(*) AS c FROM execution_logs WHERE status = 'failed'").get().c,
    avgDuration: req.db.prepare('SELECT COALESCE(AVG(duration_ms),0) AS v FROM execution_logs').get().v
  }
  res.json({ code: 0, data })
})

module.exports = router
