import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import './database.js'
import db from './database.js'
import authRoutes from './routes/auth.js'
import ridersRoutes from './routes/riders.js'
import ordersRoutes from './routes/orders.js'
import merchantsRoutes from './routes/merchants.js'
import zonesRoutes from './routes/zones.js'
import alertsRoutes from './routes/alerts.js'
import settlementRoutes from './routes/settlement.js'
import dashboardRoutes from './routes/dashboard.js'
import riskRoutes from './routes/risk.js'
import trajectoriesRoutes from './routes/trajectories.js'
import verifyLogsRoutes from './routes/verifyLogs.js'

dotenv.config()

const app: express.Application = express()

app.use(cors({
  origin: 'http://127.0.0.1:49038',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

function countValue(sql: string): number {
  return (db.prepare(sql).get() as { count: number }).count
}

function demoUserPayload() {
  const rider = db
    .prepare('SELECT id, name, phone, credit_score, status, created_at FROM riders ORDER BY id LIMIT 1')
    .get() as any

  return {
    id: rider?.id || 1,
    username: rider?.name || 'dispatch_admin',
    name: rider?.name || '调度管理员',
    role: 'admin',
    phone: rider?.phone || '',
    credit_score: rider?.credit_score || 100,
    status: rider?.status || 'online',
    created_at: rider?.created_at || new Date().toISOString(),
  }
}

app.get('/api/auth/me', (_req: Request, res: Response): void => {
  res.json({ success: true, data: demoUserPayload(), message: '即时配送平台演示账号资料' })
})

app.get(['/api/users/profile', '/api/user/profile'], (_req: Request, res: Response): void => {
  res.json({ success: true, data: demoUserPayload(), message: '即时配送平台个人中心资料' })
})

app.get('/api/search', (req: Request, res: Response): void => {
  const keyword = String(req.query.q || req.query.keyword || '').trim()
  const like = `%${keyword}%`
  const orders = db
    .prepare(
      `SELECT o.id, o.order_no, o.type, o.status, o.pickup_address, o.delivery_address,
              m.name as merchant_name, r.name as rider_name
       FROM orders o
       LEFT JOIN merchants m ON o.merchant_id = m.id
       LEFT JOIN riders r ON o.rider_id = r.id
       WHERE ? = '' OR o.order_no LIKE ? OR o.pickup_address LIKE ? OR o.delivery_address LIKE ?
          OR m.name LIKE ? OR r.name LIKE ?
       ORDER BY o.id DESC LIMIT 20`,
    )
    .all(keyword, like, like, like, like, like)
  const riders = db
    .prepare(
      `SELECT id, name, phone, status, verify_status, vehicle_type, plate_number
       FROM riders
       WHERE ? = '' OR name LIKE ? OR phone LIKE ? OR plate_number LIKE ?
       ORDER BY id DESC LIMIT 20`,
    )
    .all(keyword, like, like, like)
  res.json({ success: true, data: { keyword, orders, riders, total: orders.length + riders.length } })
})

app.get('/api/admin/stats', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      riders: countValue('SELECT COUNT(*) as count FROM riders'),
      merchants: countValue('SELECT COUNT(*) as count FROM merchants'),
      orders: countValue('SELECT COUNT(*) as count FROM orders'),
      pending_orders: countValue("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'"),
      alerts: countValue("SELECT COUNT(*) as count FROM alerts WHERE status = 'pending'"),
    },
  })
})

app.get('/api/admin/dashboard', (_req: Request, res: Response): void => {
  const stats = {
    riders: countValue('SELECT COUNT(*) as count FROM riders'),
    merchants: countValue('SELECT COUNT(*) as count FROM merchants'),
    orders: countValue('SELECT COUNT(*) as count FROM orders'),
    alerts: countValue("SELECT COUNT(*) as count FROM alerts WHERE status = 'pending'"),
  }
  const recentOrders = db
    .prepare(
      `SELECT o.id, o.order_no, o.status, o.created_at, m.name as merchant_name, r.name as rider_name
       FROM orders o
       LEFT JOIN merchants m ON o.merchant_id = m.id
       LEFT JOIN riders r ON o.rider_id = r.id
       ORDER BY o.id DESC LIMIT 8`,
    )
    .all()
  res.json({ success: true, data: { stats, recentOrders } })
})

app.get('/api/products', (_req: Request, res: Response): void => {
  const products = db
    .prepare(
      `SELECT id, name, contact_name, phone, address, verify_status as status
       FROM merchants
       ORDER BY id DESC LIMIT 30`,
    )
    .all()
  res.json({ success: true, data: { products, message: '即时配送平台以商户和配送订单作为业务对象' } })
})

app.get('/api/bookings', (_req: Request, res: Response): void => {
  const bookings = db
    .prepare(
      `SELECT id, order_no, type, status, pickup_time_start, delivery_time_start, created_at
       FROM orders
       ORDER BY id DESC LIMIT 50`,
    )
    .all()
  res.json({ success: true, data: { bookings, total: bookings.length } })
})

app.use('/api/auth', authRoutes)
app.use('/api/riders', ridersRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/merchants', merchantsRoutes)
app.use('/api/zones', zonesRoutes)
app.use('/api/alerts', alertsRoutes)
app.use('/api/settlement', settlementRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/risk', riskRoutes)
app.use('/api/trajectories', trajectoriesRoutes)
app.use('/api/verify-logs', verifyLogsRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
