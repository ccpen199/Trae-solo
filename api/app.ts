import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { initDatabase } from './db/index.js'
import { responseMiddleware } from './middleware/response.js'
import authRoutes from './routes/auth.js'
import freightRatesRoutes from './routes/freightRates.js'
import cargoRoutes from './routes/cargo.js'
import waybillsRoutes from './routes/waybills.js'
import trackingRoutes from './routes/tracking.js'
import ordersRoutes from './routes/orders.js'
import billsRoutes from './routes/bills.js'
import settlementRoutes from './routes/settlement.js'
import capacityRoutes from './routes/capacity.js'
import exceptionsRoutes from './routes/exceptions.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

initDatabase()

const app: express.Application = express()

app.use(cors({
  origin: ['http://127.0.0.1:50105', 'http://localhost:50105'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(responseMiddleware)

app.use('/api/auth', authRoutes)
app.use('/api/freight-rates', freightRatesRoutes)
app.use('/api/cargo', cargoRoutes)
app.use('/api/waybills', waybillsRoutes)
app.use('/api/tracking', trackingRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/bills', billsRoutes)
app.use('/api/settlement', settlementRoutes)
app.use('/api/capacity', capacityRoutes)
app.use('/api/exceptions', exceptionsRoutes)

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
    code: 500,
    message: error.message || '服务器内部错误',
    data: null,
    timestamp: Date.now(),
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    code: 404,
    message: 'API 不存在',
    data: null,
    timestamp: Date.now(),
  })
})

export default app
