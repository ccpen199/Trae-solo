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
import casesRoutes from './routes/cases.js'
import materialsRoutes from './routes/materials.js'
import designersRoutes from './routes/designers.js'
import adminRoutes from './routes/admin.js'
import pdfRoutes from './routes/pdf.js'
import { mockCases, mockDesigners, mockMaterials, mockUsers } from '../src/mock/data.js'

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
app.use('/api/cases', casesRoutes)
app.use('/api/materials', materialsRoutes)
app.use('/api/designers', designersRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/pdf', pdfRoutes)

app.get('/api/search', (req: Request, res: Response): void => {
  const query = String(req.query.q || req.query.keyword || '').trim().toLowerCase()
  const matches = [
    ...mockCases.map((item) => ({ type: 'case', item })),
    ...mockDesigners.map((item) => ({ type: 'designer', item })),
    ...mockMaterials.map((item) => ({ type: 'material', item })),
  ].filter(({ item }) => !query || JSON.stringify(item).toLowerCase().includes(query))

  res.status(200).json({
    success: true,
    query,
    data: {
      total: matches.length,
      items: matches.slice(0, 20),
    },
  })
})

app.get(['/api/users/profile', '/api/user/profile'], (_req: Request, res: Response): void => {
  const user = mockUsers[0] || {
    id: 'user-demo',
    phone: '13800138001',
    nickname: '演示用户',
    role: 'user',
  }

  res.status(200).json({
    success: true,
    data: user,
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
