import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import db from './db.js'
import authRoutes from './routes/auth.js'
import nurseRoutes from './routes/nurses.js'
import serviceRoutes from './routes/services.js'
import orderRoutes from './routes/orders.js'
import dispatchRoutes from './routes/dispatch.js'
import insuranceRoutes from './routes/insurance.js'
import familyRoutes from './routes/family.js'
import adminRoutes from './routes/admin.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors({
  origin: 'http://127.0.0.1:48943',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.use((req: Request, _res: Response, next: NextFunction) => {
  const start = Date.now()
  const originalEnd = _res.end
  _res.end = function (this: any, ...args: any[]) {
    const duration = Date.now() - start
    try {
      db.prepare(
        'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(
        (req as any).user?.id || null,
        `${req.method} ${req.path}`,
        'api_request',
        null,
        `duration: ${duration}ms, status: ${_res.statusCode}`,
        req.ip
      )
    } catch {}
    return originalEnd.apply(this, args)
  }
  next()
})

app.use('/api/auth', authRoutes)
app.use('/api/nurses', nurseRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/dispatch', dispatchRoutes)
app.use('/api/insurance', insuranceRoutes)
app.use('/api/family', familyRoutes)
app.use('/api/admin', adminRoutes)

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
  console.error(error.stack)
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
