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
import estimateRoutes from './routes/estimate.js'
import orderRoutes from './routes/orders.js'
import qualityRoutes from './routes/admin/quality.js'
import pricingRoutes from './routes/admin/pricing.js'
import payoutRoutes from './routes/admin/payout.js'
import logisticsRoutes from './routes/admin/logistics.js'
import processorRoutes from './routes/admin/processors.js'
import analyticsRoutes from './routes/admin/analytics.js'

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
app.use('/api/estimate', estimateRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/admin/quality-orders', qualityRoutes)
app.use('/api/admin/pricing-rules', pricingRoutes)
app.use('/api/admin/payouts', payoutRoutes)
app.use('/api/admin', logisticsRoutes)
app.use('/api/admin/processors', processorRoutes)
app.use('/api/admin/analytics', analyticsRoutes)

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
