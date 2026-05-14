const express = require('express')
const db = require('../database')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

function generateOrderNo() {
  const timestamp = Date.now().toString()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `ORD${timestamp}${random}`
}

router.post('/orders', authenticateToken, (req, res) => {
  const user_id = req.user.id
  const { items, shipping_address } = req.body

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: '请选择商品' })
  }

  try {
    const orderItems = []
    let total_amount = 0

    items.forEach(item => {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id)
      
      if (!product) {
        throw new Error('商品不存在')
      }

      if (product.stock < item.quantity) {
        throw new Error('库存不足')
      }

      total_amount += product.price * item.quantity
      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        price: product.price,
        spec: item.spec,
        cart_id: item.cart_id
      })
    })

    const order_no = generateOrderNo()
    
    const result = db.prepare(
      'INSERT INTO orders (user_id, order_no, status, total_amount, shipping_address) VALUES (?, ?, ?, ?, ?)'
    ).run(user_id, order_no, 'pending', total_amount, shipping_address)
    
    const order_id = result.lastInsertRowid

    orderItems.forEach(orderItem => {
      db.prepare(
        'INSERT INTO order_items (order_id, product_id, quantity, price, spec) VALUES (?, ?, ?, ?, ?)'
      ).run(order_id, orderItem.product_id, orderItem.quantity, orderItem.price, orderItem.spec)

      db.prepare(
        'UPDATE products SET stock = stock - ?, sales = sales + ? WHERE id = ?'
      ).run(orderItem.quantity, orderItem.quantity, orderItem.product_id)

      if (orderItem.cart_id) {
        db.prepare('DELETE FROM cart_items WHERE id = ?').run(orderItem.cart_id)
      }
    })

    res.json({ success: true, message: '订单创建成功', data: { order_id, order_no, total_amount } })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || '创建订单失败' })
  }
})

router.get('/orders', authenticateToken, (req, res) => {
  const user_id = req.user.id
  const { page = 1, limit = 10, status } = req.query
  const offset = (page - 1) * limit

  let query = 'SELECT * FROM orders WHERE user_id = ?'
  let params = [user_id]

  if (status) {
    query += ' AND status = ?'
    params.push(status)
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(parseInt(limit), parseInt(offset))

  try {
    const orders = db.prepare(query).all(params)
    
    const results = orders.map(order => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id)
      const productDetails = items.map(item => {
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id)
        if (product) {
          product.images = JSON.parse(product.images || '[]')
          product.specs = JSON.parse(product.specs || '[]')
        }
        return { ...item, product }
      })
      return { ...order, items: productDetails }
    })

    res.json({ success: true, data: results })
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.get('/orders/:id', authenticateToken, (req, res) => {
  const { id } = req.params
  const user_id = req.user.id

  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(id, user_id)

    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id)
    const productDetails = items.map(item => {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id)
      if (product) {
        product.images = JSON.parse(product.images || '[]')
        product.specs = JSON.parse(product.specs || '[]')
      }
      return { ...item, product }
    })

    res.json({ success: true, data: { ...order, items: productDetails } })
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.put('/orders/:id/pay', authenticateToken, (req, res) => {
  const { id } = req.params
  const user_id = req.user.id

  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(id, user_id)

    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, message: '订单状态不允许支付' })
    }

    db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('paid', id)
    res.json({ success: true, message: '支付成功', data: { order_id: id } })
  } catch (err) {
    return res.status(500).json({ success: false, message: '支付失败' })
  }
})

router.put('/orders/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params
  const { status } = req.body
  const user_id = req.user.id

  const allowedStatus = ['pending', 'paid', 'shipped', 'completed', 'cancelled']

  if (!allowedStatus.includes(status)) {
    return res.status(400).json({ success: false, message: '无效的订单状态' })
  }

  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(id, user_id)

    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }

    db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id)
    res.json({ success: true, message: '状态更新成功' })
  } catch (err) {
    return res.status(500).json({ success: false, message: '更新失败' })
  }
})

module.exports = router