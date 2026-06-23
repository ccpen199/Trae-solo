import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { initDatabase } from './db/index.js'
import authRoutes from './routes/auth.js'
import waybillRoutes from './routes/waybill.js'
import exceptionRoutes from './routes/exception.js'
import userRoutes from './routes/user.js'
import auditRoutes from './routes/audit.js'
import orderRoutes from './routes/order.js'
import statisticsRoutes from './routes/statistics.js'

dotenv.config()

const PORT = Number(process.env.PORT) || 3001

const app: express.Application = express()

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

app.get('/api/health', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/waybill', waybillRoutes)
app.use('/api/exceptions', exceptionRoutes)
app.use('/api/users', userRoutes)
app.use('/api/audit', auditRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/statistics', statisticsRoutes)

app.use((error: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('[Server Error]', error)
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
  })
})

app.use((req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'API 路由不存在',
  })
})

initDatabase()

const server = app.listen(PORT, () => {
  console.log(`[Server] 邮政业实名寄递监管平台 API 服务已启动`)
  console.log(`[Server] 监听端口: ${PORT}`)
  console.log(`[Server] 健康检查: http://localhost:${PORT}/api/health`)
})

process.on('SIGTERM', () => {
  console.log('[Server] 收到 SIGTERM 信号，正在关闭服务...')
  server.close(() => {
    console.log('[Server] 服务已关闭')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('[Server] 收到 SIGINT 信号，正在关闭服务...')
  server.close(() => {
    console.log('[Server] 服务已关闭')
    process.exit(0)
  })
})

export default app
