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
import authRoutes from './src/routes/auth.js'
import accessRoutes from './src/routes/access.js'
import workOrderRoutes from './src/routes/workorder.js'
import mallRoutes from './src/routes/mall.js'
import socialRoutes from './src/routes/social.js'
import analyticsRoutes from './src/routes/analytics.js'
import riskRoutes from './src/routes/risk.js'
import db from './src/database/connection.js'
import { initDatabase } from './src/database/init.js'
import { seedDatabase } from './src/database/seed.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

function ensureLocalDatabase() {
  initDatabase()
  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number }
  if (!userCount.count) {
    seedDatabase()
  }
}

function firstRow(sql: string, params: unknown[] = []) {
  return db.prepare(sql).get(...params)
}

function allRows(sql: string, params: unknown[] = []) {
  return db.prepare(sql).all(...params)
}

function countRows(table: string, where = '1=1') {
  const row = db.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE ${where}`).get() as { count: number }
  return row.count
}

function demoUser() {
  const user = firstRow("SELECT * FROM users WHERE username = 'owner1'") || firstRow('SELECT * FROM users ORDER BY id LIMIT 1')
  return user || null
}

function profilePayload() {
  const user: any = demoUser()
  const membership: any = user ? firstRow('SELECT * FROM memberships WHERE user_id = ?', [user.id]) : null
  return {
    user,
    membership,
    stats: {
      orders: user ? countRows('orders', `user_id = ${Number(user.id)}`) : countRows('orders'),
      workOrders: user ? countRows('work_orders', `user_id = ${Number(user.id)}`) : countRows('work_orders'),
      visitorPasses: user ? countRows('visitor_passes', `creator_id = ${Number(user.id)}`) : countRows('visitor_passes'),
    },
  }
}

function adminDashboardPayload() {
  return {
    users: countRows('users'),
    houses: countRows('houses'),
    workOrders: countRows('work_orders'),
    pendingWorkOrders: countRows('work_orders', "status = 'pending'"),
    visitorPasses: countRows('visitor_passes'),
    accessDevices: countRows('access_devices'),
    onlineDevices: countRows('access_devices', "status = 'online'"),
    merchants: countRows('merchants'),
    products: countRows('products'),
    orders: countRows('orders'),
    alerts: countRows('alerts'),
    unresolvedAlerts: countRows('alerts', "status IN ('pending', 'processing')"),
    modules: ['个人中心', '后台管理', '通行管理', '工单中心', '社区商圈', '风险预警'],
    recentWorkOrders: allRows('SELECT id, title, type, priority, status, created_at FROM work_orders ORDER BY id DESC LIMIT 8'),
    recentAlerts: allRows('SELECT id, title, level, status, location, occurred_at FROM alerts ORDER BY id DESC LIMIT 8'),
  }
}

ensureLocalDatabase()

const app: express.Application = express()

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://127.0.0.1:49087',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/access', accessRoutes)
app.use('/api/workorder', workOrderRoutes)
app.use('/api/mall', mallRoutes)
app.use('/api/social', socialRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/risk', riskRoutes)

app.get('/api/users/profile', (_req: Request, res: Response) => {
  res.json({ success: true, data: profilePayload() })
})

app.get('/api/user/profile', (_req: Request, res: Response) => {
  res.json({ success: true, data: profilePayload() })
})

app.get('/api/admin/stats', (_req: Request, res: Response) => {
  res.json({ success: true, data: adminDashboardPayload() })
})

app.get('/api/admin/dashboard', (_req: Request, res: Response) => {
  res.json({ success: true, data: adminDashboardPayload() })
})

app.get('/api/search', (req: Request, res: Response) => {
  const keyword = String(req.query.q || req.query.keyword || '').trim()
  const like = `%${keyword}%`
  const products = keyword
    ? allRows('SELECT id, name, description, category, price, stock FROM products WHERE name LIKE ? OR description LIKE ? OR category LIKE ? ORDER BY id DESC LIMIT 20', [like, like, like])
    : allRows('SELECT id, name, description, category, price, stock FROM products ORDER BY id DESC LIMIT 20')
  const workOrders = keyword
    ? allRows('SELECT id, title, description, type, status, priority FROM work_orders WHERE title LIKE ? OR description LIKE ? OR type LIKE ? ORDER BY id DESC LIMIT 20', [like, like, like])
    : allRows('SELECT id, title, description, type, status, priority FROM work_orders ORDER BY id DESC LIMIT 20')
  res.json({ success: true, data: { keyword, products, workOrders } })
})

app.get('/api/products', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: allRows(`
      SELECT p.*, m.name AS merchant_name
      FROM products p
      LEFT JOIN merchants m ON m.id = p.merchant_id
      ORDER BY p.id DESC
      LIMIT 50
    `),
  })
})

app.get('/api/orders', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: allRows(`
      SELECT o.*, m.name AS merchant_name
      FROM orders o
      LEFT JOIN merchants m ON m.id = o.merchant_id
      ORDER BY o.id DESC
      LIMIT 50
    `),
  })
})

app.get('/api/cart', (_req: Request, res: Response) => {
  const products = allRows('SELECT id, name, price, stock FROM products ORDER BY id ASC LIMIT 3') as any[]
  res.json({
    success: true,
    data: {
      items: products.map((item) => ({ ...item, quantity: 1 })),
      total: products.reduce((sum, item) => sum + Number(item.price || 0), 0),
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
