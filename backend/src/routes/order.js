const express = require('express')
const db = require('../database/init')
const { authMiddleware, adminMiddleware } = require('../middleware/auth')

const router = express.Router()

const generateOrderNo = () => {
  const date = new Date()
  const timestamp = date.getTime().toString().slice(-8)
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `LP${timestamp}${random}`
}

router.post('/', authMiddleware, (req, res) => {
  const { merchant_id, business_domain, items, address, phone, remark, coupon_id } = req.body
  
  if (!merchant_id || !items || items.length === 0) {
    return res.status(400).json({ error: '商户和商品不能为空' })
  }

  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(merchant_id)
  if (!merchant) {
    return res.status(400).json({ error: '商户不存在' })
  }

  let totalAmount = 0
  const orderItems = []

  for (const item of items) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id)
    if (!product) {
      return res.status(400).json({ error: `商品 ${item.product_id} 不存在` })
    }
    totalAmount += product.price * item.quantity
    orderItems.push({
      product_id: item.product_id,
      product_name: product.name,
      price: product.price,
      quantity: item.quantity
    })
  }

  let discountAmount = 0
  let payAmount = totalAmount

  if (coupon_id) {
    const userCoupon = db.prepare(`
      SELECT uc.*, c.type, c.value, c.min_amount 
      FROM user_coupons uc 
      JOIN coupons c ON uc.coupon_id = c.id 
      WHERE uc.id = ? AND uc.user_id = ? AND uc.status = ?
    `).get(coupon_id, req.user.id, 'unused')

    if (userCoupon && totalAmount >= userCoupon.min_amount) {
      if (userCoupon.type === 'fixed') {
        discountAmount = userCoupon.value
      } else if (userCoupon.type === 'percent') {
        discountAmount = totalAmount * (1 - userCoupon.value / 100)
      }
      payAmount = Math.max(0, totalAmount - discountAmount)

      db.prepare('UPDATE user_coupons SET status = ?, used_at = CURRENT_TIMESTAMP WHERE id = ?').run('used', coupon_id)
    }
  }

  const orderNo = generateOrderNo()

  const result = db.prepare(`
    INSERT INTO orders (order_no, user_id, merchant_id, business_domain, total_amount, discount_amount, pay_amount, address, phone, remark, coupon_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(orderNo, req.user.id, merchant_id, business_domain || merchant.business_domain, totalAmount, discountAmount, payAmount, address, phone, remark, coupon_id, 'pending')

  const orderId = result.lastInsertRowid

  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_name, price, quantity)
    VALUES (?, ?, ?, ?, ?)
  `)

  for (const item of orderItems) {
    insertItem.run(orderId, item.product_id, item.product_name, item.price, item.quantity)
  }

  db.prepare('INSERT INTO order_status_logs (order_id, status, operator, remark) VALUES (?, ?, ?, ?)').run(
    orderId, 'pending', 'user', '订单创建'
  )

  res.json({ id: orderId, order_no: orderNo, pay_amount: payAmount })
})

router.get('/my', authMiddleware, (req, res) => {
  const { status, page = 1, pageSize = 10 } = req.query
  const offset = (page - 1) * pageSize
  
  let query = 'SELECT * FROM orders WHERE user_id = ?'
  const params = [req.user.id]
  
  if (status) {
    query += ' AND status = ?'
    params.push(status)
  }
  
  query += ' ORDER BY id DESC LIMIT ? OFFSET ?'
  params.push(parseInt(pageSize), parseInt(offset))
  
  const orders = db.prepare(query).all(...params)
  
  for (const order of orders) {
    order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id)
  }
  
  const countQuery = status ? 'SELECT COUNT(*) as total FROM orders WHERE user_id = ? AND status = ?' : 'SELECT COUNT(*) as total FROM orders WHERE user_id = ?'
  const { total } = db.prepare(countQuery).get(...(status ? [req.user.id, status] : [req.user.id]))
  
  res.json({ list: orders, total, page: parseInt(page), pageSize: parseInt(pageSize) })
})

router.get('/:id', authMiddleware, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id)
  
  if (!order) {
    return res.status(404).json({ error: '订单不存在' })
  }
  
  order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id)
  order.status_logs = db.prepare('SELECT * FROM order_status_logs WHERE order_id = ? ORDER BY id').all(order.id)
  
  res.json(order)
})

router.post('/:id/status', authMiddleware, (req, res) => {
  const { status, remark } = req.body
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  if (!order) {
    return res.status(404).json({ error: '订单不存在' })
  }

  if (order.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限操作' })
  }

  db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id)
  
  db.prepare('INSERT INTO order_status_logs (order_id, status, operator, remark) VALUES (?, ?, ?, ?)').run(
    req.params.id, status, req.user.role === 'admin' ? 'admin' : 'user', remark || ''
  )

  res.json({ message: '状态更新成功' })
})

router.post('/:id/track', authMiddleware, (req, res) => {
  const { latitude, longitude, rider_id } = req.body
  
  db.prepare('INSERT INTO rider_tracks (order_id, rider_id, latitude, longitude) VALUES (?, ?, ?, ?)').run(
    req.params.id, rider_id || req.user.id, latitude, longitude
  )

  res.json({ message: '轨迹已同步' })
})

router.get('/:id/track', authMiddleware, (req, res) => {
  const tracks = db.prepare('SELECT * FROM rider_tracks WHERE order_id = ? ORDER BY id DESC LIMIT 50').all(req.params.id)
  res.json(tracks)
})

module.exports = router
