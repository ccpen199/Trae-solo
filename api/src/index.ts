import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { orderRouter } from './routes/orders.js'
import { trackingRouter } from './routes/tracking.js'
import { packagingRouter } from './routes/packaging.js'
import { claimsRouter } from './routes/claims.js'
import { vehicleRouter } from './routes/vehicles.js'
import { enterpriseRouter } from './routes/enterprise.js'

const app = express()
const PORT = parseInt(process.env.API_PORT || process.env.BACKEND_PORT || '59164', 10)
const HOST = process.env.API_HOST || process.env.HOST || '127.0.0.1'

app.use(cors({
  origin: (process.env.CORS_ORIGIN || '*').split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json({ limit: '10mb' }))
app.use(morgan('dev'))

app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'deppon-logistics-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/v1/orders',
      '/api/v1/tracking',
      '/api/v1/packaging',
      '/api/v1/claims',
      '/api/v1/vehicles',
      '/api/v1/enterprise'
    ]
  })
})

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'deppon-logistics-api',
    version: '1.0.0',
    apiBase: '/api/v1',
    timestamp: new Date().toISOString()
  })
})

app.use('/api/v1/orders', orderRouter)
app.use('/api/v1/tracking', trackingRouter)
app.use('/api/v1/packaging', packagingRouter)
app.use('/api/v1/claims', claimsRouter)
app.use('/api/v1/vehicles', vehicleRouter)
app.use('/api/v1/enterprise', enterpriseRouter)

app.use((_req, res) => {
  res.status(404).json({ code: 404, message: 'API endpoint not found' })
})

app.listen(PORT, HOST, () => {
  console.log(`德邦大件物流 API 服务已启动`)
  console.log(`   地址: http://${HOST}:${PORT}`)
  console.log(`   健康检查: http://${HOST}:${PORT}/api/v1/health`)
  console.log(`   CORS: ${process.env.CORS_ORIGIN || '*'}`)
})

export default app
