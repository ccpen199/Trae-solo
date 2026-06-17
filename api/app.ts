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
import servicesRoutes from './routes/services.js'
import applicationsRoutes from './routes/applications.js'
import guideRoutes from './routes/guide.js'
import certificatesRoutes from './routes/certificates.js'
import ocrRoutes from './routes/ocr.js'
import signatureRoutes from './routes/signature.js'
import adminPerformanceRoutes from './routes/admin/performance.js'
import adminSystemsRoutes from './routes/admin/systems.js'
import adminPolicyRoutes from './routes/admin/policy.js'
import {
  mockUser,
  mockServices,
  mockPolicies,
  mockPerformanceData,
  mockStatCards,
  mockSystemStatus,
  type ApiResponse,
} from './data/mockData.js'

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
app.use('/api/services', servicesRoutes)
app.use('/api/applications', applicationsRoutes)
app.use('/api/guide', guideRoutes)
app.use('/api/certificates', certificatesRoutes)
app.use('/api/ocr', ocrRoutes)
app.use('/api/signature', signatureRoutes)

app.get('/api/users/profile', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: mockUser,
    message: '获取用户资料成功',
  } as ApiResponse)
})

app.get('/api/user/profile', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: mockUser,
    message: '获取用户资料成功',
  } as ApiResponse)
})

app.get('/api/search', (req: Request, res: Response): void => {
  const keyword = String(req.query.q || req.query.keyword || '').trim().toLowerCase()
  const serviceResults = mockServices.filter(service => {
    if (!keyword) return true
    return [
      service.name,
      service.description,
      service.department,
      service.category,
      ...service.requiredMaterials.map(material => material.name),
    ].some(value => value.toLowerCase().includes(keyword))
  })
  const policyResults = mockPolicies.filter(policy => {
    if (!keyword) return true
    return [policy.title, policy.content, policy.category].some(value =>
      value.toLowerCase().includes(keyword),
    )
  })

  res.status(200).json({
    success: true,
    data: {
      keyword,
      services: serviceResults,
      policies: policyResults,
      list: [...serviceResults, ...policyResults],
      total: serviceResults.length + policyResults.length,
    },
    message: keyword ? '搜索完成' : '返回全部可搜索内容',
  } as ApiResponse)
})

app.get('/api/admin/stats', (req: Request, res: Response): void => {
  const latest = mockPerformanceData[mockPerformanceData.length - 1]
  res.status(200).json({
    success: true,
    data: {
      cards: mockStatCards,
      todayApplications: latest?.totalApplications || 0,
      todayCompleted: latest?.completedCount || 0,
      completionRate: latest?.completionRate || 0,
      averageHandlingTime: latest?.averageHandlingTime || 0,
      systemSummary: {
        total: mockSystemStatus.length,
        normal: mockSystemStatus.filter(system => system.status === 'normal').length,
        warning: mockSystemStatus.filter(system => system.status === 'warning').length,
        error: mockSystemStatus.filter(system => system.status === 'error').length,
      },
    },
    message: '获取后台统计成功',
  } as ApiResponse)
})

app.get('/api/admin/dashboard', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: {
      statCards: mockStatCards,
      performanceTrend: mockPerformanceData,
      systems: mockSystemStatus,
      topServices: [...mockServices].sort((a, b) => b.hotLevel - a.hotLevel).slice(0, 5),
      policies: mockPolicies,
    },
    message: '获取后台看板成功',
  } as ApiResponse)
})

app.use('/api/admin/performance', adminPerformanceRoutes)
app.use('/api/admin/systems', adminSystemsRoutes)
app.use('/api/admin/policy', adminPolicyRoutes)

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
