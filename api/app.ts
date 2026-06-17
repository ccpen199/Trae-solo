import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import multer from 'multer'
import { fileURLToPath } from 'url'
import { getDb, initDatabase } from './database.js'
import { geofence } from './middleware/geofence.js'
import authRoutes from './routes/auth.js'
import merchantRoutes from './routes/merchants.js'
import packageRoutes from './routes/packages.js'
import orderRoutes from './routes/orders.js'
import campaignRoutes from './routes/campaigns.js'
import reportRoutes from './routes/reports.js'
import lbsRoutes from './routes/lbs.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

initDatabase()

const app: express.Application = express()

const FRONTEND_URL = process.env.FRONTEND_URL || `http://${process.env.FRONTEND_HOST || '127.0.0.1'}:${process.env.FRONTEND_PORT || '49205'}`
const corsOptions = {
  origin: [FRONTEND_URL, `http://127.0.0.1:${process.env.FRONTEND_PORT || '49205'}`, `http://localhost:${process.env.FRONTEND_PORT || '49205'}`],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}
app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const uploadDir = path.join(__dirname, '..', 'uploads')
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } })

app.use('/uploads', express.static(uploadDir))

app.use('/api', geofence)

app.post('/api/upload', upload.single('file'), (req: Request, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ code: 400, message: '请上传文件', data: null })
    return
  }
  res.json({ code: 200, message: 'ok', data: { url: `/uploads/${req.file.filename}` } })
})

app.use('/api/auth', authRoutes)
app.use('/api/merchants', merchantRoutes)
app.use('/api/packages', packageRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/campaigns', campaignRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/lbs', lbsRoutes)

app.get(['/api/auth/me', '/api/users/profile', '/api/user/profile'], (_req: Request, res: Response): void => {
  const db = getDb()
  const user = db.prepare('SELECT id, phone, name, avatar, created_at FROM users ORDER BY created_at LIMIT 1').get()
  res.json({
    code: 200,
    message: 'ok',
    data: user || {
      id: 'local-user',
      phone: '13800000001',
      name: '本地生活用户',
      avatar: '',
      role: 'user',
    },
  })
})

app.get('/api/search', (req: Request, res: Response): void => {
  const db = getDb()
  const q = String(req.query.q || '').trim()
  const like = `%${q}%`
  const merchants = q
    ? db.prepare(`
      SELECT id, name, category, street, rating, popularity FROM merchants
      WHERE name LIKE ? OR category LIKE ? OR street LIKE ?
      ORDER BY popularity DESC LIMIT 8
    `).all(like, like, like)
    : db.prepare('SELECT id, name, category, street, rating, popularity FROM merchants ORDER BY popularity DESC LIMIT 8').all()
  const packages = q
    ? db.prepare(`
      SELECT p.id, p.name, p.type, p.price, m.name as merchant_name
      FROM packages p LEFT JOIN merchants m ON p.merchant_id = m.id
      WHERE p.name LIKE ? OR p.type LIKE ? OR m.name LIKE ?
      ORDER BY p.created_at DESC LIMIT 8
    `).all(like, like, like)
    : db.prepare(`
      SELECT p.id, p.name, p.type, p.price, m.name as merchant_name
      FROM packages p LEFT JOIN merchants m ON p.merchant_id = m.id
      ORDER BY p.created_at DESC LIMIT 8
    `).all()

  res.json({
    code: 200,
    message: 'ok',
    data: { query: q, merchants, packages },
  })
})

app.get('/api/products', (_req: Request, res: Response): void => {
  const db = getDb()
  const items = db.prepare(`
    SELECT p.id, p.name, p.type as category, p.price, p.original_price, p.stock, p.sold,
           m.name as merchant_name, m.street as merchant_street
    FROM packages p LEFT JOIN merchants m ON p.merchant_id = m.id
    WHERE p.status = 'active'
    ORDER BY p.created_at DESC LIMIT 20
  `).all()
  res.json({ code: 200, message: 'ok', data: { items } })
})

app.get('/api/cart', (_req: Request, res: Response): void => {
  const db = getDb()
  const first = db.prepare(`
    SELECT p.id, p.name, p.price, m.name as merchant_name
    FROM packages p LEFT JOIN merchants m ON p.merchant_id = m.id
    WHERE p.status = 'active'
    ORDER BY p.created_at DESC LIMIT 1
  `).get() as Record<string, unknown> | undefined
  const items: Array<Record<string, unknown> & { price?: unknown; quantity: number }> = first ? [{ ...first, quantity: 1 }] : []
  res.json({
    code: 200,
    message: 'ok',
    data: {
      id: 'local-cart',
      items,
      total: items.reduce((sum, item) => sum + Number(item.price || 0), 0),
    },
  })
})

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      code: 200,
      message: 'ok',
      data: { status: 'healthy' },
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    data: null,
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    code: 404,
    message: 'API不存在',
    data: null,
  })
})

export default app
