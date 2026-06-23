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
import namingRoutes from './routes/naming.js'
import characterRoutes from './routes/character.js'
import nameRoutes from './routes/name.js'
import casesRoutes from './routes/cases.js'
import mastersRoutes from './routes/masters.js'
import userRoutes from './routes/user.js'
import reportRoutes from './routes/report.js'
import adminRoutes from './routes/admin.js'
import type { ApiResponse } from '../shared/types'
import './db/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/naming', namingRoutes)
app.use('/api/character', characterRoutes)
app.use('/api/name', nameRoutes)
app.use('/api/cases', casesRoutes)
app.use('/api/masters', mastersRoutes)
app.use('/api/user', userRoutes)
app.use('/api/report', reportRoutes)
app.use('/api/admin', adminRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    const response: ApiResponse<{ success: boolean }> = {
      code: 0,
      message: 'ok',
      data: { success: true }
    }
    res.status(200).json(response)
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  const response: ApiResponse<null> = {
    code: 500,
    message: error.message || 'Server internal error',
    data: null
  }
  res.status(500).json(response)
})

app.use((req: Request, res: Response) => {
  const response: ApiResponse<null> = {
    code: 404,
    message: 'API not found',
    data: null
  }
  res.status(404).json(response)
})

export default app
