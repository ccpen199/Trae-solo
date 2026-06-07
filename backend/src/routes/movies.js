const express = require('express')
const db = require('../config/database')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

router.get('/', (req, res) => {
  const { status, keyword, page = 1, pageSize = 20 } = req.query
  let where = ['1=1']
  let params = []
  
  if (status !== undefined) {
    where.push('status = ?')
    params.push(status)
  }
  if (keyword) {
    where.push('(title LIKE ? OR original_title LIKE ?)')
    params.push(`%${keyword}%`, `%${keyword}%`)
  }
  
  const offset = (page - 1) * pageSize
  const movies = db.prepare(`SELECT * FROM movies WHERE ${where.join(' AND ')} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), offset)
  const total = db.prepare(`SELECT COUNT(*) as count FROM movies WHERE ${where.join(' AND ')}`).get(...params)
  
  res.json({ list: movies, total: total.count })
})

router.get('/:id', (req, res) => {
  const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id)
  if (!movie) return res.status(404).json({ error: '影片不存在' })
  
  movie.reviews = db.prepare(`
    SELECT r.*, u.nickname, u.avatar
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.movie_id = ? AND r.status = 1
    ORDER BY r.created_at DESC
    LIMIT 20
  `).all(req.params.id)
  
  movie.sessions = db.prepare(`
    SELECT s.*, c.name as cinema_name, c.address, h.name as hall_name
    FROM movie_sessions s
    JOIN cinemas c ON s.cinema_id = c.id
    JOIN halls h ON s.hall_id = h.id
    WHERE s.movie_id = ? AND s.status = 1 AND s.start_time > datetime('now')
    ORDER BY s.start_time
    LIMIT 50
  `).all(req.params.id)
  
  res.json(movie)
})

router.post('/:id/reviews', authMiddleware, (req, res) => {
  const { rating, content } = req.body
  db.prepare(`
    INSERT INTO reviews (movie_id, user_id, rating, content, type)
    VALUES (?, ?, ?, ?, 'ugc')
  `).run(req.params.id, req.user.id, rating, content)
  
  const avgRating = db.prepare('SELECT AVG(rating) as avg FROM reviews WHERE movie_id = ? AND status = 1').get(req.params.id)
  db.prepare('UPDATE movies SET rating = ? WHERE id = ?').run(avgRating.avg || 0, req.params.id)
  
  res.json({ success: true })
})

module.exports = router
