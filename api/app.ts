import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { env } from './config/env.js'

import authRoutes from './routes/auth.js'
import permitRoutes from './routes/permit.js'
import violationRoutes from './routes/violation.js'
import accidentRoutes from './routes/accident.js'
import ebikeRoutes from './routes/ebike.js'
import appointmentRoutes from './routes/appointment.js'
import chatbotRoutes from './routes/chatbot.js'
import workflowRoutes from './routes/workflow.js'
import certificateRoutes from './routes/certificate.js'
import statsRoutes from './routes/stats.js'
import uploadRoutes from './routes/upload.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR)
app.use('/uploads', express.static(uploadDir))

app.use(express.static(path.join(__dirname, 'public')))

app.use('/api/auth', authRoutes)
app.use('/api/permit', permitRoutes)
app.use('/api/violation', violationRoutes)
app.use('/api/accident', accidentRoutes)
app.use('/api/ebike', ebikeRoutes)
app.use('/api/appointment', appointmentRoutes)
app.use('/api/chatbot', chatbotRoutes)
app.use('/api/workflow', workflowRoutes)
app.use('/api/certificate', certificateRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/upload', uploadRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      code: 0,
      message: 'ok',
      data: {
        timestamp: Date.now(),
        uptime: process.uptime(),
      },
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', error)
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    data: null,
    timestamp: Date.now(),
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    code: 404,
    message: 'API不存在',
    data: null,
    timestamp: Date.now(),
  })
})

export default app
