import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import vehicleRoutes from './routes/vehicles.js'
import trajectoryRoutes from './routes/trajectory.js'
import fenceRoutes from './routes/fences.js'
import alertRoutes from './routes/alerts.js'
import scheduleRoutes from './routes/schedules.js'
import driverRoutes from './routes/drivers.js'
import deviceRoutes from './routes/devices.js'
import orgRoutes from './routes/orgs.js'
import gatewayRoutes from './routes/gateway.js'
import systemRoutes from './routes/system.js'

dotenv.config()

const app: express.Application = express()

app.use(cors({
  origin: ['http://127.0.0.1:49133', 'http://localhost:49133'],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/vehicles', vehicleRoutes)
app.use('/api/trajectory', trajectoryRoutes)
app.use('/api/fences', fenceRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/schedules', scheduleRoutes)
app.use('/api/drivers', driverRoutes)
app.use('/api/devices', deviceRoutes)
app.use('/api/orgs', orgRoutes)
app.use('/api/gateway', gatewayRoutes)
app.use('/api/system', systemRoutes)

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
