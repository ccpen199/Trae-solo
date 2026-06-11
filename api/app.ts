import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { initDatabase, seedDatabase } from './db.js'
import authRoutes from './routes/auth.js'
import procurementRoutes from './routes/procurements.js'
import processingRoutes from './routes/processing.js'
import accessoryRoutes from './routes/accessories.js'
import supplierRoutes from './routes/suppliers.js'
import matchRoutes from './routes/match.js'
import orderRoutes from './routes/orders.js'
import mapRoutes from './routes/map.js'
import newsRoutes from './routes/news.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

initDatabase()
seedDatabase()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/procurements', procurementRoutes)
app.use('/api/processing-orders', processingRoutes)
app.use('/api/accessories', accessoryRoutes)
app.use('/api/suppliers', supplierRoutes)
app.use('/api/match', matchRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/map', mapRoutes)
app.use('/api', newsRoutes)

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
