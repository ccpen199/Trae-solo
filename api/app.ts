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

const userProfile = {
  id: 'user-1',
  username: '13800138000',
  phone: '13800138000',
  role: 'user',
  name: '安居用户',
  city: '杭州',
  stats: {
    savedHomes: 12,
    visits: 5,
    contracts: 2,
  },
}

const adminDashboard = {
  overview: {
    total_users: 2680,
    active_listings: 432,
    pending_reviews: 18,
    monthly_orders: 96,
  },
  operations: [
    { label: '房源审核', count: 18, status: '待处理' },
    { label: '租客申请', count: 32, status: '处理中' },
    { label: '合同签署', count: 14, status: '本周新增' },
  ],
  quickActions: ['房源管理', '订单管理', '用户管理', '运营数据'],
}

const listings = [
  { id: 'home-1001', title: '滨江精装两居', city: '杭州', district: '滨江', price: 5200, tags: ['近地铁', '整租', '可月付'] },
  { id: 'home-1002', title: '未来科技城人才公寓', city: '杭州', district: '余杭', price: 3600, tags: ['新房源', '通勤友好'] },
  { id: 'home-1003', title: '静安阳光一居', city: '上海', district: '静安', price: 6800, tags: ['商圈', '拎包入住'] },
]

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

const buildPlaceholderImage = (prompt: string, imageSize: string): string => {
  const label = escapeXml((prompt || '房源核验图片').slice(0, 36))
  const subtitle = escapeXml(imageSize || 'local-placeholder')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="720" viewBox="0 0 960 720">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#eef2ff"/>
      <stop offset="55%" stop-color="#dbeafe"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
  </defs>
  <rect width="960" height="720" fill="url(#bg)"/>
  <rect x="80" y="84" width="800" height="552" rx="32" fill="#ffffff" opacity="0.72"/>
  <path d="M160 506l132-142 94 98 122-146 190 190H160z" fill="#93c5fd" opacity="0.8"/>
  <circle cx="690" cy="214" r="58" fill="#bfdbfe"/>
  <text x="480" y="606" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#1e3a8a">${label}</text>
  <text x="480" y="650" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#475569">${subtitle}</text>
</svg>`
}

app.get('/api/ide/v1/text_to_image', (req: Request, res: Response): void => {
  const prompt = String(req.query.prompt || '')
  const imageSize = String(req.query.image_size || 'landscape_4_3')

  res
    .status(200)
    .type('image/svg+xml')
    .send(buildPlaceholderImage(prompt, imageSize))
})

app.get('/api/auth/me', (_req: Request, res: Response): void => {
  res.json({ success: true, data: userProfile })
})

app.get('/api/users/profile', (_req: Request, res: Response): void => {
  res.json({ success: true, data: userProfile })
})

app.get('/api/user/profile', (_req: Request, res: Response): void => {
  res.json({ success: true, data: userProfile })
})

app.get('/api/search', (req: Request, res: Response): void => {
  const keyword = String(req.query.q || req.query.keyword || '').trim()
  const items = keyword
    ? listings.filter((item) => `${item.title}${item.city}${item.district}${item.tags.join('')}`.includes(keyword))
    : listings

  res.json({
    success: true,
    data: {
      keyword,
      items,
      total: items.length,
    },
  })
})

app.get('/api/admin/dashboard', (_req: Request, res: Response): void => {
  res.json({ success: true, data: adminDashboard })
})

app.get('/api/admin/stats', (_req: Request, res: Response): void => {
  res.json({ success: true, data: adminDashboard })
})

app.get('/api/products', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: listings.map((item) => ({ ...item, name: item.title, category: 'rental', inventory: 1 })),
  })
})

app.get('/api/orders', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      items: [
        { id: 'order-7001', product: '滨江精装两居', status: '已预约', amount: 5200 },
        { id: 'order-7002', product: '人才公寓签约服务', status: '待确认', amount: 3600 },
      ],
      total: 2,
    },
  })
})

app.get('/api/cart', (_req: Request, res: Response): void => {
  res.json({ success: true, data: { items: [], total: 0 } })
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
