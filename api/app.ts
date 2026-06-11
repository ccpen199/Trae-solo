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
import projectsRoutes from './routes/projects.js'
import franchiseesRoutes from './routes/franchisees.js'
import riskRoutes from './routes/risk.js'
import contractsRoutes from './routes/contracts.js'
import disputesRoutes from './routes/disputes.js'
import db from './db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:49100'

app.use(cors({
  origin: [FRONTEND_URL],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/projects', projectsRoutes)
app.use('/api/franchisees', franchiseesRoutes)
app.use('/api/risk', riskRoutes)
app.use('/api/contracts', contractsRoutes)
app.use('/api/disputes', disputesRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.get('/api/search', (req: Request, res: Response) => {
  const keyword = `%${String(req.query.q || req.query.keyword || '')}%`
  const list = db.prepare(`
    SELECT id, name, industry, category, investment_min, investment_max, status, city
    FROM projects
    WHERE name LIKE ? OR industry LIKE ? OR category LIKE ? OR city LIKE ?
    ORDER BY id DESC
    LIMIT 12
  `).all(keyword, keyword, keyword, keyword)
  res.json({ success: true, data: { list, total: list.length } })
})

app.get(['/api/users/profile', '/api/user/profile'], (req: Request, res: Response) => {
  const user = db.prepare('SELECT id, phone, role, name, avatar, status, created_at FROM users WHERE phone = ?').get('13800000000')
  res.json({ success: true, data: user })
})

app.get(['/api/admin/stats', '/api/admin/dashboard'], (req: Request, res: Response) => {
  const stats = {
    users: db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number },
    projects: db.prepare('SELECT COUNT(*) AS count FROM projects').get() as { count: number },
    contracts: db.prepare('SELECT COUNT(*) AS count FROM contract_templates').get() as { count: number },
    disputes: db.prepare('SELECT COUNT(*) AS count FROM dispute_tickets').get() as { count: number },
  }
  res.json({
    success: true,
    data: {
      users: stats.users.count,
      projects: stats.projects.count,
      contracts: stats.contracts.count,
      disputes: stats.disputes.count,
    },
  })
})

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
