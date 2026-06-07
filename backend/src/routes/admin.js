import express from 'express'
import db from '../utils/db.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = express.Router()

function normalizeWaybill(waybill) {
  return {
    ...waybill,
    departure_city: waybill.departure_city || waybill.start_city,
    destination_city: waybill.destination_city || waybill.end_city,
    origin: waybill.origin || waybill.start_city,
    destination: waybill.destination || waybill.end_city,
    price: waybill.price ?? waybill.agreed_price,
    amount: waybill.amount ?? waybill.agreed_price
  }
}

function normalizeUser(user) {
  const verificationMap = {
    verified: 'approved',
    pending: 'pending',
    rejected: 'rejected',
    banned: 'rejected'
  }
  return {
    ...user,
    verification_status: user.verification_status || verificationMap[user.status] || 'unverified',
    account_status: user.status === 'banned' ? 'disabled' : 'active'
  }
}

function getDashboardData() {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count
  const totalShippers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'shipper'").get().count
  const totalDrivers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'driver'").get().count
  const totalCargo = db.prepare('SELECT COUNT(*) as count FROM cargo_sources').get().count
  const totalWaybills = db.prepare('SELECT COUNT(*) as count FROM waybills').get().count
  const completedWaybills = db.prepare("SELECT COUNT(*) as count FROM waybills WHERE status = 'completed'").get().count
  const totalAmount = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type IN ('recharge', 'settlement')").get().total || 0
  const pendingAlerts = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE is_handled = 0').get().count
  const pendingVerifications = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'pending'").get().count
  
  const recentOrders = db.prepare(`
    SELECT w.*, cs.cargo_name, s.real_name as shipper_name, d.real_name as driver_name
    FROM waybills w
    LEFT JOIN cargo_sources cs ON w.cargo_id = cs.id
    LEFT JOIN users s ON w.shipper_id = s.id
    LEFT JOIN users d ON w.driver_id = d.id
    ORDER BY w.created_at DESC
    LIMIT 10
  `).all().map(normalizeWaybill)

  return {
    totalUsers, totalShippers, totalDrivers, totalCargo, totalWaybills,
    completedWaybills, totalAmount, pendingAlerts, pendingVerifications,
    total_users: totalUsers,
    total_shippers: totalShippers,
    total_drivers: totalDrivers,
    total_cargo: totalCargo,
    total_waybills: totalWaybills,
    completed_waybills: completedWaybills,
    total_amount: totalAmount,
    pending_alerts: pendingAlerts,
    pending_waybills: totalWaybills - completedWaybills,
    pending_verifications: pendingVerifications,
    recentOrders
  }
}

router.get('/stats', authenticate, requireRole('admin'), (req, res) => {
  res.json({ code: 200, data: getDashboardData() })
})

router.get('/dashboard', authenticate, requireRole('admin'), (req, res) => {
  res.json({ code: 200, data: getDashboardData() })
})

router.get('/users', authenticate, requireRole('admin'), (req, res) => {
  const { role, status, page = 1 } = req.query
  const pageSize = req.query.pageSize || req.query.page_size || 20
  const offset = (page - 1) * pageSize
  
  let query = `
    SELECT u.*, ei.company_name, di.vehicle_no, di.credit_score
    FROM users u
    LEFT JOIN enterprise_info ei ON u.id = ei.shipper_id
    LEFT JOIN driver_info di ON u.id = di.driver_id
    WHERE 1=1
  `
  let params = []
  
  if (role) {
    query += ' AND u.role = ?'
    params.push(role)
  }
  if (status) {
    query += ' AND u.status = ?'
    params.push(status === 'active' ? 'verified' : status === 'disabled' ? 'banned' : status)
  }
  
  query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?'
  params.push(parseInt(pageSize), offset)
  
  const list = db.prepare(query).all(...params).map(normalizeUser)
  
  let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1'
  let countParams = []
  if (role) {
    countQuery += ' AND role = ?'
    countParams.push(role)
  }
  if (status) {
    countQuery += ' AND status = ?'
    countParams.push(status === 'active' ? 'verified' : status === 'disabled' ? 'banned' : status)
  }
  const { total } = db.prepare(countQuery).get(...countParams)
  
  res.json({ code: 200, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } })
})

router.put('/user/:id/verify', authenticate, requireRole('admin'), (req, res) => {
  const { status, remark } = req.body
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)
  if (!user) {
    return res.status(404).json({ code: 404, message: '用户不存在' })
  }
  
  if (!['verified', 'rejected'].includes(status)) {
    return res.status(400).json({ code: 400, message: '无效的审核状态' })
  }
  
  const tx = db.transaction(() => {
    db.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id)
    
    if (user.role === 'shipper') {
      db.prepare(`
        UPDATE enterprise_info 
        SET status = ?, verified_at = CURRENT_TIMESTAMP 
        WHERE shipper_id = ?
      `).run(status, req.params.id)
    }
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, target_type, target_id, remark)
      VALUES (?, 'verify_user', 'user', ?, ?)
    `).run(req.user.id, req.params.id, remark || '')
  })
  
  try {
    tx()
    res.json({ code: 200, message: status === 'verified' ? '认证已通过' : '认证已拒绝' })
  } catch (err) {
    res.status(500).json({ code: 500, message: '审核失败' })
  }
})

router.get('/alerts', authenticate, requireRole('admin'), (req, res) => {
  const { is_handled, page = 1, pageSize = 20 } = req.query
  const offset = (page - 1) * pageSize
  
  let query = `
    SELECT a.*, w.waybill_no, cs.cargo_name, 
      s.real_name as shipper_name, d.real_name as driver_name
    FROM alerts a
    LEFT JOIN waybills w ON a.waybill_id = w.id
    LEFT JOIN cargo_sources cs ON w.cargo_id = cs.id
    LEFT JOIN users s ON w.shipper_id = s.id
    LEFT JOIN users d ON w.driver_id = d.id
    WHERE 1=1
  `
  let params = []
  
  if (is_handled !== undefined) {
    query += ' AND a.is_handled = ?'
    params.push(is_handled === 'true' ? 1 : 0)
  }
  
  query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?'
  params.push(parseInt(pageSize), offset)
  
  const list = db.prepare(query).all(...params)
  
  let countQuery = 'SELECT COUNT(*) as total FROM alerts WHERE 1=1'
  let countParams = []
  if (is_handled !== undefined) {
    countQuery += ' AND is_handled = ?'
    countParams.push(is_handled === 'true' ? 1 : 0)
  }
  const { total } = db.prepare(countQuery).get(...countParams)
  
  res.json({ code: 200, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } })
})

router.put('/alert/:id/handle', authenticate, requireRole('admin'), (req, res) => {
  const { handled_note } = req.body
  
  db.prepare(`
    UPDATE alerts 
    SET is_handled = 1, handled_by = ?, handled_at = CURRENT_TIMESTAMP, handled_note = ?
    WHERE id = ?
  `).run(req.user.id, handled_note || '', req.params.id)
  
  res.json({ code: 200, message: '预警已处理' })
})

router.get('/waybills', authenticate, requireRole('admin'), (req, res) => {
  const { status, page = 1 } = req.query
  const pageSize = req.query.pageSize || req.query.page_size || 20
  const offset = (page - 1) * pageSize
  
  let query = `
    SELECT w.*, cs.cargo_name, cs.start_city, cs.end_city,
      s.real_name as shipper_name, d.real_name as driver_name, di.vehicle_no
    FROM waybills w
    LEFT JOIN cargo_sources cs ON w.cargo_id = cs.id
    LEFT JOIN users s ON w.shipper_id = s.id
    LEFT JOIN users d ON w.driver_id = d.id
    LEFT JOIN driver_info di ON w.driver_id = di.driver_id
    WHERE 1=1
  `
  let params = []
  
  if (status) {
    query += ' AND w.status = ?'
    params.push(status === 'pending_loading' ? 'created' : status)
  }
  
  query += ' ORDER BY w.created_at DESC LIMIT ? OFFSET ?'
  params.push(parseInt(pageSize), offset)
  
  const list = db.prepare(query).all(...params).map(normalizeWaybill)
  
  let countQuery = 'SELECT COUNT(*) as total FROM waybills WHERE 1=1'
  let countParams = []
  if (status) {
    countQuery += ' AND status = ?'
    countParams.push(status === 'pending_loading' ? 'created' : status)
  }
  const { total } = db.prepare(countQuery).get(...countParams)
  
  res.json({ code: 200, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } })
})

router.get('/insurance-policies', authenticate, (req, res) => {
  const list = db.prepare(`
    SELECT ip.*, w.waybill_no, cs.cargo_name,
      s.real_name as shipper_name, d.real_name as driver_name
    FROM insurance_policies ip
    LEFT JOIN waybills w ON ip.waybill_id = w.id
    LEFT JOIN cargo_sources cs ON w.cargo_id = cs.id
    LEFT JOIN users s ON w.shipper_id = s.id
    LEFT JOIN users d ON w.driver_id = d.id
    WHERE 1=1
  `).all()
  
  res.json({ code: 200, data: list })
})

router.get('/audit-logs', authenticate, requireRole('admin'), (req, res) => {
  const { page = 1, pageSize = 20 } = req.query
  const offset = (page - 1) * pageSize
  
  const list = db.prepare(`
    SELECT al.*, u.username, u.real_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT ? OFFSET ?
  `).all(parseInt(pageSize), offset)
  
  const { total } = db.prepare('SELECT COUNT(*) as total FROM audit_logs').get()
  
  res.json({ code: 200, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } })
})

export default router
