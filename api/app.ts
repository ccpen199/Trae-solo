/**
 * 实验报告批改系统 API 服务器
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import { fileURLToPath } from 'url'
import { initDatabase } from './utils/db.js'

import authRoutes from './routes/auth.js'
import experimentRoutes from './routes/experiments.js'
import submissionRoutes from './routes/submissions.js'
import gradingRoutes from './routes/grading.js'
import gradeRoutes from './routes/grades.js'
import adminRoutes from './routes/admin.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

initDatabase()

const app: express.Application = express()

const frontendPort = process.env.FRONTEND_PORT || '48884'
const corsOrigin = `http://127.0.0.1:${frontendPort}`

app.use(cors({
  origin: [corsOrigin, `http://localhost:${frontendPort}`],
  credentials: true,
}))

app.use(cookieParser())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

const uploadDir = process.env.UPLOAD_DIR || './uploads'
app.use('/uploads', express.static(path.resolve(uploadDir)))

app.use('/api/auth', authRoutes)
app.use('/api/experiments', experimentRoutes)
app.use('/api/submissions', submissionRoutes)
app.use('/api/grading', gradingRoutes)
app.use('/api/grades', gradeRoutes)
app.use('/api/admin', adminRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
      timestamp: new Date().toISOString(),
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', error)
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    message: error.message,
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
    path: req.path,
  })
})

export default app
