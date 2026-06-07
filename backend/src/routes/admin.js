const express = require('express')
const db = require('../config/database')
const { authMiddleware, adminMiddleware, logOperation } = require('../middleware/auth')

const router = express.Router()
router.use(authMiddleware, adminMiddleware())

router.get('/dashboard', (req, res) => {
  const todayOrders = db.prepare('SELECT COUNT(*) as count, SUM(pay_amount) as amount FROM orders WHERE DATE(created_at) = DATE("now") AND pay_status = 1').get()
  const totalCinemas = db.prepare('SELECT COUNT(*) as count FROM cinemas WHERE status = 1').get()
  const totalMovies = db.prepare('SELECT COUNT(*) as count FROM movies WHERE status = 1').get()
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get()
  
  const weeklySales = db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as orders, SUM(pay_amount) as amount
    FROM orders WHERE pay_status = 1 AND created_at >= datetime('now', '-7 days')
    GROUP BY DATE(created_at) ORDER BY date
  `).all()
  
  const cinemaStats = db.prepare(`
    SELECT c.id, c.name, c.city, 
           COUNT(DISTINCT o.id) as order_count, 
           COALESCE(SUM(o.pay_amount), 0) as revenue
    FROM cinemas c
    LEFT JOIN movie_sessions s ON c.id = s.cinema_id
    LEFT JOIN orders o ON s.id = o.session_id AND o.pay_status = 1
    WHERE c.status = 1
    GROUP BY c.id
    ORDER BY revenue DESC
    LIMIT 10
  `).all()
  
  res.json({
    today_orders: todayOrders.count || 0,
    today_amount: todayOrders.amount || 0,
    total_cinemas: totalCinemas.count,
    total_movies: totalMovies.count,
    total_users: totalUsers.count,
    weekly_sales: weeklySales,
    cinema_stats: cinemaStats
  })
})

router.get('/cinemas', (req, res) => {
  const cinemas = db.prepare('SELECT * FROM cinemas ORDER BY id DESC').all()
  res.json(cinemas)
})

router.post('/cinemas', logOperation('创建影院', 'cinema'), (req, res) => {
  const { name, address, city, province, latitude, longitude, hall_count, equipment_types } = req.body
  const result = db.prepare(`
    INSERT INTO cinemas (name, address, city, province, latitude, longitude, hall_count, equipment_types)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, address, city, province, latitude, longitude, hall_count, equipment_types)
  
  res.json({ id: result.lastInsertRowid })
})

router.put('/cinemas/:id', logOperation('更新影院', 'cinema'), (req, res) => {
  const { name, address, city, province, latitude, longitude, hall_count, equipment_types, status } = req.body
  db.prepare(`
    UPDATE cinemas SET name = ?, address = ?, city = ?, province = ?, latitude = ?, longitude = ?, hall_count = ?, equipment_types = ?, status = ?
    WHERE id = ?
  `).run(name, address, city, province, latitude, longitude, hall_count, equipment_types, status, req.params.id)
  
  res.json({ success: true })
})

router.get('/movies', (req, res) => {
  const movies = db.prepare('SELECT * FROM movies ORDER BY id DESC').all()
  res.json(movies)
})

router.post('/movies', logOperation('创建影片', 'movie'), (req, res) => {
  const { title, original_title, poster, description, duration, release_date, country, language, versions, trailer_url } = req.body
  const result = db.prepare(`
    INSERT INTO movies (title, original_title, poster, description, duration, release_date, country, language, versions, trailer_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, original_title, poster, description, duration, release_date, country, language, versions, trailer_url)
  
  res.json({ id: result.lastInsertRowid })
})

router.put('/movies/:id', logOperation('更新影片', 'movie'), (req, res) => {
  const { title, original_title, poster, description, duration, release_date, country, language, versions, rating, trailer_url, status } = req.body
  db.prepare(`
    UPDATE movies SET title = ?, original_title = ?, poster = ?, description = ?, duration = ?, release_date = ?, country = ?, language = ?, versions = ?, rating = ?, trailer_url = ?, status = ?
    WHERE id = ?
  `).run(title, original_title, poster, description, duration, release_date, country, language, versions, rating, trailer_url, status, req.params.id)
  
  res.json({ success: true })
})

router.get('/sessions', (req, res) => {
  const sessions = db.prepare(`
    SELECT s.*, m.title, c.name as cinema_name, h.name as hall_name
    FROM movie_sessions s
    JOIN movies m ON s.movie_id = m.id
    JOIN cinemas c ON s.cinema_id = c.id
    JOIN halls h ON s.hall_id = h.id
    ORDER BY s.start_time DESC
    LIMIT 100
  `).all()
  res.json(sessions)
})

router.post('/sessions', logOperation('创建场次', 'session'), (req, res) => {
  const { movie_id, cinema_id, hall_id, start_time, end_time, version, language, base_price, price_strategy } = req.body
  const result = db.prepare(`
    INSERT INTO movie_sessions (movie_id, cinema_id, hall_id, start_time, end_time, version, language, base_price, price_strategy)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(movie_id, cinema_id, hall_id, start_time, end_time, version, language, base_price, price_strategy)
  
  res.json({ id: result.lastInsertRowid })
})

router.put('/sessions/:id', logOperation('更新场次', 'session'), (req, res) => {
  const { movie_id, cinema_id, hall_id, start_time, end_time, version, language, base_price, price_strategy, status } = req.body
  db.prepare(`
    UPDATE movie_sessions SET movie_id = ?, cinema_id = ?, hall_id = ?, start_time = ?, end_time = ?, version = ?, language = ?, base_price = ?, price_strategy = ?, status = ?
    WHERE id = ?
  `).run(movie_id, cinema_id, hall_id, start_time, end_time, version, language, base_price, price_strategy, status, req.params.id)
  
  res.json({ success: true })
})

router.get('/coupons', (req, res) => {
  const coupons = db.prepare('SELECT * FROM coupons ORDER BY id DESC').all()
  res.json(coupons)
})

router.post('/coupons', logOperation('创建优惠券', 'coupon'), (req, res) => {
  const { name, type, value, min_amount, valid_from, valid_to, total_count } = req.body
  const result = db.prepare(`
    INSERT INTO coupons (name, type, value, min_amount, valid_from, valid_to, total_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, type, value, min_amount, valid_from, valid_to, total_count)
  
  res.json({ id: result.lastInsertRowid })
})

router.get('/halls', (req, res) => {
  const { cinema_id } = req.query
  let sql = 'SELECT h.*, c.name as cinema_name FROM halls h JOIN cinemas c ON h.cinema_id = c.id'
  let params = []
  if (cinema_id) {
    sql += ' WHERE h.cinema_id = ?'
    params.push(cinema_id)
  }
  const halls = db.prepare(sql + ' ORDER BY h.id DESC').all(...params)
  res.json(halls)
})

router.post('/halls', logOperation('创建影厅', 'hall'), (req, res) => {
  const { cinema_id, name, seat_rows, seat_cols, seat_layout, equipment_type } = req.body
  const result = db.prepare(`
    INSERT INTO halls (cinema_id, name, seat_rows, seat_cols, seat_layout, equipment_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(cinema_id, name, seat_rows, seat_cols, seat_layout, equipment_type)
  
  res.json({ id: result.lastInsertRowid })
})

router.get('/logs', (req, res) => {
  const { page = 1, pageSize = 20 } = req.query
  const offset = (page - 1) * pageSize
  const logs = db.prepare('SELECT * FROM operation_logs ORDER BY created_at DESC LIMIT ? OFFSET ?').all(parseInt(pageSize), offset)
  const total = db.prepare('SELECT COUNT(*) as count FROM operation_logs').get()
  res.json({ list: logs, total: total.count })
})

module.exports = router
