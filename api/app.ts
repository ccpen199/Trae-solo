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
import newsRoutes from './routes/news.js'
import categoryRoutes from './routes/categories.js'
import liveStreamRoutes from './routes/liveStreams.js'
import videoRoutes from './routes/videos.js'
import topicRoutes from './routes/topics.js'
import quizRoutes from './routes/quizzes.js'
import productRoutes from './routes/products.js'
import merchantRoutes from './routes/merchants.js'
import orderRoutes from './routes/orders.js'
import groupBuyRoutes from './routes/groupBuys.js'
import adminRoutes from './routes/admin.js'
import sentimentRoutes from './routes/sentiment.js'
import regionRoutes from './routes/regions.js'
import { initDB } from './db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

const app: express.Application = express()

app.use(cors({
  origin: ['http://127.0.0.1:48881', 'http://localhost:48881'],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')))

initDB()

app.use('/api/auth', authRoutes)
app.use('/api/news', newsRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/live-streams', liveStreamRoutes)
app.use('/api/videos', videoRoutes)
app.use('/api/topics', topicRoutes)
app.use('/api/quizzes', quizRoutes)
app.use('/api/products', productRoutes)
app.use('/api/merchants', merchantRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/group-buys', groupBuyRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/sentiment', sentimentRoutes)
app.use('/api/regions', regionRoutes)

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
