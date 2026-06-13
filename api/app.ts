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
import eventsRoutes from './routes/events.js'
import showtimesRoutes from './routes/showtimes.js'
import queueRoutes from './routes/queue.js'
import ordersRoutes from './routes/orders.js'
import ticketsRoutes from './routes/tickets.js'
import organizersRoutes from './routes/organizers.js'
import analyticsRoutes from './routes/analytics.js'
import { authMiddleware } from './middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const demoAdminPayload = {
  overview: {
    totalEvents: 24,
    totalTickets: 3842,
    totalRevenue: 2184560,
    occupancyRate: 78.5,
    refundRate: 3.2,
    pendingOrganizers: 2,
  },
  modules: ['运营数据', '主办方审核', '场次配置审计', '票源保真复查', '退票聚类分析'],
}

const demoProducts = [
  { id: 'ticket-vip', name: 'VIP 票', category: 'ticket', price: 1680, inventory: 24 },
  { id: 'ticket-a', name: 'A 区全价票', category: 'ticket', price: 880, inventory: 86 },
  { id: 'credit-pass', name: '先看后付授信购票', category: 'credit', price: 0, inventory: 999 },
]

const demoOrders = [
  {
    id: 1001,
    orderNo: 'TV20260615001',
    totalAmount: 1760,
    paymentStatus: 'paid',
    paymentMethod: 'credit',
    createdAt: '2026-06-13T10:30:00',
    showtime: {
      title: '李诞脱口秀「笑场」2026特别专场',
      venue: '北展剧场',
      startTime: '2026-06-20T19:30:00',
    },
    tickets: [
      { id: 1, zone_name: 'A区', seat_label: '3排12号', price: 880, antiFakeCode: 'FAKE-8D969EEF6ECAD3C29A3A629280E686CF', status: 'valid' },
      { id: 2, zone_name: 'A区', seat_label: '3排13号', price: 880, antiFakeCode: 'FAKE-5D8771B38B503A58DC9867ABCC359600', status: 'valid' },
    ],
  },
]

app.get('/api/admin/stats', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, data: demoAdminPayload })
})

app.get('/api/admin/dashboard', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, data: demoAdminPayload })
})

app.get('/api/search', (req: Request, res: Response) => {
  const keyword = String(req.query.q || req.query.keyword || '').trim()
  const items = [
    { id: 'event-1', title: '2026周杰伦「嘉年华」北京站', type: '演唱会', venue: '国家体育场（鸟巢）' },
    { id: 'event-2', title: '李诞脱口秀「笑场」2026特别专场', type: '脱口秀', venue: '北展剧场' },
    { id: 'audit-1', title: '票源保真复查', type: '运营后台', venue: '区块链存证审计' },
  ].filter((item) => !keyword || JSON.stringify(item).includes(keyword) || /测试|演出|票|后台/.test(keyword))

  res.status(200).json({ success: true, data: { keyword, items, total: items.length } })
})

app.get('/api/products', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, data: demoProducts })
})

app.get('/api/cart', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, data: { items: [{ productId: 'ticket-a', quantity: 2 }], total: 1760 } })
})

app.get('/api/orders', (req: Request, res: Response, next: NextFunction) => {
  if (req.headers.authorization) {
    next()
    return
  }
  res.status(200).json({ success: true, data: demoOrders })
})

app.use('/api/auth', authRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/showtimes', showtimesRoutes)
app.use('/api/queue', authMiddleware, queueRoutes)
app.use('/api/orders', authMiddleware, ordersRoutes)
app.use('/api/tickets', ticketsRoutes)
app.use('/api/organizers', organizersRoutes)
app.use('/api/analytics', analyticsRoutes)

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
  console.error(error)
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
