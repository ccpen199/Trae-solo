import { Router } from 'express'
import { supervisionData, shops } from '../data/mockData.js'

export const supervisionRouter = Router()

supervisionRouter.get('/', (_req, res) => {
  res.json(supervisionData)
})

supervisionRouter.get('/report', (_req, res) => {
  res.json({
    trendData: supervisionData.trendData,
    categoryStats: supervisionData.categoryStats,
    regionStats: supervisionData.regionStats
  })
})

supervisionRouter.get('/stats', (_req, res) => {
  const onlineMerchants = shops.length
  const totalTransactionAmount = 2868000
  res.json({
    totalBatches: supervisionData.totalBatches,
    tracedBatches: supervisionData.tracedBatches,
    traceRate: supervisionData.traceRate,
    passRate: supervisionData.passRate,
    onlineMerchants,
    todayQueries: Math.floor(Math.random() * 200) + 800,
    totalTransactionAmount
  })
})
