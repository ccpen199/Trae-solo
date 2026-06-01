import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { initDb } from './db/index.js'
import { desensitizeMiddleware } from './middleware/desensitize.js'
import authRoutes from './routes/auth.js'
import orderRoutes from './routes/orders.js'
import trackingRoutes from './routes/tracking.js'
import expressRoutes from './routes/express.js'
import bulkRoutes from './routes/bulk.js'
import twinRoutes from './routes/twin.js'
import securityRoutes from './routes/security.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

initDb()

const app: express.Application = express()

const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '46932')
app.use(cors({
  origin: [`http://127.0.0.1:${FRONTEND_PORT}`, `http://localhost:${FRONTEND_PORT}`],
  credentials: true,
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(desensitizeMiddleware)

app.use('/api/auth', authRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/tracking', trackingRoutes)
app.use('/api/exceptions', trackingRoutes)
app.use('/api/express', expressRoutes)
app.use('/api/protocols', expressRoutes)
app.use('/api/bulk', bulkRoutes)
app.use('/api/twin', twinRoutes)
app.use('/api/security', securityRoutes)

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
  console.error('Error:', error)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
    message: error.message,
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
    path: req.path,
  })
})

export default app
