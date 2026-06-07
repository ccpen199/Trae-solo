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
import livesRoutes from './routes/lives.js'
import propertiesRoutes from './routes/properties.js'
import renovationRoutes from './routes/renovation.js'
import contentsRoutes from './routes/contents.js'
import materialsRoutes from './routes/materials.js'
import adminRoutes from './routes/admin.js'
import searchRoutes from './routes/search.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/lives', livesRoutes)
app.use('/api/properties', propertiesRoutes)
app.use('/api/renovation', renovationRoutes)
app.use('/api/contents', contentsRoutes)
app.use('/api/materials', materialsRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/search', searchRoutes)

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
    error: error.message || 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
