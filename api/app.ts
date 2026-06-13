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
import trackingRoutes from './routes/tracking.js'
import ordersRoutes from './routes/orders.js'
import networksRoutes from './routes/networks.js'
import estimateRoutes from './routes/estimate.js'
import alertsRoutes from './routes/alerts.js'
import knowledgeRoutes from './routes/knowledge.js'
import ticketsRoutes from './routes/tickets.js'
import profilingRoutes from './routes/profiling.js'
import addressBookRoutes from './routes/address-book.js'

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
app.use('/api/tracking', trackingRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/networks', networksRoutes)
app.use('/api/estimate', estimateRoutes)
app.use('/api/alerts', alertsRoutes)
app.use('/api/knowledge', knowledgeRoutes)
app.use('/api/tickets', ticketsRoutes)
app.use('/api/profiling', profilingRoutes)
app.use('/api/address-book', addressBookRoutes)

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
