import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import './database.js'
import authRoutes from './routes/auth.js'
import householdRoutes from './routes/households.js'
import parcelRoutes from './routes/parcels.js'
import applicationRoutes from './routes/applications.js'
import anomalyRoutes from './routes/anomalies.js'
import noticeRoutes from './routes/notices.js'
import reportRoutes from './routes/reports.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors({
  origin: ['http://127.0.0.1:43434', 'http://localhost:43434'],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/households', householdRoutes)
app.use('/api/parcels', parcelRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/anomalies', anomalyRoutes)
app.use('/api/notices', noticeRoutes)
app.use('/api/reports', reportRoutes)

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
