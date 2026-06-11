const express = require('express')
const cors = require('cors')
require('dotenv').config()

const { errorHandler, notFoundHandler } = require('./middleware/error')

const authRoutes = require('./routes/auth')
const ownerRoutes = require('./routes/owner')
const stationRoutes = require('./routes/station')
const platformRoutes = require('./routes/platform')

const app = express()
const PORT = parseInt(process.env.BACKEND_PORT) || 59089
const HOST = process.env.HOST || '127.0.0.1'

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:49089'

app.use(cors({
  origin: [FRONTEND_URL, 'http://127.0.0.1:49089', 'http://localhost:49089'],
  credentials: true,
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

app.use('/api/auth', authRoutes)
app.use('/api/owner', ownerRoutes)
app.use('/api/station', stationRoutes)
app.use('/api/platform', platformRoutes)

app.get('/api/health', async (req, res) => {
  res.json({
    code: 200,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'charging-platform-backend',
    version: '1.0.0',
  })
})

app.use(notFoundHandler)
app.use(errorHandler)

const server = app.listen(PORT, HOST, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  新能源汽车充电基础设施智能运营平台 - 后端服务             ║
╠════════════════════════════════════════════════════════════╣
║  服务地址: http://${HOST}:${PORT}                           ║
║  健康检查: http://${HOST}:${PORT}/api/health                ║
║  前端地址: ${FRONTEND_URL}                                 ║
║  数据库: SQLite (data/app.sqlite)                         ║
╚════════════════════════════════════════════════════════════╝
  `)
})

process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务...')
  server.close(() => {
    console.log('服务已关闭')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务...')
  server.close(() => {
    console.log('服务已关闭')
    process.exit(0)
  })
})

module.exports = app
