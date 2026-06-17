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
const frontendUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:49222'
const backendUrl = process.env.BACKEND_URL || `http://${process.env.BACKEND_HOST || '127.0.0.1'}:${process.env.BACKEND_PORT || process.env.PORT || 59222}`

const owners = [
  { id: 'o001', name: '张明华', building: '1号楼', room: '101', verifyStatus: 'verified' },
  { id: 'o046', name: '刘静', building: '4号楼', room: '1202', verifyStatus: 'pending' },
  { id: 'o047', name: '王磊', building: '4号楼', room: '1301', verifyStatus: 'pending' },
]

const motions = [
  { id: 'm001', title: '关于更换小区物业公司的议案', status: 'voting', votedCount: 856, totalVoters: 1200 },
  { id: 'm002', title: '小区公共区域改造工程预算方案', status: 'publicity', votedCount: 0, totalVoters: 1200 },
]

const tickets = [
  { id: 't001', title: '电梯异响', status: 'processing', priority: 'high', owner: '业主15' },
  { id: 't002', title: '小区路灯不亮', status: 'supervised', priority: 'high', owner: '业主22' },
  { id: 't003', title: '楼道感应灯损坏', status: 'pending_assign', priority: 'medium', owner: '业主31' },
]

const invoices = [
  { id: 'inv001', invoiceNo: '3100261130', vendor: '五金建材', amount: 85000, verified: false },
  { id: 'inv002', invoiceNo: '3100261131', vendor: '电梯维保', amount: 185000, verified: true },
]

const sealApplications = [
  { id: 'seal001', applicantName: '李建国', reason: '签订物业合同', sealType: 'official', status: 'pending' },
  { id: 'seal002', applicantName: '王芳', reason: '银行账户变更', sealType: 'finance', status: 'approved' },
]

app.use(cors({
  origin: frontendUrl,
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)

app.get('/api/dashboard/summary', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      service: 'community-governance-platform',
      ownerCount: 1200,
      activeCouncilMembers: 7,
      activeTickets: 18,
      monthlyBalance: 433000,
      modules: ['业主认证', '民主议事', '财务透明', '物业协同', '街道督办'],
      updatedAt: new Date().toISOString(),
    },
  })
})

app.get(['/api/admin/stats', '/api/admin/dashboard'], (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      ownerCount: 1200,
      verifiedOwners: 1147,
      pendingOwners: owners.filter((item) => item.verifyStatus === 'pending').length,
      councilMembers: 7,
      propertyCompanies: 1,
      streetSupervisionItems: 2,
      openTickets: tickets.filter((item) => item.status !== 'completed').length,
      pendingInvoices: invoices.filter((item) => !item.verified).length,
      pendingSealApplications: sealApplications.filter((item) => item.status === 'pending').length,
    },
  })
})

app.get('/api/auth/me', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      id: 'u001',
      name: '张明华',
      role: 'council_director',
      permissions: ['dashboard.read', 'motions.manage', 'finance.audit', 'owners.manage'],
    },
  })
})

app.get('/api/council/motions', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: motions,
  })
})

app.get('/api/admin/owners', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: owners,
  })
})

app.get('/api/finance/summary', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      totalIncome: 1856000,
      totalExpense: 1423000,
      balance: 433000,
      pendingInvoices: invoices.filter((item) => !item.verified).length,
      invoices,
    },
  })
})

app.get('/api/seal/applications', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: sealApplications,
  })
})

app.get('/api/property/tickets', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: tickets,
  })
})

app.get('/api/modules', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: [
      { path: '/dashboard', label: '工作台', status: 'ready' },
      { path: '/council/motions', label: '民主议事', status: 'ready' },
      { path: '/finance/overview', label: '财务透明', status: 'ready' },
      { path: '/seal/applications', label: '印章管控', status: 'ready' },
      { path: '/property/tickets', label: '物业协同', status: 'ready' },
      { path: '/admin/owners', label: '后台管理', status: 'ready' },
    ],
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
      service: 'community-governance-platform',
      frontendUrl,
      backendUrl,
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
