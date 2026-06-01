const express = require('express')
const router = express.Router()
const db = require('../models/db')

router.get('/', (req, res) => {
  const { page = 1, limit = 10 } = req.query
  const offset = (page - 1) * limit
  
  const books = db.prepare(`
    SELECT b.*, 
           COUNT(r.id) as review_count,
           AVG(r.rating) as avg_rating
    FROM books b
    LEFT JOIN reviews r ON b.id = r.book_id
    GROUP BY b.id
    ORDER BY b.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset)
  
  const total = db.prepare('SELECT COUNT(*) as count FROM books').get()
  
  res.json({
    data: books,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: total.count
    }
  })
})

router.get('/:id', (req, res) => {
  const book = db.prepare(`
    SELECT b.*, 
           COUNT(r.id) as review_count,
           AVG(r.rating) as avg_rating
    FROM books b
    LEFT JOIN reviews r ON b.id = r.book_id
    WHERE b.id = ?
    GROUP BY b.id
  `).get(req.params.id)
  
  if (!book) {
    return res.status(404).json({ error: '书籍不存在' })
  }
  
  res.json({ data: book })
})

module.exports = router
