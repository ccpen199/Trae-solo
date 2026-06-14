/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/user.js'
import insuranceRoutes from './routes/insurance.js'
import paymentRoutes from './routes/payment.js'
import familyRoutes from './routes/family.js'
import benefitRoutes from './routes/benefit.js'
import calculatorRoutes from './routes/calculator.js'
import adminRoutes from './routes/admin.js'
import corsMiddleware from './middleware/cors.js'
import loggerMiddleware from './middleware/logger.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(corsMiddleware)
app.use(loggerMiddleware)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/users', userRoutes)
app.use('/api/insurance', insuranceRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/family', familyRoutes)
app.use('/api/benefit', benefitRoutes)
app.use('/api/calculator', calculatorRoutes)
app.use('/api/admin', adminRoutes)

app.get('/api/search', (req: Request, res: Response): void => {
  const keyword = String(req.query.q || req.query.keyword || '').trim()
  const sourceItems = [
    { id: 'family', title: '家庭共济账户', type: 'service', path: '/family', description: '亲属绑定、授权额度和共济使用记录' },
    { id: 'benefit', title: '待遇发放中心', type: 'service', path: '/benefit', description: '养老金发放和医保账户划拨' },
    { id: 'calculator', title: '政策计算器', type: 'tool', path: '/calculator', description: '养老待遇测算和缴费方案估算' },
    { id: 'warning', title: '异常预警', type: 'admin', path: '/admin/warning', description: '断缴情形、异常金额和疑似冒领预警' },
    { id: 'audit', title: '稽核规则', type: 'admin', path: '/admin/audit', description: '规则维护、风险等级和阈值配置' },
    { id: 'datashare', title: '数据共享', type: 'admin', path: '/admin/datashare', description: '公安、民政、卫健跨部门数据比对' },
  ]

  const normalizedKeyword = keyword.toLowerCase()
  const matchedItems = normalizedKeyword
    ? sourceItems.filter((item) =>
        `${item.title} ${item.type} ${item.description}`.toLowerCase().includes(normalizedKeyword),
      )
    : sourceItems
  const list = matchedItems.length > 0 ? matchedItems : sourceItems

  res.status(200).json({
    success: true,
    data: {
      list,
      items: list,
      total: list.length,
      keyword,
    },
    message: '搜索完成',
  })
})

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
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
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
