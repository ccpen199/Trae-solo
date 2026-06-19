import 'reflect-metadata'
import express, { type Express, type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { initializeDatabase } from './data-source.js'
import { initializeRedis } from './utils/redis.js'
import authRoutes from './routes/auth.js'
import couponRoutes from './routes/coupons.js'
import inventoryRoutes from './routes/inventory.js'
import verificationRoutes from './routes/verification.js'
import riskRoutes from './routes/risk.js'
import reportRoutes from './routes/reports.js'
import alertRoutes from './routes/alerts.js'
import merchantRoutes from './routes/merchants.js'
import provincialRoutes from './routes/provincial.js'
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from './utils/response.js'

const app: Express = express()
const PORT = process.env.API_PORT || 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}

app.get('/health', (req: Request, res: Response) => {
  successResponse(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/coupons', couponRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/verification', verificationRoutes)
app.use('/api/risk', riskRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/merchants', merchantRoutes)
app.use('/api/provincial', provincialRoutes)

app.get('/api', (req: Request, res: Response) => {
  successResponse(res, {
    name: 'Shenyang Welfare Coupon Platform API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      coupons: '/api/coupons',
      inventory: '/api/inventory',
      verification: '/api/verification',
      risk: '/api/risk',
      reports: '/api/reports',
      alerts: '/api/alerts',
      merchants: '/api/merchants',
      provincial: '/api/provincial',
    },
  })
})

app.use((req: Request, res: Response) => {
  notFoundResponse(res, `API endpoint not found: ${req.method} ${req.path}`)
})

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Unhandled error:', err)
  serverErrorResponse(res, err)
})

async function startServer() {
  try {
    console.log('🚀 Starting Shenyang Welfare Coupon Platform API...')
    
    await initializeDatabase()
    console.log('✅ Database initialized')
    
    await initializeRedis()
    console.log('✅ Redis initialized')
    
    app.listen(PORT, () => {
      console.log(`\n🎉 Server is running on http://localhost:${PORT}`)
      console.log(`📊 Health check: http://localhost:${PORT}/health`)
      console.log(`🔧 API root: http://localhost:${PORT}/api`)
      console.log(`\n📝 Default accounts:`)
      console.log(`   - admin / admin123`)
      console.log(`   - merchant / merchant123`)
      console.log(`   - finance / finance123`)
      console.log(`   - risk / risk123`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

if (process.argv[1] && process.argv[1].includes('app.ts')) {
  startServer()
}

export { startServer }
export default app
