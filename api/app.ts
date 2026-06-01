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
import fs from 'fs'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import movieRoutes from './src/routes/movieRoutes.js'
import seatRoutes from './src/routes/seatRoutes.js'
import orderRoutes from './src/routes/orderRoutes.js'
import ticketRoutes from './src/routes/ticketRoutes.js'
import userRoutes from './src/routes/userRoutes.js'
import vipRoutes from './src/routes/vipRoutes.js'
import videoRoutes from './src/routes/videoRoutes.js'
import communityRoutes from './src/routes/communityRoutes.js'
import adminRoutes from './src/routes/adminRoutes.js'
import artFilmRoutes from './src/routes/artFilmRoutes.js'
import recommendRoutes from './src/routes/recommendRoutes.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

const FRONTEND_PORT = process.env.FRONTEND_PORT || '48777'
const corsOptions = {
  origin: [
    `http://127.0.0.1:${FRONTEND_PORT}`,
    `http://localhost:${FRONTEND_PORT}`
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const logStream = fs.createWriteStream(path.join(__dirname, '..', 'backend.log'), { flags: 'a' })
app.use((req: Request, res: Response, next: NextFunction) => {
  const now = new Date().toISOString()
  logStream.write(`[${now}] ${req.method} ${req.path} - ${req.ip}\n`)
  next()
})

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/movies', movieRoutes)
app.use('/api/performances', movieRoutes)
app.use('/api/seats', seatRoutes)
app.use('/api/sessions/:id/seats', (req, res, next) => {
  req.url = `/${req.params.id}${req.url}`
  seatRoutes(req, res, next)
})
app.use('/api/orders', orderRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/users', userRoutes)
app.use('/api/vip', vipRoutes)
app.use('/api/videos', videoRoutes)
app.use('/api/video/recommend', (req, res, next) => {
  req.url = '/'
  videoRoutes(req, res, next)
})
app.use('/api/community', communityRoutes)
app.use('/api/community/posts', (req, res, next) => {
  req.url = '/posts' + req.url
  communityRoutes(req, res, next)
})
app.use('/api/admin', adminRoutes)
app.use('/api/art', artFilmRoutes)
app.use('/api/film-festival', artFilmRoutes)
app.use('/api/recommend', recommendRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      code: 0,
      data: { status: 'ok' },
      message: 'success',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    code: 500,
    data: null,
    message: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    code: 404,
    data: null,
    message: 'API not found',
  })
})

export default app
