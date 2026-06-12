import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import './database.js'
import authRoutes from './routes/auth.js'
import jobsRoutes from './routes/jobs.js'
import resumesRoutes from './routes/resumes.js'
import applicationsRoutes from './routes/applications.js'
import messagesRoutes from './routes/messages.js'
import communityRoutes from './routes/community.js'
import adminRoutes from './routes/admin.js'

dotenv.config()

const app: express.Application = express()

app.use(cors({
  origin: ['http://127.0.0.1:49180', 'http://localhost:49180'],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/jobs', jobsRoutes)
app.use('/api/resumes', resumesRoutes)
app.use('/api/applications', applicationsRoutes)
app.use('/api/messages', messagesRoutes)
app.use('/api/community', communityRoutes)
app.use('/api/admin', adminRoutes)

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
