import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDatabase, seedDatabase } from './database.js'
import authRoutes from './routes/auth.js'
import capacityRoutes from './routes/capacity.js'
import pricingRoutes from './routes/pricing.js'
import matchingRoutes from './routes/matching.js'
import bargainingRoutes from './routes/bargaining.js'
import waybillRoutes from './routes/waybill.js'
import settlementRoutes from './routes/settlement.js'
import adminRoutes from './routes/admin.js'
import dashboardRoutes from './routes/dashboard.js'
import cargoRoutes from './routes/cargo.js'
import driverRoutes from './routes/driver.js'
import monitoringRoutes from './routes/monitoring.js'

dotenv.config()

initDatabase()
seedDatabase()

const app: express.Application = express()

app.use(cors({
  origin: 'http://127.0.0.1:48841',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/capacity', capacityRoutes)
app.use('/api/pricing', pricingRoutes)
app.use('/api/matching', matchingRoutes)
app.use('/api/bargaining', bargainingRoutes)
app.use('/api/cargo', cargoRoutes)
app.use('/api/driver', driverRoutes)
app.use('/api/monitoring', monitoringRoutes)
app.use('/api/waybill', waybillRoutes)
app.use('/api/settlement', settlementRoutes)
app.use('/api/admin', adminRoutes)

app.use('/api/health', (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'ok',
    timestamp: Date.now(),
    db: 'connected',
  })
})

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', error.message)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
