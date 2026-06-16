/**
 * This is a API server
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
import petRoutes from './routes/pets.js'
import doctorRoutes from './routes/doctors.js'
import consultationRoutes from './routes/consultations.js'
import hospitalRoutes from './routes/hospitals.js'
import productRoutes from './routes/products.js'
import communityRoutes from './routes/community.js'
import calendarRoutes from './routes/calendar.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/pets', petRoutes)
app.use('/api/doctors', doctorRoutes)
app.use('/api/consultations', consultationRoutes)
app.use('/api/hospitals', hospitalRoutes)
app.use('/api/products', productRoutes)
app.use('/api/community', communityRoutes)
app.use('/api/calendar', calendarRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
