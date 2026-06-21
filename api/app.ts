import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import socialRoutes from './routes/social.js'
import householdRoutes from './routes/household.js'
import healthRoutes from './routes/health.js'
import certificatesRoutes from './routes/certificates.js'
import auditRoutes from './routes/audit.js'
import transportRoutes from './routes/transport.js'
import educationRoutes from './routes/education.js'
import recommendRoutes from './routes/recommend.js'
import auditMiddleware from './middleware/audit.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(auditMiddleware)

app.use('/api/auth', authRoutes)
app.use('/api/social', socialRoutes)
app.use('/api/household', householdRoutes)
app.use('/api/health', healthRoutes)
app.use('/api/certificates', certificatesRoutes)
app.use('/api/audit', auditRoutes)
app.use('/api/transport', transportRoutes)
app.use('/api/education', educationRoutes)
app.use('/api/recommend', recommendRoutes)

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
  console.error('Server error:', error)
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
