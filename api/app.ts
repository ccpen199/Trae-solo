import express, {
  type Request,
  type Response,
  type NextFunction,
  type Application,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import morgan from 'morgan'
import { Server as SocketIOServer } from 'socket.io'
import { createServer, type Server as HTTPServer } from 'http'
import { authMiddleware } from './utils/auth.js'
import { notFound, serverError, fail } from './utils/response.js'

import authRoutes from './routes/auth.js'
import ordersRoutes from './routes/orders.js'
import matchingRoutes from './routes/matching.js'
import fundRoutes from './routes/fund.js'
import settlementRoutes from './routes/settlement.js'
import stationsRoutes from './routes/stations.js'
import trackRoutes from './routes/track.js'
import adminRoutes from './routes/admin.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: Application = express()

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

morgan.token('req-body', (req: Request) => {
  const body = { ...(req.body as Record<string, unknown>) }
  if (body.password) body.password = '***'
  if (body.code) body.code = '***'
  return JSON.stringify(body)
})
app.use(morgan(':method :url :status :res[content-length] - :response-time ms [:date[iso]]'))

app.get('/api/v1/health', (req: Request, res: Response, _next: NextFunction): void => {
  res.status(200).json({
    code: 0,
    msg: 'ok',
    data: {
      timestamp: Date.now(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    },
  })
})

app.use('/api/v1/auth', authMiddleware(), authRoutes)
app.use('/api/v1/orders', authMiddleware(), ordersRoutes)
app.use('/api/v1/matching', authMiddleware(), matchingRoutes)
app.use('/api/v1/fund', authMiddleware(), fundRoutes)
app.use('/api/v1/settlement', authMiddleware(), settlementRoutes)
app.use('/api/v1/stations', authMiddleware(), stationsRoutes)
app.use('/api/v1/track', authMiddleware(), trackRoutes)
app.use('/api/v1/admin', authMiddleware(['admin']), adminRoutes)

app.use((req: Request, res: Response, _next: NextFunction) => {
  notFound(res, `API not found: ${req.method} ${req.path}`)
})

app.use((error: Error & { status?: number }, req: Request, res: Response, _next: NextFunction) => {
  console.error(`[ERROR] ${req.method} ${req.path} -`, error.message, error.stack)
  const statusCode = error.status || 500
  if (statusCode === 404) {
    notFound(res, error.message || '资源不存在')
  } else {
    serverError(res, error.message || '服务器内部错误')
  }
})

const httpServer: HTTPServer = createServer(app)

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: true,
    credentials: true,
  },
})

export { app, httpServer, io }
export default app
