const express = require('express')
const { auth, requireRole } = require('../middleware/auth')
const router = express.Router()

router.use(auth)

function now() { return new Date().toISOString().replace('T', ' ').substring(0, 19) }
function genNo(prefix) {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return `${prefix}-${ymd}-${seq}`
}

router.get('/', (req, res) => {
  const { status, task_type, app_id, keyword } = req.query
  let sql = `SELECT t.*, a.app_name, a.app_code FROM tasks t LEFT JOIN applications a ON a.id = t.app_id WHERE 1=1`
  const params = []
  if (status) { sql += ' AND t.status = ?'; params.push(status) }
  if (task_type) { sql += ' AND t.task_type = ?'; params.push(task_type) }
  if (app_id) { sql += ' AND t.app_id = ?'; params.push(app_id) }
  if (keyword) { sql += ' AND (t.task_no LIKE ? OR t.title LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`) }
  sql += ' ORDER BY t.id DESC LIMIT 200'
  const rows = req.db.prepare(sql).all(...params)
  res.json({ code: 0, data: rows })
})

router.post('/', requireRole('admin', 'ops', 'platform', 'dev', 'owner'), (req, res) => {
  const { title, app_id, task_type, params } = req.body
  if (!title) return res.status(400).json({ code: 400, message: '标题必填' })
  const task_no = genNo('TASK')
  const info = req.db.prepare(
    'INSERT INTO tasks (task_no, title, app_id, task_type, params, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(task_no, title, app_id || null, task_type || null, params ? JSON.stringify(params) : null, 'created', req.user.username)

  req.db.prepare('INSERT INTO task_events (task_id, event_type, operator, detail) VALUES (?, ?, ?, ?)')
    .run(info.lastInsertRowid, 'created', req.user.username, `创建任务 ${task_no}`)
  res.json({ code: 0, data: req.db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid) })
})

router.get('/:id', (req, res) => {
  const row = req.db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ code: 404, message: '不存在' })
  const events = req.db.prepare('SELECT * FROM task_events WHERE task_id = ? ORDER BY id').all(req.params.id)
  const execs = req.db.prepare('SELECT * FROM execution_logs WHERE task_id = ? ORDER BY id DESC').all(req.params.id)
  res.json({ code: 0, data: { ...row, events, executions: execs } })
})

// 提交
router.post('/:id/submit', requireRole('admin', 'ops', 'platform', 'owner'), (req, res) => {
  const t = req.db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id)
  if (!t) return res.status(404).json({ code: 404, message: '不存在' })
  if (t.status !== 'created') return res.status(400).json({ code: 400, message: '仅 created 状态可提交' })
  req.db.prepare("UPDATE tasks SET status = 'submitted', submitted_by = ?, submitted_at = ? WHERE id = ?")
    .run(req.user.username, now(), req.params.id)
  req.db.prepare('INSERT INTO task_events (task_id, event_type, operator, detail) VALUES (?, ?, ?, ?)')
    .run(req.params.id, 'submitted', req.user.username, '提交执行')
  res.json({ code: 0 })
})

// 执行
router.post('/:id/execute', requireRole('admin', 'ops', 'platform'), (req, res) => {
  const t = req.db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id)
  if (!t) return res.status(404).json({ code: 404, message: '不存在' })
  if (!['submitted', 'created'].includes(t.status)) return res.status(400).json({ code: 400, message: '状态不允许执行' })

  // 重复执行检测
  const recent = req.db.prepare(
    "SELECT COUNT(*) AS c FROM execution_logs WHERE task_id = ? AND started_at > datetime('now','localtime','-5 minutes')"
  ).get(req.params.id).c
  if (recent > 0) {
    req.db.prepare("UPDATE tasks SET status = 'reviewing', close_reason = ? WHERE id = ?")
      .run('重复执行拦截：5分钟内已执行', req.params.id)
    req.db.prepare('INSERT INTO task_events (task_id, event_type, operator, detail) VALUES (?, ?, ?, ?)')
      .run(req.params.id, 'blocked', req.user.username, '自动拦截：检测到重复执行')
    return res.status(409).json({ code: 409, message: '自动拦截：检测到5分钟内重复执行，已转交人工复核' })
  }

  const startedAt = now()
  const execInfo = req.db.prepare(
    'INSERT INTO execution_logs (task_id, app_id, action, request_payload, status, started_at, operator, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(req.params.id, t.app_id, t.task_type || 'execute', t.params, 'running', startedAt, req.user.username, req.ip, req.headers['user-agent'] || null)

  // 模拟执行结果（80% 成功）
  const success = Math.random() > 0.2
  const finishedAt = now()
  const durationMs = 300 + Math.floor(Math.random() * 1500)
  req.db.prepare(
    'UPDATE execution_logs SET status = ?, response_payload = ?, finished_at = ?, duration_ms = ? WHERE id = ?'
  ).run(success ? 'success' : 'failed', success ? '{"result":"ok"}' : '{"error":"模拟执行失败"}', finishedAt, durationMs, execInfo.lastInsertRowid)

  req.db.prepare("UPDATE tasks SET status = ?, executed_by = ?, executed_at = ? WHERE id = ?")
    .run(success ? 'executed' : 'failed', req.user.username, finishedAt, req.params.id)

  req.db.prepare('INSERT INTO task_events (task_id, event_type, operator, detail) VALUES (?, ?, ?, ?)')
    .run(req.params.id, success ? 'executed' : 'failed', req.user.username, success ? '执行成功' : '执行失败')

  if (!success) {
    req.db.prepare(
      'INSERT INTO alerts (alert_no, title, app_id, severity, source, status, auto_action, detail, owner) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(genNo('ALERT'), `任务执行失败：${t.task_no}`, t.app_id || null, 'high', 'task_execution', 'open', 'pending_human', `任务 ${t.task_no} 执行失败`, 'ops')
  }

  res.json({ code: 0, data: { success } })
})

// 复核
router.post('/:id/review', requireRole('admin', 'platform', 'owner'), (req, res) => {
  const { decision, reason } = req.body
  const t = req.db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id)
  if (!t) return res.status(404).json({ code: 404 })
  if (!['submitted', 'reviewing', 'failed', 'executed'].includes(t.status)) {
    return res.status(400).json({ code: 400, message: '状态不允许复核' })
  }
  if (t.created_by === req.user.username && req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '申请人不能复核自己的单据' })
  }
  const newStatus = decision === 'approve' ? 'executed' : decision === 'reject' ? 'rejected' : 'closed'
  req.db.prepare("UPDATE tasks SET status = ?, reviewed_by = ?, reviewed_at = ?, close_reason = COALESCE(?, close_reason) WHERE id = ?")
    .run(newStatus, req.user.username, now(), reason || null, req.params.id)
  req.db.prepare('INSERT INTO task_events (task_id, event_type, operator, detail) VALUES (?, ?, ?, ?)')
    .run(req.params.id, `reviewed_${decision}`, req.user.username, reason || '复核完成')
  res.json({ code: 0 })
})

// 待我复核的任务列表
router.get('/pending/review', auth, (req, res) => {
  const rows = req.db.prepare(`
    SELECT t.*, a.app_name, a.app_code FROM tasks t
    LEFT JOIN applications a ON a.id = t.app_id
    WHERE t.status IN ('submitted','reviewing','failed')
      AND t.created_by != ?
      AND (t.reviewed_by IS NULL OR t.reviewed_by != ?)
    ORDER BY t.id DESC
  `).all(req.user.username, req.user.username)
  res.json({ code: 0, data: rows })
})

// 关闭
router.post('/:id/close', requireRole('admin', 'owner'), (req, res) => {
  const { reason } = req.body
  req.db.prepare("UPDATE tasks SET status = 'closed', close_reason = ?, closed_at = ? WHERE id = ?")
    .run(reason || '手动关闭', now(), req.params.id)
  req.db.prepare('INSERT INTO task_events (task_id, event_type, operator, detail) VALUES (?, ?, ?, ?)')
    .run(req.params.id, 'closed', req.user.username, reason || '手动关闭')
  res.json({ code: 0 })
})

// 删除
router.delete('/:id', requireRole('admin'), (req, res) => {
  req.db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id)
  res.json({ code: 0 })
})

module.exports = router
