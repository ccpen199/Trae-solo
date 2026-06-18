import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import publicRoutes from './src/routes/publicRoutes.js'
import authRoutes from './src/routes/authRoutes.js'
import reviewerRoutes from './src/routes/reviewerRoutes.js'
import brandRoutes from './src/routes/brandRoutes.js'
import adminRoutes from './src/routes/adminRoutes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/public', publicRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/reviewer', reviewerRoutes)
app.use('/api/brand', brandRoutes)
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
  console.error('Server error:', error)
  res.status(500).json({
    code: 500,
    message: 'Server internal error',
    data: null,
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    code: 404,
    message: 'API not found',
    data: null,
  })
})

export default app
