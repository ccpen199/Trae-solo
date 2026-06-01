import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { initDatabase } from './database.js'
import authRoutes from './routes/auth.js'
import coursesRoutes from './routes/courses.js'
import teachersRoutes from './routes/teachers.js'
import classesRoutes from './routes/classes.js'
import classroomsRoutes from './routes/classrooms.js'
import schedulesRoutes from './routes/schedules.js'
import adjustmentsRoutes from './routes/adjustments.js'
import notificationsRoutes from './routes/notifications.js'
import reportsRoutes from './routes/reports.js'
import seedRoutes from './routes/seed.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

initDatabase()

const app: express.Application = express()

const FRONTEND_PORT = Number(process.env.FRONTEND_PORT || 43452)

app.use(cors({
  origin: [`http://127.0.0.1:${FRONTEND_PORT}`, `http://localhost:${FRONTEND_PORT}`],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/courses', coursesRoutes)
app.use('/api/teachers', teachersRoutes)
app.use('/api/classes', classesRoutes)
app.use('/api/classrooms', classroomsRoutes)
app.use('/api/schedules', schedulesRoutes)
app.use('/api/adjustments', adjustmentsRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/seed', seedRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
      service: 'may-63452',
      timestamp: new Date().toISOString(),
    })
  },
)

app.get('/api/overview', (req: Request, res: Response): void => {
  res.status(200).json({
    summary: {
      activeUsers: 128,
      pendingTasks: 14,
      completedToday: 37,
      serviceLevel: 'stable',
    },
    modules: [
      { name: '用户认证', status: 'online', count: 3 },
      { name: '数据看板', status: 'online', count: 6 },
      { name: '业务流程', status: 'online', count: 12 },
    ],
  })
})

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(error)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
    message: error.message,
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
