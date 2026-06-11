import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import multer from 'multer'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import deviceRoutes from './routes/devices.js'
import accessRoutes from './routes/access.js'
import repairRoutes from './routes/repairs.js'
import communityRoutes from './routes/community.js'
import paymentRoutes from './routes/payments.js'
import announcementRoutes from './routes/announcements.js'
import organizationRoutes from './routes/organization.js'
import permissionRoutes from './routes/permissions.js'
import alertRoutes from './routes/alerts.js'
import reportRoutes from './routes/reports.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, 'uploads'),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname)
      cb(null, Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext)
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
})

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.post('/api/upload', upload.single('file'), (req: Request, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ success: false, error: '请选择文件' })
    return
  }
  res.json({ success: true, data: { url: `/uploads/${req.file.filename}`, filename: req.file.originalname } })
})

app.use('/api/auth', authRoutes)
app.use('/api/devices', deviceRoutes)
app.use('/api/access', accessRoutes)
app.use('/api/repairs', repairRoutes)
app.use('/api/community', communityRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/announcements', announcementRoutes)
app.use('/api/organization', organizationRoutes)
app.use('/api/permissions', permissionRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/reports', reportRoutes)

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
