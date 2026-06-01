import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { initDatabase } from './db/init.js'
import authRoutes from './routes/auth.js'
import stationRoutes from './routes/stations.js'
import chargingRoutes from './routes/charging.js'
import operationRoutes from './routes/operations.js'
import analyticsRoutes from './routes/analytics.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

initDatabase()

const app: express.Application = express()

app.use(cors({
  origin: [
    'http://127.0.0.1:43430',
    'http://127.0.0.1:44430',
    'http://127.0.0.1:45430',
    'http://127.0.0.1:46430',
    'http://127.0.0.1:47430',
    'http://127.0.0.1:48430',
  ],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

app.use('/api/auth', authRoutes)
app.use('/api/stations', stationRoutes)
app.use('/api/charging', chargingRoutes)
app.use('/api/operations', operationRoutes)
app.use('/api/analytics', analyticsRoutes)

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
    error: error.message || 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
