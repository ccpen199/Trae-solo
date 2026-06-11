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
import { seedDatabase } from './seed.js'
import verifyRoutes from './routes/verify.js'
import dashboardRoutes from './routes/dashboard.js'
import alertRoutes from './routes/alerts.js'
import reviewRoutes from './routes/review.js'
import auditRoutes from './routes/audit.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

initDatabase()
seedDatabase()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/verify', verifyRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/review', reviewRoutes)
app.use('/api/audit', auditRoutes)

app.get(['/api/auth/me', '/api/users/profile', '/api/user/profile'], (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      id: 'admin-demo',
      name: '后台管理员',
      role: 'admin',
      platform: '养老待遇资格认证后台管理平台',
    },
  })
})

app.get(['/api/admin/stats', '/api/admin/dashboard'], (req: Request, res: Response) => {
  const stats = {
    totalCerts: 46,
    todayCerts: 1,
    passRate: 82.6,
    pendingReviews: 5,
    modules: ['数据看板', '异常预警', '人工复核', '日志审计'],
  }
  res.json({
    success: true,
    data: stats,
  })
})

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
