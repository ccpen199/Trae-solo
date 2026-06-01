const express = require('express')
const router = express.Router()
const db = require('../models/db')

router.get('/', (req, res) => {
  const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all()
  res.json({ data: users })
})

router.get('/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)
  
  if (!user) {
    return res.status(404).json({ error: '用户不存在' })
  }
  
  res.json({ data: user })
})

router.get('/:id/reviews', (req, res) => {
  const { page = 1, limit = 10 } = req.query
  const offset = (page - 1) * limit
  
  const reviews = db.prepare(`
    SELECT r.*, b.title as book_title, b.cover as book_cover
    FROM reviews r
    JOIN books b ON r.book_id = b.id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.params.id, limit, offset)
  
  const total = db.prepare('SELECT COUNT(*) as count FROM reviews WHERE user_id = ?').get(req.params.id)
  
  res.json({
    data: reviews,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: total.count
    }
  })
})

module.exports = router
