import express, {
  type Request,
  type Response,
  type NextFunction,
  type Application,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import { initDatabase } from './lib/database.js'
import authRoutes from './routes/auth.js'
import employmentRoutes from './routes/employment.js'
import socialInsuranceRoutes from './routes/social-insurance.js'
import laborRelationsRoutes from './routes/labor-relations.js'
import policyMatchRoutes from './routes/policy-match.js'
import smartQaRoutes from './routes/smart-qa.js'
import outletsRoutes from './routes/outlets.js'
import userRoutes from './routes/user.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

declare global {
  namespace Express {
    interface Request {
      traceId: string
    }
    interface Response {
      sendJson: (payload: {
        code: number
        message: string
        data: unknown
        traceId?: string
      }) => Response
    }
  }
}

initDatabase()

const app: Application = express()

app.use(cors({
  origin: [
    'http://127.0.0.1:49165',
    'http://localhost:49165',
    'http://127.0.0.1:59165',
    'http://localhost:59165',
    /http:\/\/127\.0\.0\.1:\d+/,
    /http:\/\/localhost:\d+/,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use((req: Request, _res: Response, next: NextFunction) => {
  const existingTraceId = req.headers['x-trace-id']
  req.traceId = (typeof existingTraceId === 'string' && existingTraceId) || uuidv4()
  next()
})

app.use((_req: Request, res: Response, next: NextFunction) => {
  res.sendJson = (payload: {
    code: number
    message: string
    data: unknown
    traceId?: string
  }) => {
    const traceId = payload.traceId || _req.traceId
    return res.json({
      code: payload.code,
      message: payload.message,
      data: payload.data,
      traceId,
    })
  }
  next()
})

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/employment', employmentRoutes)
app.use('/api/v1/social-insurance', socialInsuranceRoutes)
app.use('/api/v1/labor-relations', laborRelationsRoutes)
app.use('/api/v1/policy-match', policyMatchRoutes)
app.use('/api/v1/smart-qa', smartQaRoutes)
app.use('/api/v1/outlets', outletsRoutes)
app.use('/api/v1/user', userRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response): void => {
    res.status(200).sendJson({
      code: 0,
      message: 'ok',
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
      traceId: req.traceId,
    })
  },
)

app.use(
  '/api/v1/health',
  (req: Request, res: Response): void => {
    res.status(200).sendJson({
      code: 0,
      message: 'ok',
      data: {
        status: 'healthy',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      },
      traceId: req.traceId,
    })
  },
)

app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
  const errStack = process.env.NODE_ENV === 'development' ? error.stack : undefined
  res.status(500).sendJson({
    code: 500,
    message: process.env.NODE_ENV === 'development' ? `服务器内部错误：${error.message}` : '服务器内部错误',
    data: errStack ? { stack: errStack } : null,
    traceId: req.traceId,
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).sendJson({
    code: 404,
    message: `接口不存在: ${req.method} ${req.originalUrl}`,
    data: null,
    traceId: req.traceId,
  })
})

export default app
