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
import canalRoutes from './routes/canals.js'
import pumpRoutes from './routes/pumps.js'
import gateRoutes from './routes/gates.js'
import zoneRoutes from './routes/zones.js'
import cropRoutes from './routes/crops.js'
import quotaRoutes from './routes/quotas.js'
import applicationRoutes from './routes/applications.js'
import scheduleRoutes from './routes/schedules.js'
import dispatchRoutes from './routes/dispatches.js'
import deviceRoutes from './routes/devices.js'
import alarmRoutes from './routes/alarms.js'
import workOrderRoutes from './routes/workOrders.js'
import recordRoutes from './routes/records.js'
import reportRoutes from './routes/reports.js'
import logRoutes from './routes/logs.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const FRONTEND_PORT = process.env.FRONTEND_PORT || 43440
const corsOptions = {
  origin: [
    `http://127.0.0.1:${FRONTEND_PORT}`,
    `http://localhost:${FRONTEND_PORT}`,
  ],
  credentials: true,
  optionsSuccessStatus: 200,
}

const app: express.Application = express()

app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use((req: Request, res: Response, next: NextFunction) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${ip}`)
  next()
})

app.use('/api/auth', authRoutes)
app.use('/api/canals', canalRoutes)
app.use('/api/pumps', pumpRoutes)
app.use('/api/gates', gateRoutes)
app.use('/api/zones', zoneRoutes)
app.use('/api/crops', cropRoutes)
app.use('/api/quotas', quotaRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/schedules', scheduleRoutes)
app.use('/api/dispatches', dispatchRoutes)
app.use('/api/devices', deviceRoutes)
app.use('/api/alarms', alarmRoutes)
app.use('/api/work-orders', workOrderRoutes)
app.use('/api/records', recordRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/logs', logRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
      timestamp: new Date().toISOString(),
      port: process.env.BACKEND_PORT,
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
    path: req.url,
  })
})

export default app
