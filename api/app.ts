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
import { initDatabase } from './db.js'
import authRoutes from './routes/auth.js'
import couponRoutes from './routes/coupons.js'
import verificationRoutes from './routes/verifications.js'
import appointmentRoutes from './routes/appointments.js'
import refundRoutes from './routes/refunds.js'
import merchantRoutes from './routes/merchant.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

initDatabase()

const app: express.Application = express()

const frontendPort = process.env.FRONTEND_PORT || '43421';
app.use(cors({
  origin: [`http://127.0.0.1:${frontendPort}`, `http://localhost:${frontendPort}`],
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/coupons', couponRoutes)
app.use('/api/verifications', verificationRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/refunds', refundRoutes)
app.use('/api/merchant', merchantRoutes)

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
