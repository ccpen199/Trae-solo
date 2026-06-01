require('dotenv').config({ path: '../.env' })
const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

const PORT = parseInt(process.env.BACKEND_PORT) || 53442
const HOST = '127.0.0.1'
const PROJECT_DIR = __dirname

const app = express()

app.use(cors({
  origin: [`http://127.0.0.1:${process.env.FRONTEND_PORT || 43442}`],
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}
app.use('/uploads', express.static(uploadsDir))

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: PORT
  })
})

const earthquakeRoutes = require('./routes/earthquakes')
const disasterRoutes = require('./routes/disasters')
const rescueRoutes = require('./routes/rescue')
const materialRoutes = require('./routes/materials')
const reportRoutes = require('./routes/reports')

app.use('/api/earthquakes', earthquakeRoutes)
app.use('/api/disasters', disasterRoutes)
app.use('/api/rescue', rescueRoutes)
app.use('/api/materials', materialRoutes)
app.use('/api/reports', reportRoutes)

app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR'
  })
})

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 后端服务已启动: http://${HOST}:${PORT}`)
  console.log(`📁 项目目录: ${PROJECT_DIR}`)
})

process.on('SIGTERM', () => {
  console.log('收到 SIGTERM，正在关闭服务...')
  server.close(() => {
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('收到 SIGINT，正在关闭服务...')
  server.close(() => {
    process.exit(0)
  })
})
