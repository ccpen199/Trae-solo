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
import { db } from './db/index.js'
import { getCourses } from './services/courseService.js'
import { getOrders } from './services/orderService.js'
import { getCreators } from './services/userService.js'

import { initSchema } from './db/schema.js'
import { seedData } from './db/seed.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const demoProfile = {
  id: 'local-admin',
  username: 'admin',
  role: 'admin',
  avatar: '',
  bio: 'SkillVerse 本地演示管理员',
  followerCount: 0,
  followingCount: 0,
  rating: 5,
  verified: true,
  location: '本地演示',
  createdAt: new Date().toISOString(),
}

app.get(['/api/auth/me', '/api/users/profile', '/api/user/profile'], (_req: Request, res: Response) => {
  res.json({ code: 0, message: 'success', data: demoProfile })
})

app.get('/api/search', (req: Request, res: Response) => {
  const keyword = String(req.query.q || req.query.keyword || '').trim()
  const courses = getCourses({ page: 1, pageSize: 8, keyword: keyword || undefined })
  const orders = getOrders({ page: 1, pageSize: 8, keyword: keyword || undefined })
  const creators = getCreators(1, 8)
  res.json({
    code: 0,
    message: 'success',
    data: {
      query: keyword,
      courses: courses.items,
      orders: orders.items,
      creators: creators.items,
    },
  })
})

app.get(['/api/admin/stats', '/api/admin/dashboard'], (_req: Request, res: Response) => {
  const courses = getCourses({ page: 1, pageSize: 1000, status: '' })
  const orders = getOrders({ page: 1, pageSize: 1000 })
  const creators = getCreators(1, 1000)
  const transactionCount = (db.prepare('SELECT COUNT(*) as count FROM transactions').get() as { count: number }).count
  res.json({
    code: 0,
    message: 'success',
    data: {
      totalCourses: courses.total,
      totalOrders: orders.total,
      totalCreators: creators.total,
      transactionCount,
      publishedCourses: courses.items.filter((item) => item.status === 'published').length,
      completedOrders: orders.items.filter((item) => item.status === 'completed').length,
    },
  })
})

app.get('/api/products', (_req: Request, res: Response) => {
  const result = getCourses({ page: 1, pageSize: 20, status: 'published' })
  res.json({ code: 0, message: 'success', data: { items: result.items, total: result.total } })
})

app.get('/api/cart', (_req: Request, res: Response) => {
  const result = getCourses({ page: 1, pageSize: 1, status: 'published' })
  const items = result.items.slice(0, 1).map((course) => ({
    id: course.id,
    name: course.title,
    price: course.price,
    quantity: 1,
  }))
  res.json({
    code: 0,
    message: 'success',
    data: {
      id: 'skillverse-demo-cart',
      items,
      total: items.reduce((sum, item) => sum + Number(item.price || 0), 0),
    },
  })
})

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
