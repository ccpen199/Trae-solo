const express = require('express')
const router = express.Router()
const db = require('../models/db')

router.get('/', (req, res) => {
  const { user_id, page = 1, limit = 10 } = req.query
  const offset = (page - 1) * limit
  
  let whereSql = user_id ? 'WHERE o.user_id = ?' : ''
  let params = user_id ? [user_id] : []
  
  const orders = db.prepare(`
    SELECT o.*, b.title as book_title, b.cover as book_cover, b.author
    FROM orders o
    JOIN books b ON o.book_id = b.id
    ${whereSql}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset)
  
  const countSql = `SELECT COUNT(*) as count FROM orders o ${whereSql}`
  const total = db.prepare(countSql).get(...params)
  
  res.json({
    data: orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: total.count
    }
  })
})

router.post('/', (req, res) => {
  const { user_id, book_id } = req.body
  
  if (!user_id || !book_id) {
    return res.status(400).json({ error: '缺少必要参数' })
  }
  
  const book = db.prepare('SELECT price FROM books WHERE id = ?').get(book_id)
  if (!book) {
    return res.status(404).json({ error: '书籍不存在' })
  }
  
  const result = db.prepare(`
    INSERT INTO orders (user_id, book_id, total_price, status)
    VALUES (?, ?, ?, 'completed')
  `).run(user_id, book_id, book.price)
  
  const order = db.prepare(`
    SELECT o.*, b.title as book_title, b.cover as book_cover
    FROM orders o
    JOIN books b ON o.book_id = b.id
    WHERE o.id = ?
  `).get(result.lastInsertRowid)
  
  res.status(201).json({ data: order })
})

module.exports = router
