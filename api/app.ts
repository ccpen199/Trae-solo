import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDatabase } from './database.js'
import authRoutes from './routes/auth.js'
import jobsRoutes from './routes/jobs.js'
import talentsRoutes from './routes/talents.js'
import interviewsRoutes from './routes/interviews.js'
import attendanceRoutes from './routes/attendance.js'
import settlementRoutes from './routes/settlement.js'
import microTasksRoutes from './routes/micro-tasks.js'
import creditRoutes from './routes/credit.js'
import riskRoutes from './routes/risk.js'
import adminRoutes from './routes/admin.js'

dotenv.config()

initDatabase()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/jobs', jobsRoutes)
app.use('/api/talents', talentsRoutes)
app.use('/api/interviews', interviewsRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/settlement', settlementRoutes)
app.use('/api/micro-tasks', microTasksRoutes)
app.use('/api/credit', creditRoutes)
app.use('/api/risk', riskRoutes)
app.use('/api/admin', adminRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
