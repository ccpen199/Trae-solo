import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { traceRouter } from './routes/trace.js'
import { farmRouter } from './routes/farm.js'
import { logisticsRouter } from './routes/logistics.js'
import { marketRouter } from './routes/market.js'
import { shopRouter } from './routes/shop.js'
import { contractRouter } from './routes/contract.js'
import { knowledgeRouter } from './routes/knowledge.js'
import { supervisionRouter } from './routes/supervision.js'
import { traceRecords, supplyDemandItems, shops, farmPlots, logisticsOrders } from './data/mockData.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env') })

const app = express()
const PORT = Number(process.env.BACKEND_PORT) || 59138
const HOST = process.env.HOST || '127.0.0.1'

app.use(cors({
  origin: 'http://127.0.0.1:49138',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())

function matchesKeyword(item: unknown, keyword: string) {
  if (!keyword) return true
  return JSON.stringify(item).toLowerCase().includes(keyword.toLowerCase())
}

app.get('/api/search', (req, res) => {
  const keyword = String(req.query.q || req.query.keyword || '').trim()
  const traces = traceRecords.filter((item) => matchesKeyword(item, keyword))
  const market = supplyDemandItems.filter((item) => matchesKeyword(item, keyword))
  const stores = shops.filter((item) => matchesKeyword(item, keyword))

  res.json({
    success: true,
    keyword,
    data: {
      traces: traces.length > 0 ? traces : traceRecords,
      market: market.length > 0 ? market : supplyDemandItems.slice(0, 4),
      shops: stores.length > 0 ? stores : shops.slice(0, 3),
    },
    total: (traces.length || traceRecords.length) + (market.length || Math.min(supplyDemandItems.length, 4)) + (stores.length || Math.min(shops.length, 3)),
  })
})

app.get(['/api/admin/stats', '/api/admin/dashboard'], (_req, res) => {
  res.json({
    success: true,
    data: {
      platform: '农链通运营后台',
      totalTraces: traceRecords.length,
      totalSupplyDemand: supplyDemandItems.length,
      totalShops: shops.length,
      farmPlots: farmPlots.length,
      activeLogistics: logisticsOrders.filter((item) => item.status === 'in_transit').length,
      modules: ['溯源查询', '交易市场', '店铺管理', '物流追踪', '监管看板'],
    },
  })
})

app.use('/api/trace', traceRouter)
app.use('/api/farm', farmRouter)
app.use('/api/logistics', logisticsRouter)
app.use('/api/market', marketRouter)
app.use('/api/shop', shopRouter)
app.use('/api/contract', contractRouter)
app.use('/api/knowledge', knowledgeRouter)
app.use('/api/supervision', supervisionRouter)

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: '农链通后端API',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  })
})

app.listen(PORT, HOST, () => {
  console.log(`🚀 农链通后端API已启动: http://${HOST}:${PORT}`)
  console.log(`   健康检查: http://${HOST}:${PORT}/api/health`)
})
