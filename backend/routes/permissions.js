const express = require('express')
const { auth, requireRole } = require('../middleware/auth')
const router = express.Router()

router.use(auth)

function now() { return new Date().toISOString().replace('T', ' ').substring(0, 19) }
function genNo() {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `REQ-${ymd}-${String(Math.floor(Math.random() * 9000) + 1000)}`
}

// 我的权限申请列表
router.get('/me', (req, res) => {
  const rows = req.db.prepare(`
    SELECT pr.*, c.app_name, c.app_code, c.icon, c.access_url, c.approval_required
    FROM permission_requests pr
    LEFT JOIN app_catalog c ON c.id = pr.catalog_id
    WHERE pr.applicant_id = ?
    ORDER BY pr.id DESC
  `).all(req.user.id)
  res.json({ code: 0, data: rows })
})

// 待我审批的列表
router.get('/pending', (req, res) => {
  const rows = req.db.prepare(`
    SELECT pr.*, c.app_name, c.app_code, c.icon
    FROM permission_requests pr
    LEFT JOIN app_catalog c ON c.id = pr.catalog_id
    WHERE pr.status = 'pending' AND pr.approver = ?
    ORDER BY pr.id DESC
  `).all(req.user.username)
  res.json({ code: 0, data: rows })
})

// 全部列表（admin 可见）
router.get('/', requireRole('admin', 'security', 'platform', 'owner'), (req, res) => {
  const { status, applicant } = req.query
  let sql = `
    SELECT pr.*, c.app_name, c.app_code, c.icon
    FROM permission_requests pr
    LEFT JOIN app_catalog c ON c.id = pr.catalog_id
    WHERE 1=1
  `
  const params = []
  if (status) { sql += ' AND pr.status = ?'; params.push(status) }
  if (applicant) { sql += ' AND pr.applicant = ?'; params.push(applicant) }
  sql += ' ORDER BY pr.id DESC LIMIT 200'
  const rows = req.db.prepare(sql).all(...params)
  res.json({ code: 0, data: rows })
})

// 申请权限
router.post('/', (req, res) => {
  const { catalog_id, title, reason, scope, valid_from, valid_to } = req.body
  if (!catalog_id) return res.status(400).json({ code: 400, message: '应用必填' })

  const app = req.db.prepare('SELECT * FROM app_catalog WHERE id = ?').get(catalog_id)
  if (!app) return res.status(404).json({ code: 404, message: '应用不存在' })

  // 确定审批人
  let approver = app.owner || 'owner'
  if (app.owner === 'owner') approver = 'owner'

  const req_no = genNo()
  const info = req.db.prepare(`
    INSERT INTO permission_requests (req_no, title, catalog_id, applicant_id, applicant,
      reason, scope, valid_from, valid_to, approver, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req_no,
    title || `申请访问 ${app.app_name}`,
    catalog_id,
    req.user.id,
    req.user.username,
    reason || '',
    scope || '',
    valid_from || now(),
    valid_to || null,
    approver,
    app.approval_required === 1 ? 'pending' : 'approved'
  )

  // 无需审批直接开通
  if (app.approval_required === 0) {
    req.db.prepare("UPDATE permission_requests SET opened_at = datetime('now','localtime'), status = 'approved' WHERE id = ?")
      .run(info.lastInsertRowid)
  }

  req.db.prepare('INSERT INTO audit_logs (user_id, username, action, target_type, target_id, detail) VALUES (?, ?, ?, ?, ?, ?)')
    .run(req.user.id, req.user.username, 'permission_apply', 'permission_request', info.lastInsertRowid,
      `申请 ${app.app_name} 权限，状态 ${app.approval_required === 1 ? '待审批' : '自动开通'}`)

  res.json({ code: 0, data: { id: info.lastInsertRowid, req_no, auto_approved: app.approval_required === 0 } })
})

// 审批
router.post('/:id/approve', requireRole('admin', 'owner', 'ops', 'security', 'platform'), (req, res) => {
  const pr = req.db.prepare('SELECT * FROM permission_requests WHERE id = ?').get(req.params.id)
  if (!pr) return res.status(404).json({ code: 404 })
  if (pr.status !== 'pending') return res.status(400).json({ code: 400, message: '非待审批状态' })

  // 校验：申请人不能自审，非 admin 的话审批人必须匹配
  if (pr.applicant_id === req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '申请人不能审批自己的申请' })
  }
  if (pr.approver !== req.user.username && req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '无审批权限' })
  }

  const { opinion } = req.body
  req.db.prepare(`
    UPDATE permission_requests SET status = 'approved', approval_opinion = ?, opened_at = datetime('now','localtime'),
      approver = ?, updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(opinion || '审批通过', req.user.username, req.params.id)

  req.db.prepare('INSERT INTO audit_logs (user_id, username, action, target_type, target_id, detail) VALUES (?, ?, ?, ?, ?, ?)')
    .run(req.user.id, req.user.username, 'permission_approve', 'permission_request', req.params.id, opinion || '审批通过')

  res.json({ code: 0 })
})

// 驳回
router.post('/:id/reject', requireRole('admin', 'owner', 'ops', 'security', 'platform'), (req, res) => {
  const pr = req.db.prepare('SELECT * FROM permission_requests WHERE id = ?').get(req.params.id)
  if (!pr) return res.status(404).json({ code: 404 })
  if (pr.status !== 'pending') return res.status(400).json({ code: 400, message: '非待审批状态' })

  if (pr.applicant_id === req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '申请人不能驳回自己的申请' })
  }
  if (pr.approver !== req.user.username && req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '无审批权限' })
  }

  const { opinion } = req.body
  req.db.prepare(`
    UPDATE permission_requests SET status = 'rejected', approval_opinion = ?,
      approver = ?, updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(opinion || '驳回', req.user.username, req.params.id)

  req.db.prepare('INSERT INTO audit_logs (user_id, username, action, target_type, target_id, detail) VALUES (?, ?, ?, ?, ?, ?)')
    .run(req.user.id, req.user.username, 'permission_reject', 'permission_request', req.params.id, opinion || '驳回')

  res.json({ code: 0 })
})

// 撤销
router.post('/:id/cancel', (req, res) => {
  const pr = req.db.prepare('SELECT * FROM permission_requests WHERE id = ?').get(req.params.id)
  if (!pr) return res.status(404).json({ code: 404 })
  if (pr.applicant_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '无权限撤销' })
  }
  if (!['draft', 'pending'].includes(pr.status)) {
    return res.status(400).json({ code: 400, message: '不可撤销' })
  }
  req.db.prepare("UPDATE permission_requests SET status = 'cancelled', updated_at = datetime('now','localtime') WHERE id = ?")
    .run(req.params.id)
  res.json({ code: 0 })
})

// 获取即将过期的权限（提醒）
router.get('/expiring-soon', (req, res) => {
  const rows = req.db.prepare(`
    SELECT pr.*, c.app_name, c.app_code FROM permission_requests pr
    LEFT JOIN app_catalog c ON c.id = pr.catalog_id
    WHERE pr.status = 'approved'
      AND pr.applicant_id = ?
      AND pr.valid_to IS NOT NULL
      AND date(pr.valid_to) <= date('now','localtime','+7 days')
      AND pr.expired_notified = 0
    ORDER BY pr.valid_to ASC
  `).all(req.user.id)

  // 过期自动回收
  const expired = req.db.prepare(`
    SELECT * FROM permission_requests
    WHERE status = 'approved' AND applicant_id = ?
      AND valid_to IS NOT NULL AND date(valid_to) < date('now','localtime')
  `).all(req.user.id)

  for (const e of expired) {
    req.db.prepare("UPDATE permission_requests SET status = 'expired', expired_notified = 1 WHERE id = ?").run(e.id)
    req.db.prepare('INSERT INTO audit_logs (user_id, username, action, target_type, target_id, detail) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, req.user.username, 'permission_expired', 'permission_request', e.id, `权限已过期自动回收`)
  }

  res.json({ code: 0, data: { expiring: rows, just_recycled: expired.length } })
})

module.exports = router
