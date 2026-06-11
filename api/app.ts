/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import stationRoutes from './routes/stations.js'
import orderRoutes from './routes/orders.js'
import vehicleRoutes from './routes/vehicles.js'
import routePlanRoutes from './routes/routePlan.js'
import v2gRoutes from './routes/v2g.js'
import adminRoutes from './routes/admin.js'
import communityRoutes from './routes/community.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:49134'

const app: express.Application = express()

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:49134'],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/stations', stationRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/vehicles', vehicleRoutes)
app.use('/api/route-plan', routePlanRoutes)
app.use('/api/v2g', v2gRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/community', communityRoutes)
app.use('/api/admin/community', communityRoutes)

app.get(['/api/users/profile', '/api/user/profile'], (req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      id: 'user-001',
      name: '运营管理员',
      role: 'admin',
      vehicles: 2,
      orders: 23,
      creditScore: 96,
      tags: ['高频用户', 'V2G活跃', '快充偏好'],
    },
  })
})

app.get('/api/search', (req: Request, res: Response): void => {
  const keyword = String(req.query.q || req.query.keyword || '')
  res.json({
    success: true,
    keyword,
    data: [
      { type: 'station', id: 'ST-BJ-001', name: '国网北京朝阳站', status: '可用' },
      { type: 'route', id: 'RT-BJ-SH', name: '北京到上海充电路径', status: '已规划' },
      { type: 'order', id: 'ORD20260610001', name: '可追溯充电订单', status: '充电中' },
    ].filter((item) => !keyword || item.name.includes(keyword) || item.id.includes(keyword)),
  })
})

app.get('/api/products', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: [
      { id: 'pkg-fast-60', name: '快充服务包 60kWh', price: 72, stock: 128, status: '可购买' },
      { id: 'pkg-v2g', name: 'V2G策略托管服务', price: 0, stock: 1, status: '已开通' },
    ],
  })
})

app.get('/api/cart', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: [{ id: 'cart-demo-1', name: '待提交充电订单', quantity: 1, amount: 45.6 }],
  })
})

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
