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
import eventsRoutes from './routes/events.js'
import showtimesRoutes from './routes/showtimes.js'
import queueRoutes from './routes/queue.js'
import ordersRoutes from './routes/orders.js'
import ticketsRoutes from './routes/tickets.js'
import organizersRoutes from './routes/organizers.js'
import analyticsRoutes from './routes/analytics.js'
import { authMiddleware } from './middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/showtimes', showtimesRoutes)
app.use('/api/queue', authMiddleware, queueRoutes)
app.use('/api/orders', authMiddleware, ordersRoutes)
app.use('/api/tickets', ticketsRoutes)
app.use('/api/organizers', organizersRoutes)
app.use('/api/analytics', analyticsRoutes)

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
