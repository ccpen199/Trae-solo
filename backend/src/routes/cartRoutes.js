const express = require('express')
const router = express.Router()
const { authenticate } = require('../middleware/auth')
const db = require('../models/database')

router.get('/', authenticate, async (req, res) => {
  try {
    const { userId } = req.user
    const cartItems = await db.query(`
      SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.original_price, p.image, p.stock
      FROM carts c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.updated_at DESC
    `, [userId])
    
    const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
    
    res.json({ 
      code: 200, 
      data: { 
        items: cartItems, 
        totalPrice, 
        totalCount 
      } 
    })
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

router.post('/', authenticate, async (req, res) => {
  try {
    const { userId } = req.user
    const { productId, quantity = 1 } = req.body
    
    if (!productId) {
      return res.status(400).json({ code: 400, message: '商品ID不能为空' })
    }
    
    const existingItem = await db.get(
      'SELECT * FROM carts WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    )
    
    if (existingItem) {
      await db.run(
        'UPDATE carts SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [quantity, existingItem.id]
      )
    } else {
      await db.run(
        'INSERT INTO carts (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [userId, productId, quantity]
      )
    }
    
    res.json({ code: 200, message: '添加购物车成功' })
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { userId } = req.user
    const { id } = req.params
    const { quantity } = req.body
    
    const cartItem = await db.get('SELECT * FROM carts WHERE id = ? AND user_id = ?', [id, userId])
    if (!cartItem) {
      return res.status(404).json({ code: 404, message: '购物车项不存在' })
    }
    
    if (quantity <= 0) {
      await db.run('DELETE FROM carts WHERE id = ?', [id])
      return res.json({ code: 200, message: '删除成功' })
    }
    
    await db.run('UPDATE carts SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [quantity, id])
    
    res.json({ code: 200, message: '更新成功' })
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { userId } = req.user
    const { id } = req.params
    
    const cartItem = await db.get('SELECT * FROM carts WHERE id = ? AND user_id = ?', [id, userId])
    if (!cartItem) {
      return res.status(404).json({ code: 404, message: '购物车项不存在' })
    }
    
    await db.run('DELETE FROM carts WHERE id = ?', [id])
    
    res.json({ code: 200, message: '删除成功' })
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

router.delete('/', authenticate, async (req, res) => {
  try {
    const { userId } = req.user
    await db.run('DELETE FROM carts WHERE user_id = ?', [userId])
    res.json({ code: 200, message: '清空购物车成功' })
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

module.exports = router