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
import supplierRoutes from './routes/suppliers.js'
import procurementRoutes from './routes/procurements.js'
import inventoryRoutes from './routes/inventories.js'
import requisitionRoutes from './routes/requisitions.js'
import menuRoutes from './routes/menus.js'
import sampleRoutes from './routes/samples.js'
import anomalyRoutes from './routes/anomalies.js'
import rectificationRoutes from './routes/rectifications.js'
import traceRoutes from './routes/traceability.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()
const frontendPort = process.env.FRONTEND_PORT || '43451'

app.use(cors({
  origin: [`http://127.0.0.1:${frontendPort}`, `http://localhost:${frontendPort}`],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/suppliers', supplierRoutes)
app.use('/api/procurements', procurementRoutes)
app.use('/api/inventories', inventoryRoutes)
app.use('/api/requisitions', requisitionRoutes)
app.use('/api/menus', menuRoutes)
app.use('/api/samples', sampleRoutes)
app.use('/api/anomalies', anomalyRoutes)
app.use('/api/rectifications', rectificationRoutes)
app.use('/api/traceability', traceRoutes)

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
