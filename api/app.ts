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
import orderRoutes from './routes/orders.js'
import workerRoutes from './routes/workers.js'
import dispatchRoutes from './routes/dispatch.js'
import sopRoutes from './routes/sop.js'
import qaRoutes from './routes/qa.js'
import insuranceRoutes from './routes/insurance.js'
import enterpriseRoutes from './routes/enterprise.js'
import {
  users,
  orders,
  workers,
  workerScores,
  servicePackages,
  insuranceProducts,
  enterprises,
  batchOrders,
  bills,
  compensations,
  qaRecords,
} from '../src/mock/data.js'

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
app.get(['/api/auth/me', '/api/users/profile', '/api/user/profile'], (_req: Request, res: Response): void => {
  const user = users[0]
  res.status(200).json({
    success: true,
    data: {
      ...(user || {
        id: 1,
        phone: '13800138001',
        nickname: '张女士',
        avatar: '',
        created_at: new Date().toISOString(),
      }),
      role: 'user',
      permissions: ['orders.read', 'orders.create', 'workers.view', 'admin.dashboard'],
    },
  })
})

app.get(['/api/admin/stats', '/api/admin/dashboard'], (_req: Request, res: Response): void => {
  const completedOrders = orders.filter(order => order.status === 'completed')
  const activeOrders = orders.filter(order => !['completed', 'cancelled', 'compensated'].includes(order.status))
  const verifiedWorkers = workers.filter(worker => worker.status === 'verified')
  const pendingWorkers = workers.filter(worker => worker.status === 'pending')
  const revenue = orders.reduce((sum, order) => sum + Number(order.amount || 0), 0)
  const avgScore = workerScores.length
    ? workerScores.reduce((sum, score) => sum + Number(score.overall_score || 0), 0) / workerScores.length
    : 0

  res.status(200).json({
    success: true,
    data: {
      total_orders: orders.length,
      active_orders: activeOrders.length,
      completed_orders: completedOrders.length,
      compensated_orders: orders.filter(order => order.status === 'compensated').length,
      total_revenue: Number(revenue.toFixed(2)),
      verified_workers: verifiedWorkers.length,
      pending_worker_reviews: pendingWorkers.length,
      avg_worker_score: Number(avgScore.toFixed(1)),
      service_packages: servicePackages.length,
      insurance_products: insuranceProducts.length,
      enterprise_clients: enterprises.length,
      batch_orders: batchOrders.length,
      bills: bills.length,
      pending_compensations: compensations.filter(item => item.status === 'pending').length,
      qa_records: qaRecords.length,
      worker_health: workerScores.map(score => ({
        worker_id: score.worker_id,
        overall_score: score.overall_score,
        punctuality_rate: score.punctuality_rate,
        satisfaction_rate: score.satisfaction_rate,
        complaint_rate: score.complaint_rate,
      })),
    },
  })
})

app.get('/api/products', (_req: Request, res: Response): void => {
  const packageProducts = servicePackages.map(item => ({
    id: `package-${item.id}`,
    name: item.name,
    category: '企业服务包',
    price: item.price,
    original_price: item.original_price,
    service_types: item.service_type_labels,
    description: item.description,
    features: item.features,
  }))

  const insuranceItems = insuranceProducts.map(item => ({
    id: `insurance-${item.id}`,
    name: item.name,
    category: '保险保障',
    price: item.premium,
    coverage_amount: item.coverage_amount,
    provider: item.provider,
    description: item.description,
  }))

  res.status(200).json({
    success: true,
    data: [...packageProducts, ...insuranceItems],
  })
})

app.get('/api/cart', (_req: Request, res: Response): void => {
  const item = servicePackages[0]
  const items = item
    ? [{
        id: `package-${item.id}`,
        name: item.name,
        price: item.price,
        quantity: 1,
        category: '企业服务包',
      }]
    : []

  res.status(200).json({
    success: true,
    data: {
      id: 'housekeeping-local-cart',
      items,
      total: items.reduce((sum, cartItem) => sum + Number(cartItem.price || 0) * cartItem.quantity, 0),
    },
  })
})

app.get('/api/teachers', (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: workers.map(worker => ({
      ...worker,
      name: worker.real_name,
      score: workerScores.find(score => score.worker_id === worker.id) || null,
    })),
  })
})

app.get('/api/courses', (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: servicePackages.map(item => ({
      ...item,
      title: item.name,
      category: '家政服务',
    })),
  })
})

app.get('/api/bookings', (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: orders,
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/workers', workerRoutes)
app.use('/api/dispatch', dispatchRoutes)
app.use('/api/sop', sopRoutes)
app.use('/api/qa', qaRoutes)
app.use('/api/insurance', insuranceRoutes)
app.use('/api/enterprise', enterpriseRoutes)

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
