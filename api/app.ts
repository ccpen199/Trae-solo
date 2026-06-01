import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { getDb, seedDatabase } from './database.js'
import authRoutes from './routes/auth.js'
import sitesRoutes from './routes/sites.js'
import devicesRoutes from './routes/devices.js'
import ordersRoutes from './routes/orders.js'
import workOrdersRoutes from './routes/workOrders.js'
import financeRoutes from './routes/finance.js'
import dashboardRoutes from './routes/dashboard.js'

dotenv.config()

const app: express.Application = express()

const FRONTEND_PORT = process.env.FRONTEND_PORT || '43429'

app.use(cors({
  origin: `http://127.0.0.1:${FRONTEND_PORT}`,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const db = getDb()
seedDatabase()
console.log('Database initialized and seeded')

app.use('/api/auth', authRoutes)
app.use('/api/sites', sitesRoutes)
app.use('/api/devices', devicesRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/work-orders', workOrdersRoutes)
app.use('/api/finance', financeRoutes)
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
