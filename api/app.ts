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
import servicesRoutes from './routes/services.js'
import applicationsRoutes from './routes/applications.js'
import guideRoutes from './routes/guide.js'
import certificatesRoutes from './routes/certificates.js'
import ocrRoutes from './routes/ocr.js'
import signatureRoutes from './routes/signature.js'
import adminPerformanceRoutes from './routes/admin/performance.js'
import adminSystemsRoutes from './routes/admin/systems.js'
import adminPolicyRoutes from './routes/admin/policy.js'

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
app.use('/api/services', servicesRoutes)
app.use('/api/applications', applicationsRoutes)
app.use('/api/guide', guideRoutes)
app.use('/api/certificates', certificatesRoutes)
app.use('/api/ocr', ocrRoutes)
app.use('/api/signature', signatureRoutes)
app.use('/api/admin/performance', adminPerformanceRoutes)
app.use('/api/admin/systems', adminSystemsRoutes)
app.use('/api/admin/policy', adminPolicyRoutes)

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
