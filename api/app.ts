/**
 * 新高考志愿决策支持平台 API 服务
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'

import { cors } from './middleware/cors.js'
import { desensitize } from './middleware/desensitize.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

import authRoutes from './routes/auth.js'
import universityRoutes from './routes/universities.js'
import majorRoutes from './routes/majors.js'
import recommendRoutes from './routes/recommend.js'
import planRoutes from './routes/plans.js'
import collaborationRoutes from './routes/collaboration.js'
import qaRoutes from './routes/qa.js'
import liveRoutes from './routes/live.js'
import adminRoutes from './routes/admin.js'
import admissionScoreRoutes from './routes/admissionScores.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(desensitize)

app.get('/api/health', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
    message: '服务运行正常',
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/universities', universityRoutes)
app.use('/api/majors', majorRoutes)
app.use('/api/recommend', recommendRoutes)
app.use('/api/plans', planRoutes)
app.use('/api/collaboration', collaborationRoutes)
app.use('/api/qa', qaRoutes)
app.use('/api/live', liveRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/admission-scores', admissionScoreRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
