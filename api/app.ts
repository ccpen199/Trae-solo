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

const couponActivities = [
  { id: 'ca001', name: '2026春季惠民消费券', status: 'active', issued: 50000, verified: 38520 },
  { id: 'ca002', name: '铁西商圈地理围栏券', status: 'active', issued: 20000, verified: 12800 },
  { id: 'ca008', name: '医疗健康满减券', status: 'draft', issued: 15000, verified: 3200 },
]

const orders = [
  { id: 'od001', couponName: '2026春季惠民消费券', merchant: '中兴商厦', amount: 50, status: 'verified' },
  { id: 'od002', couponName: '满100减20餐饮券', merchant: '老边饺子馆', amount: 20, status: 'pending' },
]

app.get('/api/admin/stats', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: {
      totalIssued: 283000,
      verifyRate: 66.1,
      activeMerchants: 8,
      totalBenefit: 9348500,
      activeCoupons: couponActivities.filter((item) => item.status === 'active').length,
    },
  })
})

app.get('/api/admin/dashboard', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: {
      metrics: {
        totalIssued: 283000,
        totalVerified: 186970,
        totalBenefit: 9348500,
      },
      coupons: couponActivities,
    },
  })
})

app.get('/api/coupons', (req: Request, res: Response): void => {
  res.status(200).json({ success: true, data: couponActivities })
})

app.get('/api/products', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: couponActivities.map((item) => ({
      id: item.id,
      name: item.name,
      stock: item.issued - item.verified,
      price: 0,
    })),
  })
})

app.get('/api/orders', (req: Request, res: Response): void => {
  res.status(200).json({ success: true, data: orders })
})

app.get('/api/cart', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: [{ id: 'cart-demo', name: '待领取惠民券', quantity: 1 }],
  })
})

app.get('/api/users/profile', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: {
      id: 'citizen-demo',
      name: '惠民市民',
      walletCount: 3,
      verifiedOrders: orders.length,
    },
  })
})

app.get('/api/search', (req: Request, res: Response): void => {
  const q = String(req.query.q || '').trim()
  const data = couponActivities.filter((item) => !q || item.name.includes(q))
  res.status(200).json({ success: true, query: q, data })
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
