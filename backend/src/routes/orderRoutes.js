const express = require('express')
const router = express.Router()
const { authenticate } = require('../middleware/auth')
const db = require('../models/database')

router.get('/', authenticate, async (req, res) => {
  try {
    const { userId } = req.user
    const { status, page = 1, limit = 10 } = req.query
    
    let sql = 'SELECT * FROM orders WHERE user_id = ?'
    let params = [userId]
    
    if (status && status !== 'all') {
      sql += ' AND status = ?'
      params.push(status)
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(limit), (page - 1) * limit)
    
    const orders = await db.query(sql, params)
    
    for (const order of orders) {
      const items = await db.query(`
        SELECT oi.product_id, oi.quantity, oi.price, p.name, p.image
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id])
      order.items = items
    }
    
    res.json({ code: 200, data: orders })
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { userId } = req.user
    const { id } = req.params
    
    const order = await db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [id, userId])
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在' })
    }
    
    const items = await db.query(`
      SELECT oi.product_id, oi.quantity, oi.price, p.name, p.image
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [order.id])
    order.items = items
    
    res.json({ code: 200, data: order })
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

router.post('/', authenticate, async (req, res) => {
  try {
    const { userId } = req.user
    const { addressId, items } = req.body
    
    if (!items || items.length === 0) {
      return res.status(400).json({ code: 400, message: '订单商品不能为空' })
    }
    
    const orderNo = 'HM' + Date.now() + Math.random().toString(36).slice(2, 6).toUpperCase()
    
    let totalAmount = 0
    for (const item of items) {
      const product = await db.get('SELECT * FROM products WHERE id = ?', [item.productId])
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({ code: 400, message: `商品库存不足: ${product?.name || '未知'}` })
      }
      totalAmount += product.price * item.quantity
    }
    
    const orderResult = await db.run(
      'INSERT INTO orders (user_id, order_no, total_amount, address_id) VALUES (?, ?, ?, ?)',
      [userId, orderNo, totalAmount, addressId]
    )
    
    for (const item of items) {
      const product = await db.get('SELECT * FROM products WHERE id = ?', [item.productId])
      await db.run(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderResult.lastID, item.productId, item.quantity, product.price]
      )
      await db.run('UPDATE products SET stock = stock - ?, sales = sales + ? WHERE id = ?', [item.quantity, item.quantity, item.productId])
    }
    
    await db.run('DELETE FROM carts WHERE user_id = ?', [userId])
    
    res.json({ code: 200, message: '下单成功', data: { orderId: orderResult.lastID, orderNo } })
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { userId } = req.user
    const { id } = req.params
    const { status } = req.body
    
    const order = await db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [id, userId])
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在' })
    }
    
    await db.run('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id])
    
    res.json({ code: 200, message: '订单状态更新成功' })
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

module.exports = router