/**
 * API server app
 */
import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import propertyRoutes from './routes/properties.js'
import transactionRoutes from './routes/transactions.js'
import leaseRoutes from './routes/leases.js'
import workOrderRoutes from './routes/workOrders.js'
import dashboardRoutes from './routes/dashboard.js'
import { initDatabase } from './db.js'
import { seedDatabase } from './db/seed.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

initDatabase()
seedDatabase()

const app: express.Application = express()

app.use(cors({
  origin: [`http://127.0.0.1:${process.env.FRONTEND_PORT || 49051}`],
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/properties', propertyRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/leases', leaseRoutes)
app.use('/api/work-orders', workOrderRoutes)
app.use('/api/dashboard', dashboardRoutes)

app.get(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      status: 'ok',
      timestamp: new Date().toISOString()
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', error)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
    message: error.message
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
    path: req.path
  })
})

export default app
