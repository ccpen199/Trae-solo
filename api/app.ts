import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import postsRoutes from './routes/posts.js'
import riskRoutes from './routes/risk.js'
import auditRoutes from './routes/audit.js'
import merchantsRoutes from './routes/merchants.js'
import statsRoutes from './routes/stats.js'
import geoRoutes from './routes/geo.js'
import openRoutes from './routes/open.js'

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/posts', postsRoutes)
app.use('/api/risk', riskRoutes)
app.use('/api/audit', auditRoutes)
app.use('/api/merchants', merchantsRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/geo', geoRoutes)
app.use('/api/open', openRoutes)

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
