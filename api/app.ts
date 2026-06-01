import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { getDb, initDb } from './db.js'
import vesselRoutes from './routes/vessels.js'
import declarationRoutes from './routes/declarations.js'
import monitorRoutes from './routes/monitor.js'
import eventRoutes from './routes/events.js'
import reportRoutes from './routes/reports.js'
import optionRoutes from './routes/options.js'

dotenv.config()

initDb()

const app = express()
const FRONTEND_PORT = process.env.FRONTEND_PORT || '43439'

app.use(cors({ origin: [`http://127.0.0.1:${FRONTEND_PORT}`], credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/vessels', vesselRoutes)
app.use('/api/declarations', declarationRoutes)
app.use('/api/monitor', monitorRoutes)
app.use('/api/events', eventRoutes)
app.use('/api', reportRoutes)
app.use('/api/options', optionRoutes)

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'ok' })
})

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ success: false, error: 'Server internal error' })
})

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'API not found' })
})

export default app
export { getDb }
