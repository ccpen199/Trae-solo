import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import deviceRoutes from './routes/devices.js'
import alertRoutes from './routes/alerts.js'
import otaRoutes from './routes/ota.js'
import geofenceRoutes from './routes/geofence.js'
import videoRoutes from './routes/video.js'
import logRoutes from './routes/logs.js'
import privacyRoutes from './routes/privacy.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

const FRONTEND_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://localhost:49196',
  'http://127.0.0.1:49196',
]

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        FRONTEND_ORIGINS.includes(origin) ||
        origin.includes('localhost') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        callback(null, true)
      } else {
        callback(null, false)
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }),
)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/devices', deviceRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/ota', otaRoutes)
app.use('/api/geofence', geofenceRoutes)
app.use('/api/video', videoRoutes)
app.use('/api/logs', logRoutes)
app.use('/api/privacy', privacyRoutes)

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
