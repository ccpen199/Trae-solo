const express = require('express')
const db = require('../config/database')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

router.get('/profile', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, username, nickname, phone, email, avatar, role, member_level, points FROM users WHERE id = ?').get(req.user.id)
  res.json(user)
})

router.get('/orders', authMiddleware, (req, res) => {
  const { page = 1, pageSize = 10 } = req.query
  const offset = (page - 1) * pageSize
  
  const orders = db.prepare(`
    SELECT o.*, m.title, m.poster, s.start_time, c.name as cinema_name, h.name as hall_name
    FROM orders o
    JOIN movie_sessions s ON o.session_id = s.id
    JOIN movies m ON s.movie_id = m.id
    JOIN cinemas c ON s.cinema_id = c.id
    JOIN halls h ON s.hall_id = h.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.user.id, parseInt(pageSize), offset)
  
  const total = db.prepare('SELECT COUNT(*) as count FROM orders WHERE user_id = ?').get(req.user.id)
  
  res.json({ list: orders, total: total.count })
})

router.get('/coupons', authMiddleware, (req, res) => {
  const coupons = db.prepare(`
    SELECT uc.*, c.name, c.type, c.value, c.min_amount, c.valid_to
    FROM user_coupons uc
    JOIN coupons c ON uc.coupon_id = c.id
    WHERE uc.user_id = ? AND uc.status = 0
  `).all(req.user.id)
  
  res.json(coupons)
})

module.exports = router
