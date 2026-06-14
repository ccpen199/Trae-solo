import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { getDb } from './db/init.js'
import orderRoutes from './routes/orders.js'
import estimateRoutes from './routes/estimate.js'
import inspectionRoutes from './routes/inspections.js'
import pricingRoutes from './routes/pricing.js'
import settlementRoutes from './routes/settlements.js'
import logisticsRoutes from './routes/logistics.js'
import charityRoutes from './routes/charity.js'
import dashboardRoutes from './routes/dashboard.js'
import processorRoutes from './routes/processors.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/orders', orderRoutes)
app.use('/api/estimate', estimateRoutes)
app.use('/api/inspections', inspectionRoutes)
app.use('/api/pricing', pricingRoutes)
app.use('/api/settlements', settlementRoutes)
app.use('/api/logistics', logisticsRoutes)
app.use('/api/charity', charityRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/processors', processorRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      getDb()
      res.status(200).json({
        success: true,
        message: 'ok',
      })
    } catch {
      res.status(503).json({
        success: false,
        message: 'database unavailable',
      })
    }
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
