const express = require('express')
const { authMiddleware, roleMiddleware } = require('../middleware/auth')
const db = require('../database')

const router = express.Router()

router.get('/dashboard', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count
  const totalMasters = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('master').count
  const pendingDisputes = db.prepare('SELECT COUNT(*) as count FROM dispute_cases WHERE status = ?').get('pending').count
  
  const ordersByStatus = db.prepare(`
    SELECT status, COUNT(*) as count 
    FROM orders 
    GROUP BY status
  `).all()
  
  const recentOrders = db.prepare(`
    SELECT o.*, u1.name as owner_name, u2.name as master_name
    FROM orders o
    LEFT JOIN users u1 ON o.owner_id = u1.id
    LEFT JOIN users u2 ON o.master_id = u2.id
    ORDER BY o.created_at DESC
    LIMIT 10
  `).all()
  
  res.json({
    statistics: {
      totalUsers,
      totalOrders,
      totalMasters,
      pendingDisputes
    },
    ordersByStatus,
    recentOrders
  })
})

router.get('/verifications', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { status } = req.query
  let sql = `
    SELECT mv.*, u.name, u.phone
    FROM master_verifications mv
    LEFT JOIN users u ON mv.user_id = u.id
  `
  const params = []
  
  if (status) {
    sql += ' WHERE mv.status = ?'
    params.push(status)
  }
  
  sql += ' ORDER BY mv.created_at DESC'
  
  const verifications = db.prepare(sql).all(...params)
  res.json(verifications)
})

router.post('/verifications/:id/approve', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const verification = db.prepare('SELECT * FROM master_verifications WHERE id = ?').get(req.params.id)
  
  if (!verification || verification.status !== 'pending') {
    return res.status(400).json({ message: '认证申请不存在或状态错误' })
  }
  
  db.prepare('UPDATE master_verifications SET status = ?, verified_at = CURRENT_TIMESTAMP WHERE id = ?').run('approved', req.params.id)
  
  res.json({ message: '认证已通过' })
})

router.post('/verifications/:id/reject', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const verification = db.prepare('SELECT * FROM master_verifications WHERE id = ?').get(req.params.id)
  
  if (!verification || verification.status !== 'pending') {
    return res.status(400).json({ message: '认证申请不存在或状态错误' })
  }
  
  db.prepare('UPDATE master_verifications SET status = ? WHERE id = ?').run('rejected', req.params.id)
  
  res.json({ message: '认证已拒绝' })
})

router.get('/disputes', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { status } = req.query
  let sql = `
    SELECT d.*, o.title as order_title, 
           u1.name as complainant_name, 
           u2.name as respondent_name
    FROM dispute_cases d
    LEFT JOIN orders o ON d.order_id = o.id
    LEFT JOIN users u1 ON d.complainant_id = u1.id
    LEFT JOIN users u2 ON d.respondent_id = u2.id
  `
  const params = []
  
  if (status) {
    sql += ' WHERE d.status = ?'
    params.push(status)
  }
  
  sql += ' ORDER BY d.created_at DESC'
  
  const disputes = db.prepare(sql).all(...params)
  res.json(disputes)
})

router.post('/disputes/:id/handle', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { result } = req.body
  const dispute = db.prepare('SELECT * FROM dispute_cases WHERE id = ?').get(req.params.id)
  
  if (!dispute || dispute.status !== 'pending') {
    return res.status(400).json({ message: '纠纷不存在或状态错误' })
  }
  
  db.prepare(`
    UPDATE dispute_cases 
    SET status = 'handled', result = ?, handled_by = ?, handled_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(result, req.user.id, req.params.id)
  
  res.json({ message: '纠纷已处理' })
})

router.get('/master-density', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const data = db.prepare(`
    SELECT mp.area, COUNT(*) as count, AVG(mp.rating) as avg_rating
    FROM master_profiles mp
    LEFT JOIN master_verifications mv ON mp.user_id = mv.user_id
    WHERE mv.status = 'approved' AND mp.area IS NOT NULL
    GROUP BY mp.area
    ORDER BY count DESC
  `).all()
  
  res.json(data)
})

router.get('/orders', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { status, page = 1, pageSize = 20 } = req.query
  const offset = (page - 1) * pageSize
  
  let sql = `
    SELECT o.*, u1.name as owner_name, u2.name as master_name
    FROM orders o
    LEFT JOIN users u1 ON o.owner_id = u1.id
    LEFT JOIN users u2 ON o.master_id = u2.id
  `
  const params = []
  
  if (status) {
    sql += ' WHERE o.status = ?'
    params.push(status)
  }
  
  sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?'
  params.push(parseInt(pageSize), parseInt(offset))
  
  const orders = db.prepare(sql).all(...params)
  const total = db.prepare('SELECT COUNT(*) as count FROM orders').get().count
  
  res.json({ orders, total, page: parseInt(page), pageSize: parseInt(pageSize) })
})

router.get('/masters', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const masters = db.prepare(`
    SELECT u.id, u.name, u.phone, u.status,
           mp.area, mp.rating, mp.total_orders, mp.completed_orders,
           mv.status as verification_status
    FROM users u
    LEFT JOIN master_profiles mp ON u.id = mp.user_id
    LEFT JOIN master_verifications mv ON u.id = mv.user_id
    WHERE u.role = 'master'
    ORDER BY u.created_at DESC
  `).all()
  
  res.json(masters)
})

router.get('/knowledge-graph', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const knowledge = db.prepare('SELECT * FROM knowledge_graph ORDER BY id DESC').all()
  res.json(knowledge)
})

router.post('/knowledge-graph', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { fault_type, symptoms, possible_causes, solutions, related_services } = req.body
  
  const result = db.prepare(`
    INSERT INTO knowledge_graph (fault_type, symptoms, possible_causes, solutions, related_services)
    VALUES (?, ?, ?, ?, ?)
  `).run(fault_type, symptoms, JSON.stringify(possible_causes || []), JSON.stringify(solutions || []), JSON.stringify(related_services || []))
  
  res.json({ id: result.lastInsertRowid, message: '知识条目已添加' })
})

module.exports = router
