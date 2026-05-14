const express = require('express')
const db = require('../database')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

router.get('/cart', authenticateToken, (req, res) => {
  const user_id = req.user.id

  try {
    const rows = db.prepare(
      'SELECT cart_items.*, products.* FROM cart_items LEFT JOIN products ON cart_items.product_id = products.id WHERE cart_items.user_id = ?'
    ).all(user_id)

    rows.forEach(row => {
      row.images = JSON.parse(row.images || '[]')
      row.specs = JSON.parse(row.specs || '[]')
    })

    res.json({ success: true, data: rows })
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.post('/cart', authenticateToken, (req, res) => {
  const user_id = req.user.id
  const { product_id, quantity = 1, spec } = req.body

  if (!product_id) {
    return res.status(400).json({ success: false, message: '请选择商品' })
  }

  try {
    const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(product_id)

    if (!product) {
      return res.status(404).json({ success: false, message: '商品不存在' })
    }

    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: '库存不足' })
    }

    const cartItem = db.prepare(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ? AND spec = ?'
    ).get(user_id, product_id, spec)

    if (cartItem) {
      const newQuantity = cartItem.quantity + quantity
      if (newQuantity > product.stock) {
        return res.status(400).json({ success: false, message: '库存不足' })
      }

      db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQuantity, cartItem.id)
      res.json({ success: true, message: '购物车更新成功' })
    } else {
      const result = db.prepare(
        'INSERT INTO cart_items (user_id, product_id, quantity, spec) VALUES (?, ?, ?, ?)'
      ).run(user_id, product_id, quantity, spec)
      res.json({ success: true, message: '已加入购物车', data: { id: result.lastInsertRowid } })
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.put('/cart/:id', authenticateToken, (req, res) => {
  const { id } = req.params
  const { quantity } = req.body
  const user_id = req.user.id

  if (!quantity || quantity < 1) {
    return res.status(400).json({ success: false, message: '数量必须大于0' })
  }

  try {
    const cartItem = db.prepare('SELECT * FROM cart_items WHERE id = ? AND user_id = ?').get(id, user_id)

    if (!cartItem) {
      return res.status(404).json({ success: false, message: '购物车商品不存在' })
    }

    const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(cartItem.product_id)

    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: '库存不足' })
    }

    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, id)
    res.json({ success: true, message: '数量更新成功' })
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.delete('/cart/:id', authenticateToken, (req, res) => {
  const { id } = req.params
  const user_id = req.user.id

  try {
    const cartItem = db.prepare('SELECT * FROM cart_items WHERE id = ? AND user_id = ?').get(id, user_id)

    if (!cartItem) {
      return res.status(404).json({ success: false, message: '购物车商品不存在' })
    }

    db.prepare('DELETE FROM cart_items WHERE id = ?').run(id)
    res.json({ success: true, message: '删除成功' })
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.delete('/cart', authenticateToken, (req, res) => {
  const user_id = req.user.id

  try {
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(user_id)
    res.json({ success: true, message: '清空购物车成功' })
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' })
  }
})

module.exports = router