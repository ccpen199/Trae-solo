import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import verifyRoutes from './routes/verify.js'
import healthRoutes from './routes/healthService.js'
import transportRoutes from './routes/transport.js'
import tourismRoutes from './routes/tourism.js'
import socialSecurityRoutes from './routes/socialSecurity.js'
import policeRoutes from './routes/police.js'
import subscriptionRoutes from './routes/subscriptions.js'
import applicationRoutes from './routes/applications.js'
import complaintRoutes from './routes/complaints.js'
import adminRoutes from './routes/admin.js'
import profileRoutes from './routes/profile.js'
import notificationRoutes from './routes/notifications.js'
import searchRoutes from './routes/search.js'
import { authMiddleware } from './middleware/auth.js'
import db from './database.js'

dotenv.config()

const app: express.Application = express()
const frontendPort = process.env.FRONTEND_PORT || '49062'
const allowedOrigins = [
  `http://127.0.0.1:${frontendPort}`,
  `http://localhost:${frontendPort}`,
]

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/verify', verifyRoutes)
app.use('/api/health', healthRoutes)
app.use('/api/transport', transportRoutes)
app.use('/api/tourism', tourismRoutes)
app.use('/api/social-security', socialSecurityRoutes)
app.use('/api/police', policeRoutes)
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/complaints', complaintRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/search', searchRoutes)

app.get('/api/teachers', (_req: Request, res: Response): void => {
  const doctors = db.prepare(
    `SELECT d.id, d.name, d.title, d.schedule, dep.name as department
     FROM doctors d
     JOIN departments dep ON d.department_id = dep.id
     ORDER BY d.id
     LIMIT 12`,
  ).all()
  res.json({ code: 0, message: 'success', data: doctors })
})

app.get('/api/courses', (_req: Request, res: Response): void => {
  const services = db.prepare('SELECT id, name, department, endpoint, status FROM service_registry ORDER BY id').all()
  res.json({ code: 0, message: 'success', data: services })
})

app.get('/api/bookings', (_req: Request, res: Response): void => {
  res.json({
    code: 0,
    message: 'success',
    data: {
      appointments: [],
      reservations: [],
      note: '请登录后在挂号或文旅模块查看个人预约记录',
    },
  })
})

app.get('/api/orders', (_req: Request, res: Response): void => {
  res.json({ code: 0, message: 'success', data: [] })
})

const profileAlias = (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.json({ code: 0, message: 'success', data: { authenticated: false, user: null } })
    return
  }

  authMiddleware(req, res, () => {
    try {
      const userId = (req as any).user.id
      const user = db.prepare('SELECT id, phone, name, role, verified, sukang_status, street, created_at FROM users WHERE id = ?').get(userId)
      res.json({ code: 0, message: 'success', data: { authenticated: true, user } })
    } catch (error: any) {
      res.json({ code: -1, message: error.message })
    }
  })
}

app.get('/api/users/profile', profileAlias)
app.get('/api/user/profile', profileAlias)

app.use('/api/health-check', (_req: Request, res: Response): void => {
  res.json({ code: 0, message: 'ok' })
})

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ code: -1, message: '服务器内部错误' })
})

app.use((_req: Request, res: Response) => {
  res.status(404).json({ code: -1, message: '接口不存在' })
})

export default app
