import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import db, { initDB } from './db.js'
import { authMiddleware } from './auth.js'
import authRoutes from './routes/auth.js'
import taxpayerRoutes from './routes/taxpayers.js'
import taxTypeRoutes from './routes/taxTypes.js'
import declarationRoutes from './routes/declarations.js'
import paymentRoutes from './routes/payments.js'
import invoiceRoutes from './routes/invoices.js'
import certificateRoutes from './routes/certificates.js'
import policyRoutes from './routes/policies.js'
import ticketRoutes from './routes/tickets.js'
import accountRoutes from './routes/account.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

initDB()

const app: express.Application = express()

const BACKEND_PORT = process.env.BACKEND_PORT || '59049'
const FRONTEND_PORT = process.env.FRONTEND_PORT || '49049'

app.use(cors({
  origin: [`http://127.0.0.1:${FRONTEND_PORT}`, `http://localhost:${FRONTEND_PORT}`],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const uploadsDir = path.resolve(__dirname, '..', 'uploads')
app.use('/uploads', express.static(uploadsDir))

app.use('/api/auth', authRoutes)
app.use('/api/taxpayers', taxpayerRoutes)
app.use('/api/tax-types', taxTypeRoutes)
app.use('/api/declarations', declarationRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/certificates', certificateRoutes)
app.use('/api/policies', policyRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/account', accountRoutes)

app.get('/api/users/profile', authMiddleware, (req: Request, res: Response): void => {
  const user = db.prepare('SELECT id, username, role, real_name, id_number, phone, digital_cert, created_at FROM users WHERE id = ?').get((req as any).user.id) as any
  if (!user) {
    res.status(404).json({ success: false, error: '用户不存在' })
    return
  }
  const taxpayers = db.prepare('SELECT * FROM taxpayers WHERE user_id = ?').all(user.id)
  res.json({ success: true, data: { ...user, taxpayers } })
})

app.get('/api/user/profile', authMiddleware, (req: Request, res: Response): void => {
  const user = db.prepare('SELECT id, username, role, real_name, id_number, phone, digital_cert, created_at FROM users WHERE id = ?').get((req as any).user.id) as any
  if (!user) {
    res.status(404).json({ success: false, error: '用户不存在' })
    return
  }
  const taxpayers = db.prepare('SELECT * FROM taxpayers WHERE user_id = ?').all(user.id)
  res.json({ success: true, data: { ...user, taxpayers } })
})

app.get('/api/admin/stats', authMiddleware, (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      users: (db.prepare('SELECT COUNT(*) AS count FROM users').get() as any).count,
      taxpayers: (db.prepare('SELECT COUNT(*) AS count FROM taxpayers').get() as any).count,
      declarations: (db.prepare('SELECT COUNT(*) AS count FROM declarations').get() as any).count,
      pendingReview: (db.prepare("SELECT COUNT(*) AS count FROM declarations WHERE status = 'submitted'").get() as any).count,
      pendingPayments: (db.prepare("SELECT COUNT(*) AS count FROM payments WHERE status = 'pending'").get() as any).count,
      tickets: (db.prepare("SELECT COUNT(*) AS count FROM tickets WHERE status IN ('open','processing')").get() as any).count,
    },
  })
})

app.get('/api/admin/dashboard', authMiddleware, (_req: Request, res: Response): void => {
  const recentDeclarations = db.prepare(`
    SELECT d.id, d.period, d.status, d.tax_amount, t.name AS taxpayer_name, tt.name AS tax_type_name
    FROM declarations d
    JOIN taxpayers t ON d.taxpayer_id = t.id
    JOIN tax_types tt ON d.tax_type_id = tt.id
    ORDER BY d.created_at DESC
    LIMIT 5
  `).all()
  const recentTickets = db.prepare('SELECT id, title, category, status, priority, created_at FROM tickets ORDER BY created_at DESC LIMIT 5').all()
  res.json({ success: true, data: { service: 'etax-admin-dashboard', recentDeclarations, recentTickets } })
})

app.get('/api/products', (_req: Request, res: Response): void => {
  const products = db.prepare(`
    SELECT id, name, code, category, default_rate AS price, scope AS description, period_type
    FROM tax_types
    ORDER BY id ASC
  `).all()
  res.json({ success: true, data: products, products })
})

app.get('/api/orders', authMiddleware, (_req: Request, res: Response): void => {
  const payments = db.prepare(`
    SELECT p.id, 'payment' AS order_type, p.amount AS total_amount, p.status, p.voucher_no AS order_no, p.created_at, t.name AS taxpayer_name
    FROM payments p
    JOIN taxpayers t ON p.taxpayer_id = t.id
    ORDER BY p.created_at DESC
    LIMIT 20
  `).all()
  const declarations = db.prepare(`
    SELECT d.id, 'declaration' AS order_type, d.tax_amount AS total_amount, d.status, printf('DECL-%06d', d.id) AS order_no, d.created_at, t.name AS taxpayer_name
    FROM declarations d
    JOIN taxpayers t ON d.taxpayer_id = t.id
    ORDER BY d.created_at DESC
    LIMIT 20
  `).all()
  const orders = [...payments, ...declarations]
    .sort((a: any, b: any) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, 20)
  res.json({ success: true, data: orders, orders })
})

app.get('/api/cart', (_req: Request, res: Response): void => {
  const items = db.prepare('SELECT id, name, code, default_rate AS rate FROM tax_types ORDER BY id ASC LIMIT 3').all()
  res.json({ success: true, data: { items, total: items.length, checkoutReady: true } })
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
