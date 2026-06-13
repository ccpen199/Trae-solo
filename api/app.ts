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
import trackingRoutes from './routes/tracking.js'
import ordersRoutes from './routes/orders.js'
import networksRoutes from './routes/networks.js'
import estimateRoutes from './routes/estimate.js'
import alertsRoutes from './routes/alerts.js'
import knowledgeRoutes from './routes/knowledge.js'
import ticketsRoutes from './routes/tickets.js'
import profilingRoutes from './routes/profiling.js'
import addressBookRoutes from './routes/address-book.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/tracking', trackingRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/networks', networksRoutes)
app.use('/api/estimate', estimateRoutes)
app.use('/api/alerts', alertsRoutes)
app.use('/api/knowledge', knowledgeRoutes)
app.use('/api/tickets', ticketsRoutes)
app.use('/api/profiling', profilingRoutes)
app.use('/api/address-book', addressBookRoutes)

app.get(['/api/users/profile', '/api/user/profile'], (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      id: 'u1',
      phone: '138****8000',
      name: '张伟',
      role: 'user',
      membership: 'VIP',
    },
  })
})

app.get(['/api/admin/stats', '/api/admin/dashboard'], (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      overview: {
        activeAlerts: 12,
        deliveryNetworkNodes: 36,
        knowledgeItems: 128,
        profiledUsers: 8600,
      },
      modules: ['异常预警', '网点围栏', '知识库', '行为画像'],
    },
  })
})

app.get('/api/products', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: [
      { id: 'standard', name: '标准寄件服务', price: 23.5, category: 'shipping', inventory: 999 },
      { id: 'express', name: '特快寄件服务', price: 38, category: 'shipping', inventory: 999 },
      { id: 'insurance', name: '保价增值服务', price: 5, category: 'addon', inventory: 999 },
    ],
  })
})

app.get('/api/cart', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      items: [{ productId: 'standard', name: '标准寄件服务', quantity: 1, price: 23.5 }],
      total: 23.5,
    },
  })
})

app.get('/api/search', (req: Request, res: Response): void => {
  const keyword = String(req.query.q || req.query.keyword || '').trim()
  const items = [
    { type: 'waybill', title: 'YT20250602002', status: '运输中' },
    { type: 'service', title: '标准寄件服务', status: '可下单' },
    { type: 'network', title: '浦东陆家嘴营业部', status: '营业中' },
  ].filter((item) => !keyword || `${item.title}${item.status}`.includes(keyword))

  res.json({
    success: true,
    data: {
      keyword,
      items,
      total: items.length,
    },
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
