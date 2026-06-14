const express = require('express')
const { authMiddleware, roleMiddleware } = require('../middleware/auth')
const db = require('../database')

const router = express.Router()

router.post('/orders', authMiddleware, roleMiddleware('owner'), (req, res) => {
  const { service_type, title, description, fault_images, expected_time, address, contact_name, contact_phone, budget_price } = req.body
  
  const order_no = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase()
  
  const result = db.prepare(`
    INSERT INTO orders (order_no, owner_id, service_type, title, description, fault_images, expected_time, address, contact_name, contact_phone, budget_price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(order_no, req.user.id, service_type, title, description, JSON.stringify(fault_images || []), expected_time, address, contact_name, contact_phone, budget_price)
  
  res.json({ id: result.lastInsertRowid, order_no, message: '订单创建成功' })
})

router.get('/orders', authMiddleware, roleMiddleware('owner'), (req, res) => {
  const { status } = req.query
  let sql = `
    SELECT o.*, u.name as master_name
    FROM orders o
    LEFT JOIN users u ON o.master_id = u.id
    WHERE o.owner_id = ?
  `
  const params = [req.user.id]
  
  if (status) {
    sql += ' AND o.status = ?'
    params.push(status)
  }
  
  sql += ' ORDER BY o.created_at DESC'
  
  const orders = db.prepare(sql).all(...params)
  res.json(orders)
})

router.get('/orders/:id', authMiddleware, (req, res) => {
  const order = db.prepare(`
    SELECT o.*, u1.name as owner_name, u2.name as master_name
    FROM orders o
    LEFT JOIN users u1 ON o.owner_id = u1.id
    LEFT JOIN users u2 ON o.master_id = u2.id
    WHERE o.id = ?
  `).get(req.params.id)
  
  if (!order) {
    return res.status(404).json({ message: '订单不存在' })
  }
  
  if (order.owner_id !== req.user.id && order.master_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: '无权查看此订单' })
  }
  
  const photos = db.prepare('SELECT * FROM order_photos WHERE order_id = ?').all(req.params.id)
  const negotiations = db.prepare(`
    SELECT n.*, u.name as sender_name
    FROM order_negotiations n
    LEFT JOIN users u ON n.sender_id = u.id
    WHERE n.order_id = ?
    ORDER BY n.created_at ASC
  `).all(req.params.id)
  const review = db.prepare('SELECT * FROM reviews WHERE order_id = ?').get(req.params.id)
  const acceptance = db.prepare('SELECT * FROM acceptances WHERE order_id = ?').get(req.params.id)
  
  res.json({ order, photos, negotiations, review, acceptance })
})

router.get('/available-masters', authMiddleware, roleMiddleware('owner'), (req, res) => {
  const masters = db.prepare(`
    SELECT u.id, u.name, u.phone, mp.area, mp.rating, mp.completed_orders, mv.status as verification_status
    FROM users u
    LEFT JOIN master_profiles mp ON u.id = mp.user_id
    LEFT JOIN master_verifications mv ON u.id = mv.user_id
    WHERE u.role = 'master' AND u.status = 'active' AND mv.status = 'approved'
    ORDER BY mp.rating DESC
    LIMIT 20
  `).all()
  
  res.json(masters)
})

router.post('/orders/:id/assign-master', authMiddleware, roleMiddleware('owner'), (req, res) => {
  const { master_id } = req.body
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND owner_id = ?').get(req.params.id, req.user.id)
  
  if (!order) {
    return res.status(404).json({ message: '订单不存在' })
  }
  
  if (order.status !== 'pending') {
    return res.status(400).json({ message: '订单状态不允许指派师傅' })
  }
  
  db.prepare('UPDATE orders SET master_id = ?, status = ? WHERE id = ?').run(master_id, 'negotiating', req.params.id)
  
  db.prepare(`
    INSERT INTO order_negotiations (order_id, sender_id, sender_role, price, message)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, req.user.id, 'owner', order.budget_price, '业主发起价格协商')
  
  res.json({ message: '已指派师傅，等待价格协商' })
})

router.post('/orders/:id/negotiate', authMiddleware, (req, res) => {
  const { price, message } = req.body
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  
  if (!order) {
    return res.status(404).json({ message: '订单不存在' })
  }
  
  if (order.owner_id !== req.user.id && order.master_id !== req.user.id) {
    return res.status(403).json({ message: '无权操作此订单' })
  }
  
  if (order.status !== 'negotiating') {
    return res.status(400).json({ message: '订单不在协商状态' })
  }
  
  db.prepare(`
    INSERT INTO order_negotiations (order_id, sender_id, sender_role, price, message)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, req.user.id, req.user.role, price, message || '')
  
  res.json({ message: '报价已发送' })
})

router.post('/orders/:id/accept-price', authMiddleware, roleMiddleware('owner'), (req, res) => {
  const { negotiation_id } = req.body
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND owner_id = ?').get(req.params.id, req.user.id)
  
  if (!order || order.status !== 'negotiating') {
    return res.status(400).json({ message: '订单不存在或状态错误' })
  }
  
  const negotiation = db.prepare('SELECT * FROM order_negotiations WHERE id = ? AND order_id = ?').get(negotiation_id, req.params.id)
  if (!negotiation) {
    return res.status(404).json({ message: '协商记录不存在' })
  }
  
  db.prepare('UPDATE order_negotiations SET status = ? WHERE id = ?').run('accepted', negotiation_id)
  db.prepare('UPDATE orders SET status = ?, final_price = ? WHERE id = ?').run('negotiated', negotiation.price, req.params.id)
  
  res.json({ message: '价格已确认，等待师傅接单' })
})

router.post('/orders/:id/pay-deposit', authMiddleware, roleMiddleware('owner'), (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND owner_id = ?').get(req.params.id, req.user.id)
  
  if (!order || order.status !== 'accepted') {
    return res.status(400).json({ message: '订单不存在或状态错误' })
  }
  
  const deposit = (order.final_price || order.budget_price) * 0.3
  
  db.prepare(`
    INSERT INTO payments (order_id, user_id, amount, payment_type, transaction_no)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, req.user.id, deposit, 'deposit', 'TXN' + Date.now())
  
  db.prepare('UPDATE orders SET deposit_paid = 1 WHERE id = ?').run(req.params.id)
  
  res.json({ message: '定金支付成功', amount: deposit })
})

router.post('/orders/:id/pay-balance', authMiddleware, roleMiddleware('owner'), (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND owner_id = ?').get(req.params.id, req.user.id)
  
  if (!order || order.status !== 'accepted_with_signature') {
    return res.status(400).json({ message: '订单不存在或未验收' })
  }
  
  const balance = (order.final_price || order.budget_price) * 0.7
  
  db.prepare(`
    INSERT INTO payments (order_id, user_id, amount, payment_type, transaction_no)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, req.user.id, balance, 'balance', 'TXN' + Date.now())
  
  db.prepare('UPDATE orders SET balance_paid = 1, status = ? WHERE id = ?').run('finished', req.params.id)
  
  res.json({ message: '尾款支付成功', amount: balance })
})

router.post('/orders/:id/accept', authMiddleware, roleMiddleware('owner'), (req, res) => {
  const { signature, feedback, issues } = req.body
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND owner_id = ?').get(req.params.id, req.user.id)
  
  if (!order || order.status !== 'completed') {
    return res.status(400).json({ message: '订单不存在或状态错误' })
  }
  
  db.prepare(`
    INSERT INTO acceptances (order_id, signature, feedback, issues)
    VALUES (?, ?, ?, ?)
  `).run(req.params.id, signature || '', feedback || '', JSON.stringify(issues || []))
  
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('accepted_with_signature', req.params.id)
  
  res.json({ message: '验收成功' })
})

router.post('/orders/:id/review', authMiddleware, roleMiddleware('owner'), (req, res) => {
  const { rating, content, images } = req.body
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND owner_id = ?').get(req.params.id, req.user.id)
  
  if (!order || !['accepted_with_signature', 'finished'].includes(order.status)) {
    return res.status(400).json({ message: '订单不存在或未完成' })
  }
  
  const existing = db.prepare('SELECT id FROM reviews WHERE order_id = ?').get(req.params.id)
  if (existing) {
    return res.status(400).json({ message: '已评价过此订单' })
  }
  
  db.prepare(`
    INSERT INTO reviews (order_id, owner_id, master_id, rating, content, images)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.params.id, req.user.id, order.master_id, rating, content || '', JSON.stringify(images || []))
  
  const avgRating = db.prepare('SELECT AVG(rating) as avg FROM reviews WHERE master_id = ?').get(order.master_id)
  db.prepare('UPDATE master_profiles SET rating = ? WHERE user_id = ?').run(avgRating.avg, order.master_id)
  
  res.json({ message: '评价成功' })
})

router.get('/service-standards', authMiddleware, (req, res) => {
  const standards = db.prepare('SELECT * FROM service_standards').all()
  res.json(standards)
})

router.get('/knowledge-graph', authMiddleware, (req, res) => {
  const { fault_type } = req.query
  let sql = 'SELECT * FROM knowledge_graph'
  const params = []
  
  if (fault_type) {
    sql += ' WHERE fault_type LIKE ?'
    params.push('%' + fault_type + '%')
  }
  
  const knowledge = db.prepare(sql).all(...params)
  res.json(knowledge)
})

module.exports = router
