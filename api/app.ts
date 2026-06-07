import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import cabinetRoutes from './routes/cabinets.js'
import compartmentRoutes from './routes/compartments.js'
import packageRoutes from './routes/packages.js'
import shippingRoutes from './routes/shipping.js'
import storageRoutes from './routes/storage.js'
import laundryRoutes from './routes/laundry.js'
import housekeepingRoutes from './routes/housekeeping.js'
import notificationRoutes from './routes/notifications.js'
import adminRoutes from './routes/admin.js'
import couponRoutes from './routes/coupons.js'
import { initDatabase } from './database.js'

dotenv.config({ path: '../.env' })

const FRONTEND_PORT = process.env.FRONTEND_PORT || '49016'
const HOST = process.env.HOST || '127.0.0.1'

const app: express.Application = express()

app.use(cors({
  origin: [`http://${HOST}:${FRONTEND_PORT}`, `http://localhost:${FRONTEND_PORT}`],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

initDatabase()

app.use('/api/auth', authRoutes)
app.use('/api/cabinets', cabinetRoutes)
app.use('/api/compartments', compartmentRoutes)
app.use('/api/packages', packageRoutes)
app.use('/api/shipping', shippingRoutes)
app.use('/api/storage', storageRoutes)
app.use('/api/laundry', laundryRoutes)
app.use('/api/housekeeping', housekeepingRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/coupons', couponRoutes)

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
