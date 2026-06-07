const express = require('express')
const db = require('../config/database')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

router.get('/', (req, res) => {
  const { city, lat, lng, keyword, page = 1, pageSize = 20 } = req.query
  let where = ['status = 1']
  let params = []
  
  if (city) {
    where.push('city = ?')
    params.push(city)
  }
  if (keyword) {
    where.push('(name LIKE ? OR address LIKE ?)')
    params.push(`%${keyword}%`, `%${keyword}%`)
  }
  
  let orderBy = 'id DESC'
  if (lat && lng) {
    orderBy = `(latitude - ${lat}) * (latitude - ${lat}) + (longitude - ${lng}) * (longitude - ${lng}) ASC`
  }
  
  const offset = (page - 1) * pageSize
  const cinemas = db.prepare(`SELECT * FROM cinemas WHERE ${where.join(' AND ')} ORDER BY ${orderBy} LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), offset)
  const total = db.prepare(`SELECT COUNT(*) as count FROM cinemas WHERE ${where.join(' AND ')}`).get(...params)
  
  cinemas.forEach(cinema => {
    cinema.halls = db.prepare('SELECT * FROM halls WHERE cinema_id = ?').all(cinema.id)
  })
  
  res.json({ list: cinemas, total: total.count })
})

router.get('/:id', (req, res) => {
  const cinema = db.prepare('SELECT * FROM cinemas WHERE id = ?').get(req.params.id)
  if (!cinema) return res.status(404).json({ error: '影院不存在' })
  
  cinema.halls = db.prepare('SELECT * FROM halls WHERE cinema_id = ?').all(cinema.id)
  res.json(cinema)
})

router.get('/:id/sessions', (req, res) => {
  const { date } = req.query
  let where = ['s.cinema_id = ?', 's.status = 1']
  let params = [req.params.id]
  
  if (date) {
    where.push('DATE(s.start_time) = ?')
    params.push(date)
  }
  
  const sessions = db.prepare(`
    SELECT s.*, m.title, m.poster, m.duration, h.name as hall_name
    FROM movie_sessions s
    JOIN movies m ON s.movie_id = m.id
    JOIN halls h ON s.hall_id = h.id
    WHERE ${where.join(' AND ')}
    ORDER BY s.start_time
  `).all(...params)
  
  res.json(sessions)
})

module.exports = router
