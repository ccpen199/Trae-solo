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
import diagnosisRoutes from './routes/diagnosis.js'
import bookingRoutes from './routes/booking.js'
import orderRoutes from './routes/orders.js'
import recycleRoutes from './routes/recycle.js'
import technicianRoutes from './routes/technicians.js'
import slaRoutes from './routes/sla.js'
import inventoryRoutes from './routes/inventory.js'
import complaintRoutes from './routes/complaints.js'

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
app.use('/api/diagnosis', diagnosisRoutes)
app.use('/api/booking', bookingRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/recycle', recycleRoutes)
app.use('/api/admin/technicians', technicianRoutes)
app.use('/api/admin/sla', slaRoutes)
app.use('/api/admin/inventory', inventoryRoutes)
app.use('/api/admin/complaints', complaintRoutes)

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
