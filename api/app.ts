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
import authRoutes, { authMiddleware } from './routes/auth.js'
import electricityRoutes from './routes/electricity.js'
import energyRoutes from './routes/energy.js'
import smartlifeRoutes from './routes/smartlife.js'
import knowledgeRoutes from './routes/knowledge.js'
import complianceRoutes from './routes/compliance.js'
import adminRoutes from './routes/admin.js'
import db, { initDB } from './db.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()
const FRONTEND_PORT = process.env.FRONTEND_PORT || '49043'

app.use(cors({
  origin: [`http://127.0.0.1:${FRONTEND_PORT}`, `http://localhost:${FRONTEND_PORT}`],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

initDB()

app.get('/api/dashboard', authMiddleware, (req: Request, res: Response): void => {
  try {
    const user = (req as any).user
    const userId = user.id
    const bills = db.prepare(`
      SELECT id, billing_period, total_kwh, total_amount, peak_kwh, valley_kwh, flat_kwh, status, due_date
      FROM electricity_bills
      WHERE user_id = ?
      ORDER BY billing_period DESC
      LIMIT 6
    `).all(userId) as any[]
    const latest = bills[0] || null
    const outages = db.prepare(`
      SELECT id, title, area, start_time, end_time, status
      FROM outage_notices
      ORDER BY start_time DESC
      LIMIT 3
    `).all() as any[]

    const recentBills = bills.slice(0, 3).map((bill) => ({
      id: String(bill.id),
      period: bill.billing_period,
      amount: Number(bill.total_amount || 0),
      usage: Number(bill.total_kwh || 0),
      status: bill.status,
    }))

    const peakValleyData = bills.slice().reverse().map((bill) => ({
      month: String(bill.billing_period || '').slice(5) + '月',
      peak: Number(bill.peak_kwh || 0),
      valley: Number(bill.valley_kwh || 0),
      flat: Number(bill.flat_kwh || 0),
    }))

    const seasonalData = bills.slice().reverse().map((bill) => ({
      month: String(bill.billing_period || '').slice(5) + '月',
      usage: Number(bill.total_kwh || 0),
    }))

    res.json({
      success: true,
      data: {
        currentBill: Number(latest?.total_amount || 0),
        currentUsage: Number(latest?.total_kwh || 0),
        carbonEmission: Number(((latest?.total_kwh || 0) * 0.00058).toFixed(2)),
        points: Number(user.points_balance || 0),
        recentBills,
        outages: outages.map((item) => ({
          id: String(item.id),
          title: item.title,
          area: item.area,
          startTime: item.start_time,
          endTime: item.end_time,
          status: item.status,
        })),
        efficiencyScore: 78,
        peakValleyData,
        seasonalData,
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.get('/api/users/profile', authMiddleware, (req: Request, res: Response): void => {
  res.json({ success: true, data: (req as any).user })
})

app.get('/api/user/profile', authMiddleware, (req: Request, res: Response): void => {
  res.json({ success: true, data: (req as any).user })
})

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/electricity', electricityRoutes)
app.use('/api/energy', energyRoutes)
app.use('/api/smartlife', smartlifeRoutes)
app.use('/api/knowledge', knowledgeRoutes)
app.use('/api/compliance', complianceRoutes)
app.use('/api/admin', adminRoutes)

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
