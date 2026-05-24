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
import carRoutes from './routes/cars.js'
import inspectionRoutes from './routes/inspections.js'
import userRoutes from './routes/users.js'
import appointmentRoutes from './routes/appointments.js'
import depositRoutes from './routes/deposits.js'
import contractRoutes from './routes/contracts.js'
import transferRoutes from './routes/transfers.js'
import settlementRoutes from './routes/settlements.js'
import statisticsRoutes from './routes/statistics.js'
import exceptionRoutes from './routes/exceptions.js'
import auditRoutes from './routes/audit.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

const frontendPort = process.env.FRONTEND_PORT || '42667';
const corsOptions = {
  origin: [`http://127.0.0.1:${frontendPort}`, `http://localhost:${frontendPort}`],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/cars', carRoutes)
app.use('/api/inspections', inspectionRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/deposits', depositRoutes)
app.use('/api/contracts', contractRoutes)
app.use('/api/transfers', transferRoutes)
app.use('/api/settlements', settlementRoutes)
app.use('/api/statistics', statisticsRoutes)
app.use('/api/exceptions', exceptionRoutes)
app.use('/api/audit-logs', auditRoutes)

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
