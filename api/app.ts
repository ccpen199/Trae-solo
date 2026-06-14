import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { initDatabase } from './db/index.js'

import authRoutes from './routes/auth.js'
import taskRoutes from './routes/tasks.js'
import contentRoutes from './routes/content.js'
import healthRoutes from './routes/health.js'
import fashionRoutes from './routes/fashion.js'
import inviteRoutes from './routes/invite.js'
import walletRoutes from './routes/wallet.js'
import withdrawRoutes from './routes/withdraw.js'
import adminRoutes from './routes/admin.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

initDatabase()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/content', contentRoutes)
app.use('/api/health', healthRoutes)
app.use('/api/fashion', fashionRoutes)
app.use('/api/invite', inviteRoutes)
app.use('/api/wallet', walletRoutes)
app.use('/api/withdraw', withdrawRoutes)
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
  console.error(error)
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
