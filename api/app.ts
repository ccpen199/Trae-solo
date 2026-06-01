import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import assetRoutes from './routes/assets.js'
import contractRoutes from './routes/contracts.js'
import revenueRoutes from './routes/revenues.js'
import decisionRoutes from './routes/decisions.js'
import dashboardRoutes from './routes/dashboard.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || '53433', 10)

app.use(cors({
  origin: [`http://127.0.0.1:${process.env.FRONTEND_PORT || 43433}`],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/assets', assetRoutes)
app.use('/api/contracts', contractRoutes)
app.use('/api/revenues', revenueRoutes)
app.use('/api/decisions', decisionRoutes)
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
  console.error(error)
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
