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
import jobseekerRoutes from './routes/jobseeker.js'
import jobsRoutes from './routes/jobs.js'
import townshipRoutes from './routes/township.js'
import enterpriseRoutes from './routes/enterprise.js'
import rpoRoutes from './routes/rpo.js'
import campusRoutes from './routes/campus.js'
import educationRoutes from './routes/education.js'
import analyticsRoutes from './routes/analytics.js'
import adminRoutes from './routes/admin.js'
import subsidyRoutes from './routes/subsidy.js'
import { MOCK_ENTERPRISES, MOCK_JOBS } from './mock/mockData.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/jobseeker', jobseekerRoutes)
app.use('/api/jobs', jobsRoutes)
app.use('/api/townships', townshipRoutes)
app.use('/api/enterprise', enterpriseRoutes)
app.use('/api/rpo', rpoRoutes)
app.use('/api/campus', campusRoutes)
app.use('/api/education', educationRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/subsidy', subsidyRoutes)

app.get('/api/search', (req: Request, res: Response): void => {
  const query = String(req.query.q || req.query.keyword || '').trim().toLowerCase()
  const jobs = MOCK_JOBS.filter((job) => {
    const text = `${job.title} ${job.category} ${job.skills?.join(' ') || ''}`.toLowerCase()
    return !query || text.includes(query)
  }).slice(0, 20)
  const enterprises = MOCK_ENTERPRISES.filter((enterprise) => {
    const text = `${enterprise.name} ${enterprise.industry} ${enterprise.township}`.toLowerCase()
    return !query || text.includes(query)
  }).slice(0, 10)

  res.json({
    success: true,
    data: {
      query,
      total: jobs.length + enterprises.length,
      jobs,
      enterprises,
    },
  })
})

app.get(['/api/users/profile', '/api/user/profile'], (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      id: 'local-jobseeker',
      name: '本地求职者',
      role: 'jobseeker',
      phone: '13800138000',
      verified: true,
    },
  })
})

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
