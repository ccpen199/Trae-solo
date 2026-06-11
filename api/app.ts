/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
console.log('Express imported');
import cors from 'cors'
console.log('CORS imported');
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
console.log('Basic imports done');
import { initDatabase } from './db/init.js'
console.log('initDatabase imported');
import authRoutes from './routes/auth.js'
console.log('authRoutes imported');
import taskRoutes from './routes/tasks.js'
console.log('taskRoutes imported');
import submissionRoutes from './routes/submissions.js'
console.log('submissionRoutes imported');
import talentRoutes from './routes/talents.js'
console.log('talentRoutes imported');
import messageRoutes from './routes/messages.js'
console.log('messageRoutes imported');
import financeRoutes from './routes/finance.js'
console.log('financeRoutes imported');
import disputeRoutes from './routes/disputes.js'
console.log('disputeRoutes imported');
import adminRoutes from './routes/admin.js'
console.log('All imports done');

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()
console.log('Env loaded');

// init database
console.log('Initializing database...');
initDatabase()
console.log('Database initialized');

const app: express.Application = express()

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://127.0.0.1:49096'

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/submissions', submissionRoutes)
app.use('/api/talents', talentRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/finance', financeRoutes)
app.use('/api/disputes', disputeRoutes)
app.use('/api/admin', adminRoutes)

/**
 * health
 */
app.get('/api/health', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'ok',
    timestamp: Date.now(),
  })
})

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', error)
  res.status(500).json({
    success: false,
    error: error.message || 'Server internal error',
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
