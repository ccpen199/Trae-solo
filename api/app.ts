import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

const FRONTEND_PORT = process.env.FRONTEND_PORT || '49052'
const BACKEND_PORT = process.env.BACKEND_PORT || '59052'

const app: express.Application = express()

app.use(cors({
  origin: [`http://127.0.0.1:${FRONTEND_PORT}`, `http://localhost:${FRONTEND_PORT}`],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

import authRoutes from './routes/auth.js'
import enterpriseRoutes from './routes/enterprise.js'
import serviceRoutes from './routes/service.js'
import policyRoutes from './routes/policy.js'
import appealRoutes from './routes/appeal.js'
import creditRoutes from './routes/credit.js'
import biddingRoutes from './routes/bidding.js'
import supplyChainRoutes from './routes/supply-chain.js'
import materialRoutes from './routes/material.js'
import financeRoutes from './routes/finance.js'
import guideRoutes from './routes/guide.js'
import dashboardRoutes from './routes/dashboard.js'
import db, { initDatabase } from './db.js'

initDatabase()

const dateOnly = (value: unknown, fallback = '2024-01-01') =>
  String(value || fallback).slice(0, 10)

const moneyWan = (value: unknown) => {
  const amount = Number(value || 0)
  if (!Number.isFinite(amount)) return String(value || '0万元')
  return `${amount.toLocaleString('zh-CN')}万元`
}

const cityFromAddress = (value: unknown) => {
  const text = String(value || '')
  return text.match(/(广州市|深圳市|佛山市|东莞市|惠州市|珠海市|中山市|江门市|汕头市|肇庆市|湛江市|清远市|阳江市|茂名市)/)?.[1] || '广东省'
}

const enterpriseScale = (capital: unknown) => {
  const amount = Number(capital || 0)
  if (amount >= 5000000) return '大型'
  if (amount >= 1000000) return '中型'
  if (amount > 0) return '小型'
  return '微型'
}

const serviceStatus = (status: unknown) => {
  const value = String(status || 'active')
  if (value === 'active') return 'active'
  if (value === 'inactive') return 'inactive'
  return 'pending'
}

const appealStatus = (status: unknown) => {
  const value = String(status || 'pending')
  if (['pending', 'processing', 'resolved', 'rejected'].includes(value)) return value
  if (value === 'closed' || value === 'completed') return 'resolved'
  return 'pending'
}

const applicationStatus = (status: unknown) => {
  const value = String(status || 'pending')
  if (value === 'completed' || value === 'approved') return 'approved'
  if (value === 'reviewing' || value === 'processing') return 'processing'
  if (value === 'rejected') return 'rejected'
  return 'pending'
}

const policyStatus = (status: unknown, validTo: unknown) => {
  if (String(status || '') === 'draft') return 'draft'
  const until = Date.parse(String(validTo || ''))
  if (Number.isFinite(until) && until < Date.now()) return 'expired'
  return 'active'
}

const queryAll = (sql: string, ...params: unknown[]) =>
  db.prepare(sql).all(...params) as any[]

const queryOne = (sql: string, ...params: unknown[]) =>
  db.prepare(sql).get(...params) as any

app.get('/api/auth/me', (_req: Request, res: Response): void => {
  const user = queryOne('SELECT id, username, name, role, enterprise_id, created_at FROM users ORDER BY id LIMIT 1')
  res.json({ success: true, data: user || { username: 'admin', name: '系统管理员', role: 'admin' } })
})

app.get(['/api/user/profile', '/api/users/profile'], (_req: Request, res: Response): void => {
  const user = queryOne('SELECT id, username, name, role, enterprise_id, created_at FROM users ORDER BY id LIMIT 1')
  res.json({ success: true, user: user || { username: 'admin', name: '系统管理员', role: 'admin' } })
})

app.get('/api/dashboard/stats', (_req: Request, res: Response): void => {
  res.json({
    totalEnterprises: queryOne('SELECT COUNT(*) AS count FROM enterprises').count,
    serviceApplications: queryOne('SELECT COUNT(*) AS count FROM service_applications').count,
    activePolicies: queryOne("SELECT COUNT(*) AS count FROM policies WHERE status = 'active'").count,
    pendingAppeals: queryOne("SELECT COUNT(*) AS count FROM appeals WHERE status IN ('pending', 'processing')").count,
    creditReports: queryOne('SELECT COUNT(*) AS count FROM credit_records').count,
    biddingProjects: queryOne("SELECT COUNT(*) AS count FROM bidding_projects WHERE status IN ('open', 'active')").count,
  })
})

app.get('/api/dashboard/recent-applications', (_req: Request, res: Response): void => {
  const rows = queryAll(`
    SELECT sa.id, sa.status, sa.submitted_at, sa.submitted_at AS created_at, e.name AS enterprise_name, si.name AS service_name
    FROM service_applications sa
    LEFT JOIN enterprises e ON e.id = sa.enterprise_id
    LEFT JOIN service_items si ON si.id = sa.service_id
    ORDER BY sa.submitted_at DESC
    LIMIT 8
  `)
  res.json(rows.map((row) => ({
    id: String(row.id),
    enterpriseName: row.enterprise_name || '示例企业',
    serviceName: row.service_name || '综合政务服务',
    submitDate: dateOnly(row.submitted_at || row.created_at),
    status: applicationStatus(row.status),
  })))
})

app.get('/api/dashboard/recent-appeals', (_req: Request, res: Response): void => {
  const rows = queryAll(`
    SELECT a.id, a.title, a.status, a.created_at, e.name AS enterprise_name
    FROM appeals a
    LEFT JOIN enterprises e ON e.id = a.enterprise_id
    ORDER BY a.id DESC
    LIMIT 8
  `)
  res.json(rows.map((row) => ({
    id: String(row.id),
    title: row.title || '企业诉求',
    enterpriseName: row.enterprise_name || '示例企业',
    submitDate: dateOnly(row.created_at),
    status: appealStatus(row.status),
  })))
})

app.get('/api/enterprises', (_req: Request, res: Response): void => {
  const rows = queryAll('SELECT * FROM enterprises ORDER BY id DESC LIMIT 80')
  res.json(rows.map((row) => ({
    id: String(row.id),
    name: row.name,
    creditCode: row.unified_code || row.registration_number || `GD${row.id}`.padEnd(18, '0'),
    industry: row.industry || '综合服务',
    scale: enterpriseScale(row.registered_capital),
    region: cityFromAddress(row.address),
    status: row.status === 'active' ? 'active' : row.status === 'inactive' ? 'inactive' : 'pending',
    registerDate: dateOnly(row.established_date || row.created_at),
  })))
})

app.get('/api/services', (_req: Request, res: Response): void => {
  const rows = queryAll(`
    SELECT si.*, d.name AS department_name,
      (SELECT COUNT(*) FROM service_applications sa WHERE sa.service_id = si.id) AS application_count
    FROM service_items si
    LEFT JOIN departments d ON d.id = si.department_id
    ORDER BY si.id DESC
    LIMIT 80
  `)
  res.json(rows.map((row) => ({
    id: String(row.id),
    name: row.name,
    category: row.category,
    department: row.department_name || '政务服务中心',
    handlingTime: `${row.processing_days || 15}个工作日`,
    applicationCount: row.application_count || 0,
    status: serviceStatus(row.status),
  })))
})

app.get('/api/services/applications', (_req: Request, res: Response): void => {
  const rows = queryAll(`
    SELECT sa.*, e.name AS enterprise_name, si.name AS service_name
    FROM service_applications sa
    LEFT JOIN enterprises e ON e.id = sa.enterprise_id
    LEFT JOIN service_items si ON si.id = sa.service_id
    ORDER BY sa.submitted_at DESC
    LIMIT 80
  `)
  res.json(rows.map((row) => ({
    id: String(row.id),
    serviceName: row.service_name || '综合政务服务',
    enterpriseName: row.enterprise_name || '示例企业',
    submitDate: dateOnly(row.submitted_at || row.created_at),
    status: applicationStatus(row.status),
  })))
})

app.get('/api/policies', (_req: Request, res: Response): void => {
  const rows = queryAll(`
    SELECT p.*, d.name AS department_name
    FROM policies p
    LEFT JOIN departments d ON d.id = p.department_id
    ORDER BY p.start_date DESC, p.id DESC
    LIMIT 80
  `)
  res.json(rows.map((row) => ({
    id: String(row.id),
    title: row.title,
    category: row.category,
    department: row.department_name || '政策服务中心',
    publishDate: dateOnly(row.valid_from || row.start_date),
    validUntil: dateOnly(row.valid_to || row.end_date, '2026-12-31'),
    status: policyStatus(row.status, row.valid_to || row.end_date),
  })))
})

app.get('/api/appeals', (_req: Request, res: Response): void => {
  const rows = queryAll(`
    SELECT a.*, e.name AS enterprise_name
    FROM appeals a
    LEFT JOIN enterprises e ON e.id = a.enterprise_id
    ORDER BY a.id DESC
    LIMIT 80
  `)
  res.json(rows.map((row) => ({
    id: String(row.id),
    title: row.title,
    enterpriseName: row.enterprise_name || '示例企业',
    type: row.type || '办事咨询',
    submitDate: dateOnly(row.created_at),
    status: appealStatus(row.status),
    priority: row.priority === 'high' ? 'high' : row.priority === 'low' ? 'low' : 'medium',
  })))
})

app.get('/api/credit', (_req: Request, res: Response): void => {
  const rows = queryAll(`
    SELECT cr.enterprise_id, e.name AS enterprise_name, e.unified_code, AVG(cr.score) AS score,
      MAX(cr.level) AS level, MAX(cr.record_date) AS updated_at, COUNT(*) AS report_count
    FROM credit_records cr
    LEFT JOIN enterprises e ON e.id = cr.enterprise_id
    GROUP BY cr.enterprise_id
    ORDER BY score DESC
    LIMIT 80
  `)
  res.json(rows.map((row) => {
    const score = Math.round(Number(row.score || 80))
    return {
      id: String(row.enterprise_id),
      enterpriseName: row.enterprise_name || '示例企业',
      creditCode: row.unified_code || `GD${row.enterprise_id}`.padEnd(18, '0'),
      creditScore: score,
      creditLevel: row.level || (score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 60 ? 'C' : 'D'),
      reportCount: row.report_count || 0,
      lastUpdate: dateOnly(row.updated_at),
      status: score >= 80 ? 'active' : score >= 60 ? 'warning' : 'abnormal',
    }
  }))
})

app.get('/api/bidding', (_req: Request, res: Response): void => {
  const rows = queryAll(`
    SELECT bp.*, d.name AS department_name,
      (SELECT COUNT(*) FROM bidding_applications ba WHERE ba.bidding_project_id = bp.id) AS bid_count
    FROM bidding_projects bp
    LEFT JOIN departments d ON d.id = bp.department_id
    ORDER BY bp.publish_date DESC, bp.id DESC
    LIMIT 80
  `)
  res.json(rows.map((row) => ({
    id: String(row.id),
    title: row.title,
    category: row.type || '服务采购',
    budget: moneyWan(row.budget),
    region: row.region || cityFromAddress(row.department_name),
    bidDeadline: dateOnly(row.deadline_date || row.deadline, '2026-12-31'),
    publishDate: dateOnly(row.publish_date),
    status: row.status === 'closed' ? 'closed' : row.status === 'pending' ? 'pending' : 'active',
    bidCount: row.bid_count || 0,
  })))
})

app.get('/api/supply-chain/partners', (_req: Request, res: Response): void => {
  const rows = queryAll(`
    SELECT e.id, e.name, e.industry, e.address, e.status,
      COUNT(sc.id) AS cooperation_count
    FROM enterprises e
    LEFT JOIN supply_chain sc ON sc.enterprise_id = e.id
    GROUP BY e.id
    ORDER BY cooperation_count DESC, e.id DESC
    LIMIT 60
  `)
  const types = ['supplier', 'buyer', 'logistics', 'finance']
  res.json(rows.map((row, index) => ({
    id: String(row.id),
    enterpriseName: row.name,
    industry: row.industry || '综合服务',
    type: types[index % types.length],
    region: cityFromAddress(row.address),
    cooperationCount: Number(row.cooperation_count || 0) + 20 + index,
    rating: Number((4.5 + ((index % 5) * 0.08)).toFixed(1)),
    status: row.status === 'active' ? 'active' : 'pending',
  })))
})

app.get('/api/supply-chain/demands', (_req: Request, res: Response): void => {
  const rows = queryAll(`
    SELECT sc.*, e.name AS enterprise_name
    FROM supply_chain sc
    LEFT JOIN enterprises e ON e.id = sc.enterprise_id
    ORDER BY sc.id DESC
    LIMIT 80
  `)
  res.json(rows.map((row) => ({
    id: String(row.id),
    title: `${row.direction === 'supply' ? '供应' : '采购'}${row.product}`,
    enterpriseName: row.enterprise_name || '示例企业',
    category: row.product || '综合物资',
    quantity: row.quantity || '年度合同',
    deadline: dateOnly(row.created_at, '2026-12-31'),
    status: row.status === 'active' ? 'open' : row.status === 'matched' ? 'matched' : 'closed',
    publishDate: dateOnly(row.created_at),
  })))
})

app.get('/api/materials', (_req: Request, res: Response): void => {
  const rows = queryAll(`
    SELECT m.*, e.name AS enterprise_name
    FROM materials m
    LEFT JOIN enterprises e ON e.id = m.enterprise_id
    ORDER BY m.id DESC
    LIMIT 80
  `)
  res.json(rows.map((row, index) => ({
    id: String(row.id),
    name: row.name,
    category: row.category,
    format: String(row.file_path || row.name || '').split('.').pop()?.toUpperCase() || 'PDF',
    size: `${(1.2 + (index % 5) * 0.6).toFixed(1)}MB`,
    uploader: row.department || '政务服务中心',
    uploadDate: dateOnly(row.upload_date || row.created_at),
    usageCount: 100 + index * 37,
    status: row.verified ? 'active' : 'pending',
    departments: String(row.share_scope || row.department || '市场监管局,税务局,科技厅').split(/[,，、]/).filter(Boolean),
  })))
})

app.get('/api/finance/products', (_req: Request, res: Response): void => {
  const rows = queryAll('SELECT * FROM finance_products ORDER BY id DESC LIMIT 80')
  const types = ['loan', 'guarantee', 'equity', 'insurance']
  res.json(rows.map((row, index) => ({
    id: String(row.id),
    name: row.product_name || row.name,
    type: row.type || types[index % types.length],
    institution: row.institution_name || row.institution,
    maxAmount: row.amount_range || moneyWan(row.amount_max),
    interestRate: row.rate_range || (row.rate_min ? `${row.rate_min}-${row.rate_max || row.rate_min}%/年` : '综合费率'),
    term: row.term_range || `${row.term_min || 6}-${row.term_max || 36}个月`,
    applyCount: 120 + index * 43,
    status: row.status === 'active' ? 'active' : 'inactive',
    rating: Number((4.6 + (index % 4) * 0.08).toFixed(1)),
  })))
})

app.get('/api/finance/applications', (_req: Request, res: Response): void => {
  const rows = queryAll(`
    SELECT fa.*, fp.name AS product_name, e.name AS enterprise_name
    FROM finance_applications fa
    LEFT JOIN finance_products fp ON fp.id = fa.finance_product_id
    LEFT JOIN enterprises e ON e.id = fa.enterprise_id
    ORDER BY fa.applied_at DESC
    LIMIT 80
  `)
  res.json(rows.map((row) => ({
    id: String(row.id),
    productName: row.product_name || '金融产品',
    enterpriseName: row.enterprise_name || '示例企业',
    applyAmount: moneyWan(row.amount),
    applyDate: dateOnly(row.applied_at),
    status: applicationStatus(row.status),
    progress: row.status === 'approved' ? 100 : row.status === 'reviewing' ? 65 : row.status === 'rejected' ? 0 : 25,
  })))
})

app.get('/api/search', (req: Request, res: Response): void => {
  const keyword = String(req.query.q || req.query.keyword || '').trim()
  const like = `%${keyword}%`
  const enterprises = queryAll('SELECT id, name, industry FROM enterprises WHERE ? = ? OR name LIKE ? OR industry LIKE ? LIMIT 8', keyword, '', like, like)
  const services = queryAll('SELECT id, name, category FROM service_items WHERE ? = ? OR name LIKE ? OR category LIKE ? LIMIT 8', keyword, '', like, like)
  const policies = queryAll('SELECT id, title, category FROM policies WHERE ? = ? OR title LIKE ? OR category LIKE ? LIMIT 8', keyword, '', like, like)
  res.json({ success: true, query: keyword, total: enterprises.length + services.length + policies.length, results: { enterprises, services, policies } })
})

app.get('/api/products', (_req: Request, res: Response): void => {
  const products = queryAll('SELECT id, name, category, processing_days FROM service_items ORDER BY id DESC LIMIT 10')
  res.json({ products: products.map((item) => ({ id: item.id, name: item.name, category: item.category, price: item.processing_days || 15, stock: 999 })) })
})

app.get('/api/cart', (_req: Request, res: Response): void => {
  res.json({ items: [{ id: 'demo-service', name: '企业综合服务包', quantity: 1, price: 0 }], total: 0, checkoutReady: true })
})

app.get('/api/orders', (_req: Request, res: Response): void => {
  const list = queryAll(`
    SELECT sa.id, si.name AS title, e.name AS enterprise_name, sa.status, sa.submitted_at AS created_at
    FROM service_applications sa
    LEFT JOIN service_items si ON si.id = sa.service_id
    LEFT JOIN enterprises e ON e.id = sa.enterprise_id
    ORDER BY sa.submitted_at DESC
    LIMIT 20
  `)
  res.json({ list, total: list.length })
})

app.use('/api/auth', authRoutes)
app.use('/api/enterprises', enterpriseRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/policies', policyRoutes)
app.use('/api/appeals', appealRoutes)
app.use('/api/credit', creditRoutes)
app.use('/api/bidding', biddingRoutes)
app.use('/api/supply-chain', supplyChainRoutes)
app.use('/api/materials', materialRoutes)
app.use('/api/finance', financeRoutes)
app.use('/api/guide', guideRoutes)
app.use('/api/dashboard', dashboardRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
      timestamp: new Date().toISOString(),
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', error)
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
