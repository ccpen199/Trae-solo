const express = require('express')
const db = require('../config/database')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

router.get('/:id', (req, res) => {
  const session = db.prepare(`
    SELECT s.*, m.title, m.poster, m.duration, c.name as cinema_name, c.address, h.name as hall_name, h.seat_rows, h.seat_cols, h.seat_layout
    FROM movie_sessions s
    JOIN movies m ON s.movie_id = m.id
    JOIN cinemas c ON s.cinema_id = c.id
    JOIN halls h ON s.hall_id = h.id
    WHERE s.id = ?
  `).get(req.params.id)
  
  if (!session) return res.status(404).json({ error: '场次不存在' })
  
  const now = new Date()
  db.prepare('DELETE FROM seat_locks WHERE expire_at < ? AND status = 1').run(now.toISOString())
  
  const locks = db.prepare('SELECT seat_key FROM seat_locks WHERE session_id = ? AND status = 1').all(req.params.id)
  const lockedSeats = new Set(locks.map(l => l.seat_key))
  
  const orders = db.prepare('SELECT seats FROM orders WHERE session_id = ? AND pay_status = 1').all(req.params.id)
  const soldSeats = new Set()
  orders.forEach(o => {
    JSON.parse(o.seats || '[]').forEach(s => soldSeats.add(s))
  })
  
  session.seat_state = {
    locked: Array.from(lockedSeats),
    sold: Array.from(soldSeats)
  }
  
  res.json(session)
})

router.post('/:id/lock-seats', authMiddleware, (req, res) => {
  const { seats } = req.body
  const sessionId = req.params.id
  
  const session = db.prepare('SELECT * FROM movie_sessions WHERE id = ?').get(sessionId)
  if (!session) return res.status(404).json({ error: '场次不存在' })
  
  const now = new Date()
  db.prepare('DELETE FROM seat_locks WHERE expire_at < ? AND status = 1').run(now.toISOString())
  
  const placeholders = seats.map(() => '?').join(',')
  const conflicts = db.prepare(`
    SELECT seat_key FROM seat_locks 
    WHERE session_id = ? AND seat_key IN (${placeholders}) AND status = 1
  `).all(sessionId, ...seats)
  
  if (conflicts.length > 0) {
    return res.status(400).json({ error: '部分座位已被锁定', conflict: conflicts.map(c => c.seat_key) })
  }
  
  const orderNo = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase()
  const expireAt = new Date(now.getTime() + 15 * 60 * 1000)
  
  const insert = db.prepare(`
    INSERT INTO seat_locks (session_id, seat_key, order_no, user_id, expire_at)
    VALUES (?, ?, ?, ?, ?)
  `)
  
  seats.forEach(seat => {
    insert.run(sessionId, seat, orderNo, req.user.id, expireAt.toISOString())
  })
  
  res.json({ order_no: orderNo, expire_at: expireAt.toISOString() })
})

module.exports = router
