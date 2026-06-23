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
import usersRoutes from './routes/users.js'
import meterReadingsRoutes from './routes/meterReadings.js'
import billsRoutes from './routes/bills.js'
import workOrdersRoutes from './routes/workOrders.js'
import warningsRoutes from './routes/warnings.js'
import pricingRoutes from './routes/pricing.js'
import gisRoutes from './routes/gis.js'
import inspectionsRoutes from './routes/inspections.js'
import dashboardRoutes from './routes/dashboard.js'
import reportingRoutes from './routes/reporting.js'
import outageRoutes from './routes/outage.js'

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
app.use('/api/users', usersRoutes)
app.use('/api/meter-readings', meterReadingsRoutes)
app.use('/api/bills', billsRoutes)
app.use('/api/work-orders', workOrdersRoutes)
app.use('/api/warnings', warningsRoutes)
app.use('/api/tiered-pricing', pricingRoutes)
app.use('/api', gisRoutes)
app.use('/api/inspections', inspectionsRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/reporting', reportingRoutes)
app.use('/api/outage-plans', outageRoutes)

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
