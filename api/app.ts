/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import trafficRoutes from './routes/traffic.js'
import tollRoutes from './routes/toll.js'
import rechargeRoutes from './routes/recharge.js'
import outletsRoutes from './routes/outlets.js'
import settlementRoutes from './routes/settlement.js'
import obuRoutes from './routes/obu.js'
import exceptionRoutes from './routes/exception.js'
import dashboardRoutes from './routes/dashboard.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
void path.dirname(__filename)

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
app.use('/api/traffic', trafficRoutes)
app.use('/api/toll', tollRoutes)
app.use('/api/recharge', rechargeRoutes)
app.use('/api/outlets', outletsRoutes)
app.use('/api/settlement', settlementRoutes)
app.use('/api/obu', obuRoutes)
app.use('/api/exception', exceptionRoutes)
app.use('/api/dashboard', dashboardRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (_req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, _req: Request, res: Response) => {
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
