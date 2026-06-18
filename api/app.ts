import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDb } from './db.js'
import authRoutes from './routes/auth.js'
import socialSecurityRoutes from './routes/social-security.js'
import employmentRoutes from './routes/employment.js'
import talentRoutes from './routes/talent.js'
import laborRoutes from './routes/labor.js'
import policyRoutes from './routes/policy.js'
import monitorRoutes from './routes/monitor.js'
import userRoutes from './routes/user.js'

dotenv.config()

initDb()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/social-security', socialSecurityRoutes)
app.use('/api/employment', employmentRoutes)
app.use('/api/talent', talentRoutes)
app.use('/api/labor', laborRoutes)
app.use('/api/policy', policyRoutes)
app.use('/api/monitor', monitorRoutes)
app.use('/api/user', userRoutes)

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
