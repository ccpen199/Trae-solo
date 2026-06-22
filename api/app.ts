/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import buildingRoutes from './routes/buildings.js'
import propertyRoutes from './routes/properties.js'
import calculatorRoutes from './routes/calculator.js'
import lotteryRoutes from './routes/lottery.js'
import complaintRoutes from './routes/complaints.js'
import contentRoutes from './routes/contents.js'
import verifyRoutes from './routes/verify.js'

// load env
dotenv.config()

const host = process.env.HOST || '127.0.0.1'
const frontendPort = Number(process.env.FRONTEND_PORT || 49320)
const backendPort = Number(process.env.BACKEND_PORT || 59320)
const frontendUrl = process.env.FRONTEND_URL || `http://${host}:${frontendPort}/`
const backendUrl = process.env.BACKEND_URL || `http://${host}:${backendPort}`

const app: express.Application = express()

app.use(cors({ origin: frontendUrl }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/buildings', buildingRoutes)
app.use('/api/properties', propertyRoutes)
app.use('/api/calculator', calculatorRoutes)
app.use('/api/lottery', lotteryRoutes)
app.use('/api/complaints', complaintRoutes)
app.use('/api/contents', contentRoutes)
app.use('/api/verify', verifyRoutes)

/**
 * health
 */
app.get('/api/health', (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'ok',
    host,
    frontendUrl,
    backendUrl,
  })
})

/**
 * error handler middleware
 */
app.use((_error: Error, _req: Request, res: Response, _next: NextFunction) => {
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
