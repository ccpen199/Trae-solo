const express = require('express')
const { auth, requireRole } = require('../middleware/auth')
const router = express.Router()

router.use(auth)

function now() { return new Date().toISOString().replace('T', ' ').substring(0, 19) }
function genNo(prefix) {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `${prefix}-${ymd}-${String(Math.floor(Math.random() * 9000) + 1000)}`
}

router.get('/', (req, res) => {
  const { status, risk_level, change_type, app_id, keyword } = req.query
  let sql = `SELECT co.*, a.app_name, a.app_code FROM change_orders co LEFT JOIN applications a ON a.id = co.app_id WHERE 1=1`
  const params = []
  if (status) { sql += ' AND co.status = ?'; params.push(status) }
  if (risk_level) { sql += ' AND co.risk_level = ?'; params.push(risk_level) }
  if (change_type) { sql += ' AND co.change_type = ?'; params.push(change_type) }
  if (app_id) { sql += ' AND co.app_id = ?'; params.push(app_id) }
  if (keyword) { sql += ' AND (co.order_no LIKE ? OR co.title LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`) }
  sql += ' ORDER BY co.id DESC LIMIT 200'
  const rows = req.db.prepare(sql).all(...params)
  res.json({ code: 0, data: rows })
})

router.post('/', requireRole('admin', 'owner', 'dev', 'platform'), (req, res) => {
  const { title, app_id, change_type, risk_level, description, window_start, window_end } = req.body
  if (!title) return res.status(400).json({ code: 400, message: '标题必填' })
  if (risk_level && !['low', 'medium', 'high', 'critical'].includes(risk_level)) {
    return res.status(400).json({ code: 400, message: '风险等级非法' })
  }
  const order_no = genNo('CO')
  const info = req.db.prepare(
    `INSERT INTO change_orders (order_no, title, app_id, change_type, risk_level, description, window_start, window_end, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(order_no, title, app_id || null, change_type || null, risk_level || 'low', description || null,
    window_start || null, window_end || null, 'draft', req.user.username)
  req.db.prepare('INSERT INTO change_order_events (order_id, event_type, operator, detail) VALUES (?, ?, ?, ?)')
    .run(info.lastInsertRowid, 'created', req.user.username, `创建变更单 ${order_no}`)
  res.json({ code: 0, data: req.db.prepare('SELECT * FROM change_orders WHERE id = ?').get(info.lastInsertRowid) })
})

router.get('/:id', (req, res) => {
  const row = req.db.prepare('SELECT * FROM change_orders WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ code: 404 })
  const events = req.db.prepare('SELECT * FROM change_order_events WHERE order_id = ? ORDER BY id').all(req.params.id)
  res.json({ code: 0, data: { ...row, events } })
})

router.put('/:id', requireRole('admin', 'owner', 'platform'), (req, res) => {
  const { title, app_id, change_type, risk_level, description, window_start, window_end } = req.body
  req.db.prepare(`UPDATE change_orders SET
    title = COALESCE(?, title),
    app_id = COALESCE(?, app_id),
    change_type = COALESCE(?, change_type),
    risk_level = COALESCE(?, risk_level),
    description = COALESCE(?, description),
    window_start = COALESCE(?, window_start),
    window_end = COALESCE(?, window_end)
    WHERE id = ?`
  ).run(title || null, app_id || null, change_type || null, risk_level || null, description || null, window_start || null, window_end || null, req.params.id)
  res.json({ code: 0, data: req.db.prepare('SELECT * FROM change_orders WHERE id = ?').get(req.params.id) })
})

// 提交
router.post('/:id/submit', requireRole('admin', 'owner', 'platform'), (req, res) => {
  const co = req.db.prepare('SELECT * FROM change_orders WHERE id = ?').get(req.params.id)
  if (!co) return res.status(404).json({ code: 404 })
  if (co.status !== 'draft') return res.status(400).json({ code: 400, message: '仅草稿可提交' })
  req.db.prepare("UPDATE change_orders SET status = 'submitted' WHERE id = ?").run(req.params.id)
  req.db.prepare('INSERT INTO change_order_events (order_id, event_type, operator, detail) VALUES (?, ?, ?, ?)')
    .run(req.params.id, 'submitted', req.user.username, '提交审核')
  res.json({ code: 0 })
})

// 审批
router.post('/:id/approve', requireRole('admin', 'platform', 'owner'), (req, res) => {
  const co = req.db.prepare('SELECT * FROM change_orders WHERE id = ?').get(req.params.id)
  if (!co) return res.status(404).json({ code: 404 })
  if (!['submitted', 'rejected'].includes(co.status)) return res.status(400).json({ code: 400, message: '状态不允许审批' })
  if (co.created_by === req.user.username && req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '申请人不能审批自己的单据' })
  }
  req.db.prepare("UPDATE change_orders SET status = 'approved', approver = ?, approved_at = ? WHERE id = ?")
    .run(req.user.username, now(), req.params.id)
  req.db.prepare('INSERT INTO change_order_events (order_id, event_type, operator, detail) VALUES (?, ?, ?, ?)')
    .run(req.params.id, 'approved', req.user.username, '审批通过')
  res.json({ code: 0 })
})

// 退回
router.post('/:id/reject', requireRole('admin', 'platform', 'owner', 'security'), (req, res) => {
  const { reason } = req.body
  const co = req.db.prepare('SELECT * FROM change_orders WHERE id = ?').get(req.params.id)
  if (!co) return res.status(404).json({ code: 404 })
  if (co.created_by === req.user.username && req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '申请人不能退回自己的单据' })
  }
  req.db.prepare("UPDATE change_orders SET status = 'rejected', reviewer = ?, reviewed_at = ?, close_reason = ? WHERE id = ?")
    .run(req.user.username, now(), reason || '退回补正', req.params.id)
  req.db.prepare('INSERT INTO change_order_events (order_id, event_type, operator, detail) VALUES (?, ?, ?, ?)')
    .run(req.params.id, 'rejected', req.user.username, reason || '退回补正')
  res.json({ code: 0 })
})

// 执行
router.post('/:id/execute', requireRole('admin', 'ops', 'platform'), (req, res) => {
  const co = req.db.prepare('SELECT * FROM change_orders WHERE id = ?').get(req.params.id)
  if (!co) return res.status(404).json({ code: 404 })
  if (co.status !== 'approved') return res.status(400).json({ code: 400, message: '仅审批通过的变更单可执行' })

  // 越权/敏感信息检测
  const sensitiveWords = ['password', 'secret', 'key', 'token']
  const desc = (co.description || '').toLowerCase()
  const hasSensitive = sensitiveWords.some(w => desc.includes(w))
  if (hasSensitive && req.user.role !== 'admin' && req.user.role !== 'security') {
    req.db.prepare("UPDATE change_orders SET status = 'reviewing', close_reason = ? WHERE id = ?")
      .run('敏感信息自动拦截，需安全管理员复核', req.params.id)
    req.db.prepare('INSERT INTO change_order_events (order_id, event_type, operator, detail) VALUES (?, ?, ?, ?)')
      .run(req.params.id, 'blocked', 'system', '敏感信息拦截，需安全管理员复核')
    return res.status(409).json({ code: 409, message: '检测到敏感信息，已自动拦截并转交安全管理员复核' })
  }

  const success = Math.random() > 0.15
  req.db.prepare("UPDATE change_orders SET status = ?, result = ? WHERE id = ?")
    .run(success ? 'executed' : 'failed', success ? '执行成功' : '执行失败', req.params.id)
  req.db.prepare('INSERT INTO change_order_events (order_id, event_type, operator, detail) VALUES (?, ?, ?, ?)')
    .run(req.params.id, success ? 'executed' : 'failed', req.user.username, success ? '变更执行成功' : '变更执行失败')

  if (!success) {
    req.db.prepare(
      'INSERT INTO alerts (alert_no, title, app_id, severity, source, status, auto_action, detail, owner) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(genNo('ALERT'), `变更执行失败：${co.order_no}`, co.app_id || null, 'critical', 'change_execution', 'open', 'pending_human', `变更 ${co.order_no} 执行失败`, 'ops')
  }
  res.json({ code: 0, data: { success } })
})

// 关闭
router.post('/:id/close', requireRole('admin', 'owner'), (req, res) => {
  const { reason } = req.body
  req.db.prepare("UPDATE change_orders SET status = 'closed', close_reason = ?, closed_at = ? WHERE id = ?")
    .run(reason || '手动关闭', now(), req.params.id)
  req.db.prepare('INSERT INTO change_order_events (order_id, event_type, operator, detail) VALUES (?, ?, ?, ?)')
    .run(req.params.id, 'closed', req.user.username, reason || '手动关闭')
  res.json({ code: 0 })
})

// 待我复核的变更单列表
router.get('/pending/review', auth, (req, res) => {
  const rows = req.db.prepare(`
    SELECT co.*, a.app_name, a.app_code FROM change_orders co
    LEFT JOIN applications a ON a.id = co.app_id
    WHERE co.status IN ('submitted','reviewing')
      AND co.created_by != ?
      AND (co.approver IS NULL OR co.approver != ?)
    ORDER BY co.id DESC
  `).all(req.user.username, req.user.username)
  res.json({ code: 0, data: rows })
})

router.delete('/:id', requireRole('admin'), (req, res) => {
  req.db.prepare('DELETE FROM change_orders WHERE id = ?').run(req.params.id)
  res.json({ code: 0 })
})

module.exports = router
