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
import weatherRoutes from './routes/weather.js'
import indicesRoutes from './routes/indices.js'
import alertsRoutes from './routes/alerts.js'
import citiesRoutes from './routes/cities.js'
import adminRoutes from './routes/admin.js'
import complianceRoutes from './routes/compliance.js'
import { db } from './db/database.js'
import type { ApiResponse } from '../shared/types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors({
  credentials: true,
  origin: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use((req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now()
  const originalJson = res.json.bind(res)

  res.json = ((body: any): Response => {
    const responseTime = Date.now() - startTime
    const statusCode = res.statusCode
    const endpoint = req.baseUrl + req.path
    const method = req.method
    const ipAddress = req.ip || req.socket.remoteAddress || ''

    try {
      const apiKey = req.headers['x-api-key'] as string | undefined
      let apiKeyId: string | null = null

      if (apiKey) {
        const keyRow = db.prepare('SELECT id FROM api_keys WHERE api_key = ?').get(apiKey) as { id: string } | undefined
        if (keyRow) {
          apiKeyId = keyRow.id
        }
      }

      db.prepare(`
        INSERT INTO api_call_logs (api_key_id, endpoint, method, status_code, response_time, ip_address)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(apiKeyId, endpoint, method, statusCode, responseTime, ipAddress)
    } catch (err) {
      console.error('Failed to log API call:', err)
    }

    return originalJson(body)
  }) as typeof res.json

  next()
})

app.use('/api/auth', authRoutes)
app.use('/api/weather', weatherRoutes)
app.use('/api/indices', indicesRoutes)
app.use('/api/alerts', alertsRoutes)
app.use('/api/cities', citiesRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/compliance', complianceRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    const response: ApiResponse<{ status: string }> = {
      code: 0,
      message: 'success',
      data: { status: 'ok' },
      timestamp: new Date().toISOString(),
    }
    res.status(200).json(response)
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', error)
  const response: ApiResponse<null> = {
    code: 500,
    message: error.message || 'Server internal error',
    data: null,
    timestamp: new Date().toISOString(),
  }
  res.status(500).json(response)
})

app.use((req: Request, res: Response) => {
  const response: ApiResponse<null> = {
    code: 404,
    message: 'API not found',
    data: null,
    timestamp: new Date().toISOString(),
  }
  res.status(404).json(response)
})

export default app
