import { Router } from 'express'
import { traceRecords, farmPlots, logisticsOrders, shops } from '../data/mockData.js'

export const traceRouter = Router()

traceRouter.get('/stats', (_req, res) => {
  const total = traceRecords.length
  const todayQueries = Math.floor(Math.random() * 200) + 800
  const traceRate = 90.7
  res.json({
    totalTraces: total,
    todayQueries,
    traceRate
  })
})

traceRouter.get('/:code/full', (req, res) => {
  const record = traceRecords.find(r => r.traceCode === req.params.code)
  if (!record) {
    return res.status(404).json({ error: '溯源记录未找到' })
  }

  const matchedFarmPlot = farmPlots.find(fp => {
    const node = record.nodes.find(n => n.stage === 'production')
    return node && fp.location && record.origin.includes('寿光') ? fp.id === 'FP-002' :
           node && fp.location && record.origin.includes('五常') ? fp.id === 'FP-001' :
           node && fp.location && record.origin.includes('阿克苏') ? fp.id === 'FP-003' : false
  })

  const matchedLogistics = logisticsOrders.find(lo => lo.batchNo === record.batchNo)

  const matchedShopProduct = shops.flatMap(s => s.products).find(p => p.traceCode === record.traceCode)
  const matchedShop = matchedShopProduct ? shops.find(s => s.products.some(p => p.traceCode === record.traceCode)) : null

  res.json({
    trace: record,
    farmPlot: matchedFarmPlot || null,
    logistics: matchedLogistics || null,
    shop: matchedShop ? { id: matchedShop.id, name: matchedShop.name } : null,
    product: matchedShopProduct || null
  })
})

traceRouter.get('/:code', (req, res) => {
  const record = traceRecords.find(r => r.traceCode === req.params.code)
  if (!record) {
    return res.status(404).json({ error: '溯源记录未找到' })
  }
  res.json(record)
})

traceRouter.get('/', (_req, res) => {
  res.json(traceRecords)
})
