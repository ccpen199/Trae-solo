const express = require('express')
const router = express.Router()
const db = require('../models/db')

router.get('/', (req, res) => {
  const { book_id, user_id, page = 1, limit = 10 } = req.query
  const offset = (page - 1) * limit
  
  let whereClauses = []
  let params = []
  
  if (book_id) {
    whereClauses.push('r.book_id = ?')
    params.push(book_id)
  }
  
  if (user_id) {
    whereClauses.push('r.user_id = ?')
    params.push(user_id)
  }
  
  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''
  
  const reviews = db.prepare(`
    SELECT r.*, u.username, u.avatar, b.title as book_title
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    JOIN books b ON r.book_id = b.id
    ${whereSql}
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset)
  
  const countSql = `
    SELECT COUNT(*) as count FROM reviews r
    ${whereSql}
  `
  const total = db.prepare(countSql).get(...params)
  
  res.json({
    data: reviews,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: total.count
    }
  })
})

router.get('/:id', (req, res) => {
  const review = db.prepare(`
    SELECT r.*, u.username, u.avatar, b.title as book_title
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    JOIN books b ON r.book_id = b.id
    WHERE r.id = ?
  `).get(req.params.id)
  
  if (!review) {
    return res.status(404).json({ error: '评论不存在' })
  }
  
  const comments = db.prepare(`
    SELECT rc.*, u.username, u.avatar
    FROM review_comments rc
    JOIN users u ON rc.user_id = u.id
    WHERE rc.review_id = ?
    ORDER BY rc.created_at ASC
  `).all(req.params.id)
  
  res.json({ data: { ...review, comments } })
})

router.post('/', (req, res) => {
  const { book_id, user_id, rating, content } = req.body
  
  if (!book_id || !user_id || !rating || !content) {
    return res.status(400).json({ error: '缺少必要参数' })
  }
  
  const result = db.prepare(`
    INSERT INTO reviews (book_id, user_id, rating, content)
    VALUES (?, ?, ?, ?)
  `).run(book_id, user_id, rating, content)
  
  const review = db.prepare(`
    SELECT r.*, u.username, u.avatar
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.id = ?
  `).get(result.lastInsertRowid)
  
  res.status(201).json({ data: review })
})

router.put('/:id', (req, res) => {
  const { rating, content } = req.body
  const reviewId = req.params.id
  
  if (!rating || !content) {
    return res.status(400).json({ error: '缺少必要参数' })
  }
  
  db.prepare(`
    UPDATE reviews 
    SET rating = ?, content = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(rating, content, reviewId)
  
  const review = db.prepare(`
    SELECT r.*, u.username, u.avatar
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.id = ?
  `).get(reviewId)
  
  res.json({ data: review })
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM review_comments WHERE review_id = ?').run(req.params.id)
  db.prepare('DELETE FROM review_likes WHERE review_id = ?').run(req.params.id)
  db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id)
  
  res.json({ success: true })
})

router.post('/:id/like', (req, res) => {
  const { user_id } = req.body
  const reviewId = req.params.id
  
  try {
    db.prepare(`
      INSERT INTO review_likes (review_id, user_id)
      VALUES (?, ?)
    `).run(reviewId, user_id)
    
    db.prepare(`
      UPDATE reviews 
      SET likes_count = likes_count + 1
      WHERE id = ?
    `).run(reviewId)
    
    res.json({ success: true })
  } catch (err) {
    db.prepare(`
      DELETE FROM review_likes 
      WHERE review_id = ? AND user_id = ?
    `).run(reviewId, user_id)
    
    db.prepare(`
      UPDATE reviews 
      SET likes_count = likes_count - 1
      WHERE id = ?
    `).run(reviewId)
    
    res.json({ success: true, liked: false })
  }
})

router.post('/:id/comments', (req, res) => {
  const { user_id, content } = req.body
  const reviewId = req.params.id
  
  if (!user_id || !content) {
    return res.status(400).json({ error: '缺少必要参数' })
  }
  
  const result = db.prepare(`
    INSERT INTO review_comments (review_id, user_id, content)
    VALUES (?, ?, ?)
  `).run(reviewId, user_id, content)
  
  db.prepare(`
    UPDATE reviews 
    SET comments_count = comments_count + 1
    WHERE id = ?
  `).run(reviewId)
  
  const comment = db.prepare(`
    SELECT rc.*, u.username, u.avatar
    FROM review_comments rc
    JOIN users u ON rc.user_id = u.id
    WHERE rc.id = ?
  `).get(result.lastInsertRowid)
  
  res.status(201).json({ data: comment })
})

module.exports = router
