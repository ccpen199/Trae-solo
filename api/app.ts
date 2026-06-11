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
import pricingRoutes from './routes/pricing.js'
import riderRoutes from './routes/riders.js'
import heatmapRoutes from './routes/heatmap.js'
import compensationRoutes from './routes/compensation.js'
import waybillRoutes from './routes/waybills.js'
import dashboardRoutes from './routes/dashboard.js'
import apiIntegrationRoutes from './routes/api.js'
import logger from './middleware/logger.js'
import errorHandler, { NotFoundError } from './middleware/errorHandler.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(logger)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/pricing', pricingRoutes)
app.use('/api/riders', riderRoutes)
app.use('/api/heatmap', heatmapRoutes)
app.use('/api/compensation', compensationRoutes)
app.use('/api/waybills', waybillRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/api', apiIntegrationRoutes)

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
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundError('API not found'))
})

app.use(errorHandler)

export default app
