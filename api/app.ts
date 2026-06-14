import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import './db.js'
import publicRoutes from './routes/public.js'
import authRoutes from './routes/auth.js'
import newsRoutes from './routes/news.js'
import servicesRoutes from './routes/services.js'
import complaintsRoutes from './routes/complaints.js'
import mediaRoutes from './routes/media.js'
import poiRoutes from './routes/poi.js'
import reviewRoutes from './routes/review.js'
import opinionRoutes from './routes/opinion.js'
import creditsRoutes from './routes/credits.js'
import dashboardRoutes from './routes/dashboard.js'

dotenv.config()

const app: express.Application = express()

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || '48829'}`,
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/public', publicRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/news', newsRoutes)
app.use('/api/services', servicesRoutes)
app.use('/api/complaints', complaintsRoutes)
app.use('/api/media', mediaRoutes)
app.use('/api/poi', poiRoutes)
app.use('/api/review', reviewRoutes)
app.use('/api/opinion', opinionRoutes)
app.use('/api/credits', creditsRoutes)
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
  console.error('Server error:', error.message)
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
