import { Router } from 'express'
import { CITIES, mockCityMetrics, mockCrossCityFlows } from '../../shared/data.js'

const router = Router()

router.get('/summary', (_req, res) => {
  const totalMembers = CITIES.reduce((sum, c) => sum + c.memberCount, 0)
  const totalMerchants = CITIES.reduce((sum, c) => sum + c.merchantCount, 0)
  res.json({
    totalGmv: 163000000,
    totalMerchants,
    totalMembers,
    crossCityTransactions: 156000,
  })
})

router.get('/metrics', (_req, res) => {
  res.json(mockCityMetrics)
})

router.get('/cross-city-flows', (_req, res) => {
  const flows = [...mockCrossCityFlows].sort((a, b) => b.amount - a.amount)
  res.json(flows)
})

export default router
