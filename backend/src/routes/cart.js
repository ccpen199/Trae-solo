const express = require('express')
const router = express.Router()
const db = require('../models/db')

router.get('/', (req, res) => {
  const { user_id } = req.query
  
  if (!user_id) {
    return res.status(400).json({ error: '缺少 user_id' })
  }
  
  const cartItems = db.prepare(`
    SELECT c.*, b.title, b.cover, b.author, b.price
    FROM cart c
    JOIN books b ON c.book_id = b.id
    WHERE c.user_id = ?
    ORDER BY c.created_at DESC
  `).all(user_id)
  
  res.json({ data: cartItems })
})

router.post('/', (req, res) => {
  const { user_id, book_id } = req.body
  
  if (!user_id || !book_id) {
    return res.status(400).json({ error: '缺少必要参数' })
  }
  
  try {
    db.prepare(`
      INSERT INTO cart (user_id, book_id)
      VALUES (?, ?)
    `).run(user_id, book_id)
  } catch (err) {
    db.prepare(`
      UPDATE cart SET quantity = quantity + 1
      WHERE user_id = ? AND book_id = ?
    `).run(user_id, book_id)
  }
  
  const cartItem = db.prepare(`
    SELECT c.*, b.title, b.cover, b.author, b.price
    FROM cart c
    JOIN books b ON c.book_id = b.id
    WHERE c.user_id = ? AND c.book_id = ?
  `).get(user_id, book_id)
  
  res.status(201).json({ data: cartItem })
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM cart WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

module.exports = router
