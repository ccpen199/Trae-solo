import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import './db.js'
import authRoutes from './routes/auth.js'
import housesRoutes from './routes/houses.js'
import clientsRoutes from './routes/clients.js'
import schedulesRoutes from './routes/schedules.js'
import transactionsRoutes from './routes/transactions.js'
import commissionsRoutes from './routes/commissions.js'
import orgsRoutes from './routes/organizations.js'
import auditRoutes from './routes/audit.js'
import uploadRoutes from './routes/upload.js'
import dashboardRoutes from './routes/dashboard.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const FRONTEND_PORT = process.env.FRONTEND_PORT || '49060'

const app: express.Application = express()

app.use(cors({
  origin: [`http://localhost:${FRONTEND_PORT}`, `http://127.0.0.1:${FRONTEND_PORT}`],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 请求日志中间件
app.use((req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now()
  const { method, url, ip } = req
  const userAgent = req.get('user-agent') || ''
  
  res.on('finish', () => {
    const duration = Date.now() - startTime
    const statusCode = res.statusCode
    console.log(`[${new Date().toISOString()}] ${method} ${url} ${statusCode} ${duration}ms - IP: ${ip}`)
    if (url === '/api/auth/login' && method === 'POST') {
      const body = { ...req.body }
      if (body.password) body.password = '***'
      console.log(`  Login request body: ${JSON.stringify(body)}`)
      console.log(`  User-Agent: ${userAgent.substring(0, 100)}`)
    }
  })
  
  next()
})

const uploadsDir = path.join(__dirname, '..', 'uploads')
app.use('/uploads', express.static(uploadsDir))

app.use('/api/auth', authRoutes)
app.use('/api/houses', housesRoutes)
app.use('/api/clients', clientsRoutes)
app.use('/api/schedules', schedulesRoutes)
app.use('/api/transactions', transactionsRoutes)
app.use('/api/commissions', commissionsRoutes)
app.use('/api/orgs', orgsRoutes)
app.use('/api/organizations', orgsRoutes)
app.use('/api/audit', auditRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/dashboard', dashboardRoutes)

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
