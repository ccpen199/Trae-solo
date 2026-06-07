const express = require('express')
const { authMiddleware, roleMiddleware } = require('../middleware/auth')
const router = express.Router()

function generateOrderNo() {
  const date = new Date()
  const timestamp = date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `WD${timestamp}${random}`
}

router.get('/', authMiddleware, (req, res) => {
  const db = req.db
  const { status } = req.query
  let orders = []
  
  if (req.user.role === 'couple') {
    const couple = db.prepare('SELECT id FROM couples WHERE user_id = ?').get(req.user.id)
    if (!couple) return res.json([])
    
    let sql = `
      SELECT o.*, m.company_name, m.address
      FROM orders o
      JOIN merchants m ON o.merchant_id = m.id
      WHERE o.couple_id = ?
    `
    const params = [couple.id]
    
    if (status) {
      sql += ' AND o.status = ?'
      params.push(status)
    }
    
    sql += ' ORDER BY o.created_at DESC'
    orders = db.prepare(sql).all(...params)
  } else if (req.user.role === 'merchant') {
    const merchant = db.prepare('SELECT id FROM merchants WHERE user_id = ?').get(req.user.id)
    if (!merchant) return res.json([])
    
    let sql = `
      SELECT o.*, u.name as couple_name
      FROM orders o
      JOIN couples c ON o.couple_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE o.merchant_id = ?
    `
    const params = [merchant.id]
    
    if (status) {
      sql += ' AND o.status = ?'
      params.push(status)
    }
    
    sql += ' ORDER BY o.created_at DESC'
    orders = db.prepare(sql).all(...params)
  }
  
  res.json(orders)
})

router.get('/:id', authMiddleware, (req, res) => {
  const db = req.db
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  
  if (!order) {
    return res.status(404).json({ message: '订单不存在' })
  }
  
  const timeline = db.prepare('SELECT * FROM order_timeline WHERE order_id = ? ORDER BY created_at').all(req.params.id)
  order.timeline = timeline
  
  res.json(order)
})

router.post('/', authMiddleware, roleMiddleware('couple'), (req, res) => {
  const db = req.db
  const couple = db.prepare('SELECT id FROM couples WHERE user_id = ?').get(req.user.id)
  
  if (!couple) {
    return res.status(400).json({ message: '新人信息不存在' })
  }
  
  const { merchant_id, service_id, service_name, service_type, total_amount, deposit_amount, order_date } = req.body
  const order_no = generateOrderNo()
  
  const result = db.prepare(`
    INSERT INTO orders (order_no, couple_id, merchant_id, service_id, service_name, service_type,
                        total_amount, deposit_amount, order_date, status, deposit_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')
  `).run(order_no, couple.id, merchant_id, service_id, service_name, service_type,
         total_amount, deposit_amount, order_date)
  
  db.prepare(`
    INSERT INTO order_timeline (order_id, status, remark, operator)
    VALUES (?, 'pending', '订单已创建，等待确认', 'system')
  `).run(result.lastInsertRowid)
  
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, content, related_id)
    SELECT u.id, 'order', '新订单', '您有一个新订单待处理', ?
    FROM merchants m
    JOIN users u ON m.user_id = u.id
    WHERE m.id = ?
  `).run(result.lastInsertRowid, merchant_id)
  
  res.json({ id: result.lastInsertRowid, order_no, message: '订单创建成功' })
})

router.put('/:id/confirm', authMiddleware, (req, res) => {
  const db = req.db
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  
  if (!order) {
    return res.status(404).json({ message: '订单不存在' })
  }
  
  if (req.user.role === 'couple') {
    const couple = db.prepare('SELECT id FROM couples WHERE user_id = ?').get(req.user.id)
    if (order.couple_id !== couple.id) {
      return res.status(403).json({ message: '无权操作此订单' })
    }
  } else if (req.user.role === 'merchant') {
    const merchant = db.prepare('SELECT id FROM merchants WHERE user_id = ?').get(req.user.id)
    if (order.merchant_id !== merchant.id) {
      return res.status(403).json({ message: '无权操作此订单' })
    }
  }
  
  db.prepare(`
    UPDATE orders SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id)
  
  db.prepare(`
    INSERT INTO order_timeline (order_id, status, remark, operator)
    VALUES (?, 'confirmed', '订单已确认', ?)
  `).run(req.params.id, req.user.role)
  
  res.json({ message: '订单已确认' })
})

router.put('/:id/visit', authMiddleware, roleMiddleware('merchant'), (req, res) => {
  const db = req.db
  const merchant = db.prepare('SELECT id FROM merchants WHERE user_id = ?').get(req.user.id)
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  
  if (!order || order.merchant_id !== merchant.id) {
    return res.status(403).json({ message: '无权操作此订单' })
  }
  
  db.prepare(`
    UPDATE orders SET status = 'visited', visited_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id)
  
  db.prepare(`
    INSERT INTO order_timeline (order_id, status, remark, operator)
    VALUES (?, 'visited', '客户已到店', 'merchant')
  `).run(req.params.id)
  
  res.json({ message: '已标记到店' })
})

router.put('/:id/deliver', authMiddleware, roleMiddleware('merchant'), (req, res) => {
  const db = req.db
  const merchant = db.prepare('SELECT id FROM merchants WHERE user_id = ?').get(req.user.id)
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  
  if (!order || order.merchant_id !== merchant.id) {
    return res.status(403).json({ message: '无权操作此订单' })
  }
  
  db.prepare(`
    UPDATE orders SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id)
  
  db.prepare(`
    INSERT INTO order_timeline (order_id, status, remark, operator)
    VALUES (?, 'delivered', '服务已交付', 'merchant')
  `).run(req.params.id)
  
  res.json({ message: '已标记交付' })
})

router.put('/:id/review', authMiddleware, roleMiddleware('couple'), (req, res) => {
  const db = req.db
  const couple = db.prepare('SELECT id FROM couples WHERE user_id = ?').get(req.user.id)
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  
  if (!order || order.couple_id !== couple.id) {
    return res.status(403).json({ message: '无权操作此订单' })
  }
  
  const { rating, content, images } = req.body
  const is_negative = rating <= 2 ? 1 : 0
  
  db.prepare(`
    INSERT INTO reviews (order_id, couple_id, merchant_id, rating, content, images, is_negative, reply_sla_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, 24)
  `).run(req.params.id, couple.id, order.merchant_id, rating, content, JSON.stringify(images || []), is_negative)
  
  db.prepare(`
    UPDATE orders SET status = 'reviewed', reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id)
  
  db.prepare(`
    INSERT INTO order_timeline (order_id, status, remark, operator)
    VALUES (?, 'reviewed', '客户已评价', 'couple')
  `).run(req.params.id)
  
  const avgRating = db.prepare(`
    SELECT AVG(rating) as avg_rating, COUNT(*) as count
    FROM reviews WHERE merchant_id = ?
  `).get(order.merchant_id)
  
  db.prepare(`
    UPDATE merchants SET rating = ?, review_count = ? WHERE id = ?
  `).run(avgRating.avg_rating, avgRating.count, order.merchant_id)
  
  res.json({ message: '评价成功' })
})

router.put('/:id/cancel', authMiddleware, (req, res) => {
  const db = req.db
  const { reason } = req.body
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  
  if (!order) {
    return res.status(404).json({ message: '订单不存在' })
  }
  
  let penalty_amount = 0
  const daysDiff = Math.ceil((new Date(order.order_date) - new Date()) / (1000 * 60 * 60 * 24))
  
  if (daysDiff < 7) penalty_amount = order.total_amount * 0.5
  else if (daysDiff < 14) penalty_amount = order.total_amount * 0.3
  else if (daysDiff < 30) penalty_amount = order.total_amount * 0.1
  
  db.prepare(`
    UPDATE orders SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP,
                      cancel_reason = ?, penalty_amount = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(reason, penalty_amount, req.params.id)
  
  db.prepare(`
    INSERT INTO order_timeline (order_id, status, remark, operator)
    VALUES (?, 'cancelled', ?, ?)
  `).run(req.params.id, `订单已取消，原因：${reason}`, req.user.role)
  
  res.json({ message: '订单已取消', penalty_amount })
})

router.put('/:id/contract', authMiddleware, (req, res) => {
  const db = req.db
  const { signature, signature_type } = req.body
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  
  if (!order) {
    return res.status(404).json({ message: '订单不存在' })
  }
  
  if (signature_type === 'couple') {
    const couple = db.prepare('SELECT id FROM couples WHERE user_id = ?').get(req.user.id)
    if (order.couple_id !== couple.id) {
      return res.status(403).json({ message: '无权操作' })
    }
    db.prepare('UPDATE orders SET contract_signature_couple = ? WHERE id = ?').run(signature, req.params.id)
  } else if (signature_type === 'merchant') {
    const merchant = db.prepare('SELECT id FROM merchants WHERE user_id = ?').get(req.user.id)
    if (order.merchant_id !== merchant.id) {
      return res.status(403).json({ message: '无权操作' })
    }
    db.prepare('UPDATE orders SET contract_signature_merchant = ? WHERE id = ?').run(signature, req.params.id)
  }
  
  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  if (updated.contract_signature_couple && updated.contract_signature_merchant) {
    db.prepare(`
      UPDATE orders SET contract_signed = 1, contract_signed_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(req.params.id)
  }
  
  res.json({ message: '签章成功' })
})

module.exports = router
