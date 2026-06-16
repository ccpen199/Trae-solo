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
import identityRoutes from './routes/identity.js'
import transportationRoutes from './routes/transportation.js'
import medicalRoutes from './routes/medical.js'
import educationRoutes from './routes/education.js'
import urbanRoutes from './routes/urban.js'
import governmentRoutes from './routes/government.js'
import { mockAtomicServices, mockPolicies, mockTickets, mockUsers } from './data/mockData.js'

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
app.use('/api/identity', identityRoutes)
app.use('/api/transportation', transportationRoutes)
app.use('/api/medical', medicalRoutes)
app.use('/api/education', educationRoutes)
app.use('/api/urban', urbanRoutes)
app.use('/api/government', governmentRoutes)
app.use('/api/dashboard', urbanRoutes)

app.get('/api/search', (req: Request, res: Response): void => {
  const query = String(req.query.q || req.query.keyword || '').trim().toLowerCase()
  const sourceItems = [
    ...mockPolicies.map((item) => ({ type: 'policy', title: item.title, summary: item.content, item })),
    ...mockTickets.map((item) => ({ type: 'ticket', title: item.title, summary: item.content, item })),
    ...mockAtomicServices.map((item) => ({ type: 'service', title: item.name, summary: item.description, item })),
  ]
  const items = sourceItems.filter((entry) => {
    const haystack = `${entry.title} ${entry.summary} ${JSON.stringify(entry.item)}`.toLowerCase()
    return !query || haystack.includes(query)
  })

  res.status(200).json({
    code: 200,
    success: true,
    message: '搜索成功',
    data: {
      query,
      total: items.length,
      items: items.slice(0, 20),
    },
    timestamp: Date.now(),
  })
})

app.get(['/api/admin/stats', '/api/admin/dashboard'], (_req: Request, res: Response): void => {
  const openTickets = mockTickets.filter((ticket) => ticket.status !== 'closed' && ticket.status !== 'resolved')
  const activeServices = mockAtomicServices.filter((service) => service.isActive)

  res.status(200).json({
    code: 200,
    success: true,
    message: '获取成功',
    data: {
      users: mockUsers.length,
      policies: mockPolicies.length,
      tickets: mockTickets.length,
      openTickets: openTickets.length,
      atomicServices: mockAtomicServices.length,
      activeServices: activeServices.length,
      categories: {
        transportation: mockTickets.filter((ticket) => ticket.category === 'transportation').length,
        medical: mockTickets.filter((ticket) => ticket.category === 'medical').length,
        education: mockTickets.filter((ticket) => ticket.category === 'education').length,
        government: mockTickets.filter((ticket) => ticket.category === 'government').length,
        urbanManagement: mockTickets.filter((ticket) => ticket.category === 'urban_management').length,
      },
    },
    timestamp: Date.now(),
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
