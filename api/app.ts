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
import communitiesRoutes from './routes/communities.js'
import propertiesRoutes from './routes/properties.js'
import agentsRoutes from './routes/agents.js'
import aiCardsRoutes from './routes/ai-cards.js'
import mortgageRoutes from './routes/mortgage.js'
import delegationsRoutes from './routes/delegations.js'
import xiangyuRoutes from './routes/xiangyu.js'
import collaborationRoutes from './routes/collaboration.js'
import searchRoutes from './routes/search.js'
import adminRoutes from './routes/admin.js'
import { initDb } from './db.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

initDb()

const app: express.Application = express()
const frontendPort = process.env.FRONTEND_PORT || '49059'

app.use(cors({
  origin: [`http://127.0.0.1:${frontendPort}`, `http://localhost:${frontendPort}`],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/communities', communitiesRoutes)
app.use('/api/properties', propertiesRoutes)
app.use('/api/agents', agentsRoutes)
app.use('/api/ai-cards', aiCardsRoutes)
app.use('/api/mortgage', mortgageRoutes)
app.use('/api/delegations', delegationsRoutes)
app.use('/api/xiangyu', xiangyuRoutes)
app.use('/api/collab', collaborationRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/admin', adminRoutes)

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
  console.error('API Error:', error)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
    message: error.message,
    stack: error.stack,
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
