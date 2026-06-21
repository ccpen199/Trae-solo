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
import expertRoutes from './routes/expert.js'
import artworkRoutes from './routes/artwork.js'
import orderRoutes from './routes/order.js'
import certificateRoutes from './routes/certificate.js'
import knowledgeRoutes from './routes/knowledge.js'
import communityRoutes from './routes/community.js'
import valuationRoutes from './routes/valuation.js'
import adminRoutes from './routes/admin.js'
import openapiRoutes from './routes/openapi.js'
import './db/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/experts', expertRoutes)
app.use('/api/artworks', artworkRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/certificates', certificateRoutes)
app.use('/api/knowledge', knowledgeRoutes)
app.use('/api/community', communityRoutes)
app.use('/api/valuation', valuationRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/open', openapiRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
      timestamp: new Date().toISOString(),
    })
  },
)

app.use((error: Error & { status?: number }, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Error]', error)
  const status = error.status || 500
  res.status(status).json({
    success: false,
    error: status === 500 ? 'Server internal error' : error.message || 'Request failed',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
