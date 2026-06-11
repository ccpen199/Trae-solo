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
import { routingRouter } from './routes/routing.js'
import { auditingRouter } from './routes/auditing.js'

const app = express()
const PORT = parseInt(process.env.API_PORT || '3300', 10)
const HOST = process.env.API_HOST || '0.0.0.0'

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
      '/api/v1/enterprise',
      '/api/v1/routing',
      '/api/v1/auditing'
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
app.use('/api/v1/routing', routingRouter)
app.use('/api/v1/auditing', auditingRouter)

app.get('/api/search', (req, res) => {
  const keyword = String(req.query.q || req.query.keyword || '').trim()
  res.json({
    code: 200,
    data: {
      keyword,
      total: 4,
      list: [
        { type: 'order', title: '在线下单', path: '/order/create', summary: '创建大件运输订单并返回运费估算' },
        { type: 'tracking', title: '运单追踪', path: '/tracking/DB2026061100001', summary: '查看温湿度、震动和位置轨迹' },
        { type: 'packaging', title: '包装报价', path: '/packaging/quote', summary: '按包装类型和体积计算包装费用' },
        { type: 'admin', title: '运营后台', path: '/admin/dashboard', summary: '运营概览、车辆监控、理赔和审核' }
      ]
    }
  })
})

app.get('/api/admin/stats', (_req, res) => {
  res.json({
    code: 200,
    data: {
      todayOrders: 12800,
      activeVehicles: 420,
      onTimeRate: 99.6,
      openClaims: 18,
      alerts: [
        { level: 'warning', message: 'DB2026061100001 温度接近阈值' },
        { level: 'critical', message: 'DB2026061100001 震动超标已确认' }
      ]
    }
  })
})

app.get('/api/admin/dashboard', (_req, res) => {
  res.json({
    code: 200,
    data: {
      kpis: [
        { label: '日均单量', value: '12,800+' },
        { label: '在途车辆', value: '420+' },
        { label: '覆盖城市', value: '330+' },
        { label: '客户好评', value: '99.6%' }
      ],
      modules: ['路由规划', '装卸视频审核', '理赔中心', '车辆监控']
    }
  })
})

app.get('/api/products', (_req, res) => {
  res.json({
    code: 200,
    data: {
      total: 4,
      list: [
        { id: 'large-freight', name: '标准大件运输', priceFrom: 1250, unit: '票' },
        { id: 'precision-device', name: '精密设备运输', priceFrom: 3200, unit: '票' },
        { id: 'cold-chain', name: '冷链大件运输', priceFrom: 2800, unit: '票' },
        { id: 'packaging', name: '专业包装服务', priceFrom: 180, unit: '件' }
      ]
    }
  })
})

app.get('/api/cart', (_req, res) => {
  res.json({
    code: 200,
    data: {
      items: [],
      totalAmount: 0,
      message: '物流服务按订单实时计价，当前报价清单为空'
    }
  })
})

app.use('/api/orders', orderRouter)

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
