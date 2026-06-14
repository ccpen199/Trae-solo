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
import socialSecurityRoutes from './routes/socialSecurity.js'
import trafficRoutes from './routes/traffic.js'
import paymentRoutes from './routes/payment.js'
import communityRoutes from './routes/community.js'
import poiRoutes from './routes/poi.js'
import policiesRoutes from './routes/policies.js'
import servicesRoutes from './routes/services.js'
import weatherRoutes from './routes/weather.js'
import userRoutes from './routes/user.js'

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
app.use('/api/social-security', socialSecurityRoutes)
app.use('/api/traffic', trafficRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/community', communityRoutes)
app.use('/api/poi', poiRoutes)
app.use('/api/policies', policiesRoutes)
app.use('/api/services', servicesRoutes)
app.use('/api/weather', weatherRoutes)
app.use('/api/user', userRoutes)

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
