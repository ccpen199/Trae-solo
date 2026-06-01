const express = require('express')
const XLSX = require('xlsx')
const { auth, requireRole } = require('../middleware/auth')
const router = express.Router()

router.use(auth)

router.get('/', requireRole('admin', 'security', 'platform'), (req, res) => {
  const { action, target_type, username, date_from, date_to } = req.query
  let sql = 'SELECT * FROM audit_logs WHERE 1=1'
  const params = []
  if (action) { sql += ' AND action = ?'; params.push(action) }
  if (target_type) { sql += ' AND target_type = ?'; params.push(target_type) }
  if (username) { sql += ' AND username = ?'; params.push(username) }
  if (date_from) { sql += ' AND created_at >= ?'; params.push(date_from) }
  if (date_to) { sql += ' AND created_at <= ?'; params.push(date_to) }
  sql += ' ORDER BY id DESC LIMIT 500'
  const rows = req.db.prepare(sql).all(...params)
  res.json({ code: 0, data: rows })
})

router.get('/export', requireRole('admin', 'security'), (req, res) => {
  const rows = req.db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 5000').all()
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'audit_logs')
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="audit_logs_${Date.now()}.xlsx"`)
  res.send(buffer)
})

// Users management
router.get('/users', requireRole('admin', 'security'), (req, res) => {
  const rows = req.db.prepare('SELECT id, username, display_name, role, department, status, created_at, updated_at FROM users ORDER BY id').all()
  res.json({ code: 0, data: rows })
})

router.post('/users/:id/toggle-status', requireRole('admin'), (req, res) => {
  const user = req.db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)
  if (!user) return res.status(404).json({ code: 404 })
  const newStatus = user.status === 'active' ? 'inactive' : 'active'
  req.db.prepare("UPDATE users SET status = ?, updated_at = datetime('now','localtime') WHERE id = ?")
    .run(newStatus, req.params.id)
  res.json({ code: 0 })
})

// Roles/permissions audit snapshot
router.get('/permissions', requireRole('admin', 'security'), (req, res) => {
  const data = {
    roleDefinitions: [
      { role: 'admin', desc: '系统管理员，全权限' },
      { role: 'platform', desc: '平台工程师，应用/配置/任务' },
      { role: 'ops', desc: '运维工程师，执行/监控' },
      { role: 'dev', desc: '开发者，查看/申请' },
      { role: 'owner', desc: '应用负责人，审批' },
      { role: 'security', desc: '安全管理员，审计/权限' },
      { role: 'viewer', desc: '访客，只读' }
    ],
    users: req.db.prepare('SELECT id, username, display_name, role, department, status FROM users ORDER BY id').all()
  }
  res.json({ code: 0, data })
})

module.exports = router
