import express, {
  type Request,
  type Response,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import schemeRoutes from './routes/schemes.js'
import stepRoutes from './routes/steps.js'
import commentRoutes from './routes/comments.js'
import decisionRoutes from './routes/decisions.js'
import retrospectiveRoutes from './routes/retrospective.js'
import changeRoutes from './routes/changes.js'

dotenv.config()

const app: express.Application = express()

app.use(cors({
  origin: 'http://127.0.0.1:43475',
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/schemes', schemeRoutes)
app.use('/api/steps', stepRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api/decisions', decisionRoutes)
app.use('/api/retrospective', retrospectiveRoutes)
app.use('/api', changeRoutes)

app.use(
  '/api/health',
  (_req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, _req: Request, res: Response) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
