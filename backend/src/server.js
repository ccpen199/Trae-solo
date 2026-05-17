require('dotenv').config({ path: '../../.env' })

const express = require('express')
const cors = require('cors')
const morgan = require('morgan')

require('./database')

const { responseMiddleware, errorHandler } = require('./middleware/response')
const authRoutes = require('./routes/auth')
const courseRoutes = require('./routes/course')
const workoutRoutes = require('./routes/workout')
const searchRoutes = require('./routes/search')

const app = express()
const PORT = process.env.BACKEND_PORT || 48252

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

app.use(responseMiddleware)

app.use('/api/auth', authRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/workouts', workoutRoutes)
app.use('/api/search', searchRoutes)

app.get('/api/health', (req, res) => {
  res.success({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
  console.log(`API 地址: http://localhost:${PORT}/api`)
})
