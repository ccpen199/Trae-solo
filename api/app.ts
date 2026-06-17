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
import petsRoutes from './routes/pets.js'
import translateRoutes from './routes/translate.js'
import photosRoutes from './routes/photos.js'
import communityRoutes from './routes/community.js'
import trainingRoutes from './routes/training.js'
import adminRoutes from './routes/admin.js'
import ordersRoutes from './routes/orders.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()
const frontendUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:49224'
const backendUrl = process.env.BACKEND_URL || `http://${process.env.BACKEND_HOST || '127.0.0.1'}:${process.env.BACKEND_PORT || process.env.PORT || 59224}`

app.use(cors({
  origin: frontendUrl,
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/pets', petsRoutes)
app.use('/api/translate', translateRoutes)
app.use('/api/photos', photosRoutes)
app.use('/api/community', communityRoutes)
app.use('/api/training', trainingRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/orders', ordersRoutes)

app.get('/api/ide/v1/text_to_image', (req: Request, res: Response): void => {
  const prompt = String(req.query.prompt || 'pet portrait').slice(0, 80)
  const imageSize = String(req.query.image_size || 'square')
  const isPortrait = imageSize.includes('portrait')
  const width = isPortrait ? 900 : 800
  const height = isPortrait ? 1200 : 800
  const safePrompt = prompt
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8')
  res.status(200).send(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fef3c7"/>
          <stop offset="55%" stop-color="#ccfbf1"/>
          <stop offset="100%" stop-color="#fed7aa"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <circle cx="${width * 0.52}" cy="${height * 0.42}" r="${Math.min(width, height) * 0.22}" fill="#ffffff" opacity="0.78"/>
      <circle cx="${width * 0.44}" cy="${height * 0.36}" r="${Math.min(width, height) * 0.035}" fill="#6b4f3b"/>
      <circle cx="${width * 0.60}" cy="${height * 0.36}" r="${Math.min(width, height) * 0.035}" fill="#6b4f3b"/>
      <path d="M ${width * 0.45} ${height * 0.48} Q ${width * 0.52} ${height * 0.55} ${width * 0.61} ${height * 0.48}" fill="none" stroke="#6b4f3b" stroke-width="18" stroke-linecap="round"/>
      <text x="50%" y="${height * 0.78}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.round(width / 24)}" fill="#5f4432">喵汪心语</text>
      <text x="50%" y="${height * 0.84}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.round(width / 36)}" fill="#7c6a5d">${safePrompt}</text>
    </svg>
  `)
})

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
      service: 'pet-ai-platform',
      frontendUrl,
      backendUrl,
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
