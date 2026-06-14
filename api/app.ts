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
import freightRoutes from './routes/freights.js'
import orderRoutes from './routes/orders.js'
import invoiceRoutes from './routes/invoices.js'
import settlementRoutes from './routes/settlements.js'
import safetyRoutes from './routes/safety.js'
import certificationRoutes from './routes/certification.js'
import './db.js'
import './seed.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors({
  origin: ['http://127.0.0.1:48919', 'http://localhost:48919'],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/freights', freightRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/settlements', settlementRoutes)
app.use('/api/safety', safetyRoutes)
app.use('/api/certification', certificationRoutes)

/**
 * health
 */
app.get(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('API error:', error)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
    message: error.message,
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
