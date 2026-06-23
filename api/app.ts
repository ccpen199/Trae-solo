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
import standardsRoutes from './routes/standards.js'
import searchRoutes from './routes/search.js'
import recognitionRoutes from './routes/recognition.js'
import feedbackRoutes from './routes/feedback.js'
import statisticsRoutes from './routes/statistics.js'
import pdfRoutes from './routes/pdf.js'

import { initDatabase } from './db/init.js'
import { seedMockData } from './db/mockData.js'

initDatabase()
seedMockData()

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
app.use('/api/standards', standardsRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/recognition', recognitionRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/statistics', statisticsRoutes)
app.use('/api/pdf', pdfRoutes)

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
app.use((error: Error & { code?: string; message: string }, req: Request, res: Response, next: NextFunction) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({
      success: false,
      error: '文件大小超过限制（最大10MB）',
    })
    return
  }
  
  if (error.message.includes('只允许上传PDF文件')) {
    res.status(400).json({
      success: false,
      error: error.message,
    })
    return
  }

  console.error('Server error:', error)
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
