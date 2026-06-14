import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import db from './db.js'
import authRoutes from './routes/auth.js'
import taskRoutes from './routes/tasks.js'
import userRoutes from './routes/user.js'
import adminRoutes from './routes/admin.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`)
  })
  next()
})

app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/user', userRoutes)
app.use('/api/admin', adminRoutes)

const publicUserProfile = () => {
  const user = db.prepare('SELECT * FROM users ORDER BY created_at ASC LIMIT 1').get() as any
  if (!user) return null

  const published = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE publisher_id = ?').get(user.id) as { count: number }
  const accepted = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE assignee_id = ?').get(user.id) as { count: number }
  const completed = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE assignee_id = ? AND status = 'completed'").get(user.id) as { count: number }

  return {
    id: user.id,
    phone: user.phone,
    email: user.email,
    nickname: user.nickname,
    avatar: user.avatar,
    credit_score: user.credit_score,
    credit_level: user.credit_level,
    help_coins: user.help_coins,
    is_verifier: user.is_verifier,
    created_at: user.created_at,
    stats: {
      published: published.count,
      accepted: accepted.count,
      completed: completed.count,
      published_count: published.count,
      accepted_count: accepted.count,
      completed_count: completed.count,
    },
  }
}

app.get('/api/auth/me', (_req: Request, res: Response): void => {
  const profile = publicUserProfile()
  if (!profile) {
    res.status(404).json({ success: false, error: '用户不存在' })
    return
  }
  res.json({ success: true, data: profile })
})

app.get('/api/users/profile', (_req: Request, res: Response): void => {
  const profile = publicUserProfile()
  if (!profile) {
    res.status(404).json({ success: false, error: '用户不存在' })
    return
  }
  res.json({ success: true, data: profile })
})

app.get('/api/user/profile', (_req: Request, res: Response): void => {
  const profile = publicUserProfile()
  if (!profile) {
    res.status(404).json({ success: false, error: '用户不存在' })
    return
  }
  res.json({ success: true, data: profile })
})

app.get('/api/search', (req: Request, res: Response): void => {
  const keyword = String(req.query.q || req.query.keyword || '').trim()
  const like = `%${keyword}%`
  const tasks = db.prepare(`
    SELECT t.*, u.nickname as publisher_nickname, u.credit_level as publisher_credit_level
    FROM tasks t
    JOIN users u ON t.publisher_id = u.id
    WHERE ? = '' OR t.title LIKE ? OR t.description LIKE ? OR t.tags LIKE ?
    ORDER BY t.view_count DESC, t.created_at DESC
    LIMIT 20
  `).all(keyword, like, like, like) as any[]

  res.json({
    success: true,
    data: {
      keyword,
      items: tasks.map((task) => ({
        ...task,
        tags: JSON.parse(task.tags || '[]'),
        geo_fence: JSON.parse(task.geo_fence || '{}'),
        verify_rules: JSON.parse(task.verify_rules || '[]'),
      })),
    },
  })
})

app.get('/api/admin/dashboard', (_req: Request, res: Response): void => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  const totalTasks = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number }
  const unresolvedRisks = db.prepare('SELECT COUNT(*) as count FROM risk_alerts WHERE resolved = FALSE').get() as { count: number }
  const recentAlerts = db.prepare(`
    SELECT ra.*, t.title as task_title, u.nickname as user_nickname
    FROM risk_alerts ra
    LEFT JOIN tasks t ON ra.task_id = t.id
    LEFT JOIN users u ON ra.user_id = u.id
    ORDER BY ra.created_at DESC
    LIMIT 8
  `).all()

  res.json({
    success: true,
    data: {
      overview: {
        total_users: totalUsers.count,
        total_tasks: totalTasks.count,
        unresolved_risks: unresolvedRisks.count,
      },
      alerts: recentAlerts,
      quickActions: ['risk-review', 'credit-model-train', 'task-audit'],
    },
  })
})

app.get('/api/admin/stats', (_req: Request, res: Response): void => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  const totalTasks = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number }
  const unresolvedRisks = db.prepare('SELECT COUNT(*) as count FROM risk_alerts WHERE resolved = FALSE').get() as { count: number }
  res.json({
    success: true,
    data: {
      overview: {
        total_users: totalUsers.count,
        total_tasks: totalTasks.count,
        unresolved_risks: unresolvedRisks.count,
      },
      modules: ['任务审核', '用户管理', '风控预警', '订单管理'],
    },
  })
})

app.get('/api/products', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: [
      { id: 'benefit-exposure-1', name: '任务曝光券', price: 30, category: 'exposure' },
      { id: 'benefit-coupon-1', name: '服务优惠券', price: 50, category: 'coupon' },
      { id: 'benefit-priority-1', name: '优先撮合权益', price: 80, category: 'privilege' },
    ],
  })
})

app.get('/api/cart', (_req: Request, res: Response): void => {
  res.json({ success: true, data: { items: [], total: 0 } })
})

app.get('/api/orders', (_req: Request, res: Response): void => {
  const transactions = db.prepare(`
    SELECT ct.*, u.nickname as user_nickname, t.title as task_title
    FROM coin_transactions ct
    JOIN users u ON ct.user_id = u.id
    LEFT JOIN tasks t ON ct.task_id = t.id
    ORDER BY ct.created_at DESC
    LIMIT 20
  `).all()
  res.json({ success: true, data: { items: transactions, total: transactions.length } })
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
  console.error('Server error:', error.message)
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
