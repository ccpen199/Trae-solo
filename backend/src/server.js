const path = require('path')

require('dotenv').config({
  path: path.resolve(__dirname, '..', '..', '.env'),
  override: true
})
const express = require('express')
const cors = require('cors')

const app = express()
const PORT = parseInt(process.env.BACKEND_PORT || '58944')
const db = require('./config/database')

app.use(cors({
  origin: [`http://127.0.0.1:${process.env.FRONTEND_PORT || 48944}`],
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'healthy',
    port: PORT,
    counts: {
      movies: db.prepare('SELECT COUNT(*) AS count FROM movies').get().count,
      cinemas: db.prepare('SELECT COUNT(*) AS count FROM cinemas WHERE status = 1').get().count,
      showtimes: db.prepare('SELECT COUNT(*) AS count FROM movie_sessions WHERE status = 1').get().count
    }
  })
})

app.get('/api/showtimes', (req, res) => {
  const { cinema_id, movie_id, date } = req.query
  const where = ['s.status = 1']
  const params = []

  if (cinema_id) {
    where.push('s.cinema_id = ?')
    params.push(cinema_id)
  }
  if (movie_id) {
    where.push('s.movie_id = ?')
    params.push(movie_id)
  }
  if (date) {
    where.push('DATE(s.start_time) = ?')
    params.push(date)
  }

  const list = db.prepare(`
    SELECT
      s.id,
      s.movie_id,
      s.cinema_id,
      s.hall_id,
      s.start_time,
      s.end_time,
      s.version,
      s.language,
      s.base_price,
      s.status,
      m.title AS movie_title,
      m.title,
      m.poster AS movie_poster,
      c.name AS cinema_name,
      c.city,
      h.name AS hall_name
    FROM movie_sessions s
    JOIN movies m ON s.movie_id = m.id
    JOIN cinemas c ON s.cinema_id = c.id
    JOIN halls h ON s.hall_id = h.id
    WHERE ${where.join(' AND ')}
    ORDER BY s.start_time
    LIMIT 100
  `).all(...params)

  res.json({ list, total: list.length })
})

const cinemaRoutes = require('./routes/cinemas')
const movieRoutes = require('./routes/movies')
const sessionRoutes = require('./routes/sessions')
const userRoutes = require('./routes/users')
const orderRoutes = require('./routes/orders')
const benefitRoutes = require('./routes/benefits')
const adminRoutes = require('./routes/admin')
const authRoutes = require('./routes/auth')

app.use('/api/cinemas', cinemaRoutes)
app.use('/api/movies', movieRoutes)
app.use('/api/sessions', sessionRoutes)
app.use('/api/users', userRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/benefits', benefitRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/auth', authRoutes)

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`)
})
