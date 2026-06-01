const express = require('express')
const db = require('../database/init')
const { authMiddleware, adminMiddleware } = require('../middleware/auth')

const router = express.Router()

router.get('/dashboard', authMiddleware, adminMiddleware, (req, res) => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count
  const merchantCount = db.prepare('SELECT COUNT(*) as count FROM merchants WHERE status = ?').get('approved').count
  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE status = ?').get('active').count
  const pendingMerchants = db.prepare('SELECT COUNT(*) as count FROM merchants WHERE status = ?').get('pending').count
  
  const salesByDomain = db.prepare(`
    SELECT business_domain, COUNT(*) as order_count, SUM(pay_amount) as total_sales
    FROM orders
    GROUP BY business_domain
  `).all()
  
  const recentOrders = db.prepare(`
    SELECT o.*, u.nickname as user_name, m.name as merchant_name
    FROM orders o
    JOIN users u ON o.user_id = u.id
    JOIN merchants m ON o.merchant_id = m.id
    ORDER BY o.id DESC
    LIMIT 10
  `).all()
  
  const orderStatusStats = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM orders
    GROUP BY status
  `).all()

  res.json({
    userCount,
    merchantCount,
    orderCount,
    productCount,
    pendingMerchants,
    salesByDomain,
    recentOrders,
    orderStatusStats
  })
})

router.get('/risk-rules', authMiddleware, adminMiddleware, (req, res) => {
  const rules = db.prepare('SELECT * FROM risk_rules ORDER BY id DESC').all()
  res.json(rules)
})

router.post('/risk-rules', authMiddleware, adminMiddleware, (req, res) => {
  const { name, rule_type, condition, action, status } = req.body
  
  if (!name || !rule_type || !condition || !action) {
    return res.status(400).json({ error: '请填写完整信息' })
  }

  const result = db.prepare(`
    INSERT INTO risk_rules (name, rule_type, condition, action, status)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, rule_type, condition, action, status || 'active')

  res.json({ id: result.lastInsertRowid })
})

router.post('/risk-rules/:id/status', authMiddleware, adminMiddleware, (req, res) => {
  const { status } = req.body
  
  db.prepare('UPDATE risk_rules SET status = ? WHERE id = ?').run(status, req.params.id)
  
  res.json({ message: '状态更新成功' })
})

router.get('/audit-records', authMiddleware, adminMiddleware, (req, res) => {
  const { merchant_id, page = 1, pageSize = 20 } = req.query
  const offset = (page - 1) * pageSize
  
  let query = `
    SELECT ar.*, m.name as merchant_name, u.nickname as auditor_name
    FROM audit_records ar
    JOIN merchants m ON ar.merchant_id = m.id
    LEFT JOIN users u ON ar.auditor_id = u.id
  `
  const params = []
  
  if (merchant_id) {
    query += ' WHERE ar.merchant_id = ?'
    params.push(merchant_id)
  }
  
  query += ' ORDER BY ar.id DESC LIMIT ? OFFSET ?'
  params.push(parseInt(pageSize), parseInt(offset))
  
  const records = db.prepare(query).all(...params)
  
  res.json(records)
})

router.get('/users', authMiddleware, adminMiddleware, (req, res) => {
  const { page = 1, pageSize = 20 } = req.query
  const offset = (page - 1) * pageSize
  
  const users = db.prepare('SELECT id, phone, nickname, role, credit_score, tags, created_at FROM users ORDER BY id DESC LIMIT ? OFFSET ?').all(parseInt(pageSize), parseInt(offset))
  
  const { total } = db.prepare('SELECT COUNT(*) as total FROM users').get()
  
  res.json({ list: users, total, page: parseInt(page), pageSize: parseInt(pageSize) })
})

router.post('/users/:id/tags', authMiddleware, adminMiddleware, (req, res) => {
  const { tags } = req.body
  
  db.prepare('UPDATE users SET tags = ? WHERE id = ?').run(JSON.stringify(tags || []), req.params.id)
  
  res.json({ message: '标签更新成功' })
})

module.exports = router
