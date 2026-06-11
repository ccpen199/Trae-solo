import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.post('/estimate', (req: Request, res: Response): void => {
  const { deviceId, condition, usageMonths, repairHistory } = req.body

  if (!deviceId || !condition || usageMonths === undefined) {
    res.status(400).json({ success: false, error: '请提供设备ID、设备成色和使用月数' })
    return
  }

  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(deviceId) as any
  if (!device) {
    res.status(404).json({ success: false, error: '设备不存在' })
    return
  }

  const originalPrice = device.original_price || 1000
  const currentYear = new Date().getFullYear()
  const deviceAge = currentYear - (device.release_year || currentYear)

  const appearanceScore = condition.appearance || 3
  const screenScore = condition.screen || 3
  const batteryHealth = condition.battery || 80
  const functionsOk = condition.functions
    ? (condition.functions as { name: string; working: boolean }[]).filter((f) => f.working).length /
      Math.max((condition.functions as { name: string; working: boolean }[]).length, 1)
    : 0.8

  const ageDepreciation = Math.max(0, 1 - deviceAge * 0.2 - (usageMonths / 12) * 0.15)
  const conditionFactor = ((appearanceScore + screenScore) / 10) * 0.4 + (batteryHealth / 100) * 0.3 + functionsOk * 0.3
  const repairPenalty = repairHistory && repairHistory.length > 0 ? Math.max(0.7, 1 - repairHistory.length * 0.1) : 1
  const marketFactor = 0.85 + Math.random() * 0.15

  const estimatedPrice = Math.round(originalPrice * ageDepreciation * conditionFactor * repairPenalty * marketFactor)
  const priceMin = Math.round(estimatedPrice * 0.85)
  const priceMax = Math.round(estimatedPrice * 1.15)

  const marketTrend = []
  const trendBase = estimatedPrice
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const fluctuation = (Math.random() - 0.5) * 0.06
    const trend = i > 15 ? 0.01 : -0.005
    marketTrend.push({
      date: d.toISOString().slice(0, 10),
      price: Math.round(trendBase * (1 + fluctuation + trend * (30 - i) / 30)),
    })
  }

  res.json({
    success: true,
    data: {
      deviceId: device.id,
      deviceName: `${device.brand} ${device.model}`,
      originalPrice,
      estimatedPrice,
      priceRange: { min: priceMin, max: priceMax },
      depreciation: {
        ageDepreciation: Math.round(ageDepreciation * 100) / 100,
        conditionFactor: Math.round(conditionFactor * 100) / 100,
        repairPenalty,
        marketFactor: Math.round(marketFactor * 100) / 100,
      },
      marketTrend,
    },
  })
})

export default router
