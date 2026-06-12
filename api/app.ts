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
import trafficRoutes from './routes/traffic.js'
import tollRoutes from './routes/toll.js'
import rechargeRoutes from './routes/recharge.js'
import outletsRoutes from './routes/outlets.js'
import settlementRoutes from './routes/settlement.js'
import obuRoutes from './routes/obu.js'
import exceptionRoutes from './routes/exception.js'
import dashboardRoutes from './routes/dashboard.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
void path.dirname(__filename)

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
app.use('/api/traffic', trafficRoutes)
app.use('/api/toll', tollRoutes)
app.use('/api/recharge', rechargeRoutes)
app.use('/api/outlets', outletsRoutes)
app.use('/api/settlement', settlementRoutes)
app.use('/api/obu', obuRoutes)
app.use('/api/exception', exceptionRoutes)
app.use('/api/dashboard', dashboardRoutes)

const profile = {
  id: 'etc-user-89176',
  username: 'admin',
  phone: '13800138000',
  role: 'admin',
  name: '粤通卡管理员',
  stats: {
    trafficRecords: 128,
    rechargeOrders: 24,
    exceptionTickets: 7,
  },
}

const serviceCatalog = [
  { id: 'etc-recharge', name: 'ETC充值服务', category: 'recharge', price: 100, inventory: 999 },
  { id: 'obu-device', name: 'OBU设备申领', category: 'obu', price: 180, inventory: 42 },
  { id: 'invoice-service', name: '通行票据服务', category: 'settlement', price: 0, inventory: 999 },
]

app.get('/api/auth/me', (_req: Request, res: Response): void => {
  res.json({ success: true, data: profile })
})

app.get('/api/users/profile', (_req: Request, res: Response): void => {
  res.json({ success: true, data: profile })
})

app.get('/api/user/profile', (_req: Request, res: Response): void => {
  res.json({ success: true, data: profile })
})

app.get('/api/search', (req: Request, res: Response): void => {
  const keyword = String(req.query.q || req.query.keyword || '').trim()
  const items = serviceCatalog.filter((item) => !keyword || `${item.name}${item.category}`.includes(keyword))
  res.json({ success: true, data: { keyword, items, total: items.length } })
})

app.get('/api/admin/dashboard', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      overview: {
        total_users: 186000,
        total_transactions: 458200,
        abnormal_events: 17,
        settlement_amount: 9325600,
      },
      operations: [
        { label: '通行记录审计', count: 128, status: '正常' },
        { label: '清分对账', count: 18, status: '待复核' },
        { label: 'OBU库存', count: 42, status: '充足' },
      ],
    },
  })
})

app.get('/api/admin/stats', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      overview: {
        total_users: 186000,
        total_tasks: 458200,
      },
      modules: ['通行管理', '充值管理', '清分结算', '异常处理'],
    },
  })
})

app.get('/api/products', (_req: Request, res: Response): void => {
  res.json({ success: true, data: serviceCatalog })
})

app.get('/api/orders', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      items: [
        { id: 'etc-order-001', product: 'ETC充值服务', status: '已完成', amount: 200 },
        { id: 'etc-order-002', product: 'OBU设备申领', status: '配送中', amount: 180 },
      ],
      total: 2,
    },
  })
})

app.get('/api/cart', (_req: Request, res: Response): void => {
  res.json({ success: true, data: { items: [], total: 0 } })
})

/**
 * health
 */
app.use(
  '/api/health',
  (_req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
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
