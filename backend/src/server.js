require('dotenv').config({ path: '../.env' })
const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

const initDatabase = require('./database/init')

const dataDir = path.join(__dirname, '../data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = initDatabase()
global.db = db

const app = express()
const PORT = parseInt(process.env.BACKEND_PORT) || 58991

app.use(cors({
  origin: ['http://127.0.0.1:48991', 'http://localhost:48991', 'http://127.0.0.1:49991', 'http://localhost:49991'],
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.use((req, res, next) => {
  req.db = db
  next()
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/user')
const coupleRoutes = require('./routes/couple')
const merchantRoutes = require('./routes/merchant')
const serviceRoutes = require('./routes/service')
const orderRoutes = require('./routes/order')
const guideRoutes = require('./routes/guide')
const adminRoutes = require('./routes/admin')

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/couple', coupleRoutes)
app.use('/api/merchant', merchantRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/guides', guideRoutes)
app.use('/api/admin', adminRoutes)

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: '服务器内部错误', error: err.message })
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`)
})
