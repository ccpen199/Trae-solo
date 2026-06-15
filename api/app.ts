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
import userRoutes from './routes/users.js'
import courseRoutes from './routes/courses.js'
import orderRoutes from './routes/orders.js'
import paymentRoutes from './routes/payment.js'
import reviewRoutes from './routes/review.js'
import adminRoutes from './routes/admin.js'

import { initSchema } from './db/schema.js'
import { seedData } from './db/seed.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/review', reviewRoutes)
app.use('/api/admin', adminRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'SkillVerse API is running',
      timestamp: new Date().toISOString(),
    })
  },
)

app.get('/api/config', (req: Request, res: Response) => {
  res.json({
    code: 0,
    message: 'success',
    data: {
      categories: ['舞蹈', '音乐', '运动', '绘画', '摄影', '烹饪', '编程', '语言', '家政'],
      orderStatuses: [
        { value: 'published', label: '已发布', color: 'blue' },
        { value: 'matched', label: '已匹配', color: 'cyan' },
        { value: 'confirmed', label: '已确认', color: 'teal' },
        { value: 'deposit_paid', label: '定金已付', color: 'lime' },
        { value: 'in_progress', label: '服务中', color: 'amber' },
        { value: 'completed', label: '已完成', color: 'green' },
        { value: 'cancelled', label: '已取消', color: 'gray' },
        { value: 'disputed', label: '争议中', color: 'red' },
      ],
      roles: [
        { value: 'user', label: '普通用户' },
        { value: 'creator', label: '创作者' },
        { value: 'admin', label: '管理员' },
      ],
      platformFeeRate: 0.15,
    },
  })
})

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Error]', error)
  res.status(500).json({
    code: 500,
    message: error.message || 'Server internal error',
    data: null,
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    code: 404,
    message: 'API not found',
    data: null,
  })
})

export function initDatabase() {
  try {
    initSchema()
    seedData()
    console.log('[Database] Initialized successfully')
  } catch (err) {
    console.error('[Database] Initialization failed:', err)
  }
}

export default app
