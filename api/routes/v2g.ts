import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'

const router = Router()

const v2gStrategies = new Map<string, any>()

const peakValleyPrices = {
  peak: { price: 1.2, start: '08:00', end: '21:00' },
  flat: { price: 0.85, start: '06:00', end: '08:00' },
  valley: { price: 0.35, start: '23:00', end: '06:00' },
}

router.get('/strategies', (req: Request, res: Response): void => {
  try {
    const userId = String(req.query.userId || 'user-001')

    const userStrategies = Array.from(v2gStrategies.values()).filter(s => s.userId === userId)
    if (userStrategies.length === 0) {
      const defaultStrategy = {
        id: uuidv4(),
        userId,
        mode: 'smart',
        minSoc: 30,
        maxDischargeKwh: 20,
        preferredDischargePeriod: 'peak',
        enabled: true,
      }
      v2gStrategies.set(defaultStrategy.id, defaultStrategy)
      res.json({ success: true, data: [defaultStrategy] })
      return
    }

    res.json({ success: true, data: userStrategies })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.post('/strategies', (req: Request, res: Response): void => {
  try {
    const { userId, mode = 'smart', minSoc = 30, maxDischargeKwh = 20, preferredDischargePeriod = 'peak', enabled = true } = req.body
    if (!userId) {
      res.status(400).json({ success: false, error: '缺少 userId 参数' })
      return
    }

    const id = uuidv4()
    const strategy = { id, userId, mode, minSoc, maxDischargeKwh, preferredDischargePeriod, enabled }
    v2gStrategies.set(id, strategy)

    res.json({ success: true, data: strategy })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.put('/strategies/:id', (req: Request, res: Response): void => {
  try {
    const existing = v2gStrategies.get(req.params.id)
    if (!existing) {
      res.status(404).json({ success: false, error: '策略未找到' })
      return
    }

    const updated = { ...existing, ...req.body, id: existing.id, userId: existing.userId }
    v2gStrategies.set(req.params.id, updated)

    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/revenue-estimate', (req: Request, res: Response): void => {
  try {
    const { batteryCapacity = '60', dailyDischargeKwh = '15', days = '30' } = req.query

    const capacity = parseFloat(batteryCapacity as string)
    const dailyKwh = parseFloat(dailyDischargeKwh as string)
    const numDays = parseInt(days as string, 10)

    const peakRevenue = dailyKwh * peakValleyPrices.peak.price
    const valleyCost = dailyKwh * peakValleyPrices.valley.price
    const dailyProfit = peakRevenue - valleyCost
    const monthlyProfit = dailyProfit * numDays
    const annualProfit = dailyProfit * 365

    const batteryDegradationCost = dailyKwh * 0.05
    const netDailyProfit = dailyProfit - batteryDegradationCost

    const hourlyBreakdown = Array.from({ length: 24 }, (_, hour) => {
      let period: 'peak' | 'flat' | 'valley' = 'flat'
      if (hour >= 8 && hour < 21) period = 'peak'
      else if (hour >= 23 || hour < 6) period = 'valley'

      const dischargeKwh = period === 'peak' ? dailyKwh * 0.7 : (period === 'flat' ? dailyKwh * 0.2 : 0)
      const chargeKwh = period === 'valley' ? dailyKwh : (period === 'flat' ? dailyKwh * 0.3 : 0)

      return {
        hour: `${String(hour).padStart(2, '0')}:00`,
        period,
        pricePerKwh: peakValleyPrices[period].price,
        dischargeKwh: +dischargeKwh.toFixed(2),
        chargeKwh: +chargeKwh.toFixed(2),
        revenue: +(dischargeKwh * peakValleyPrices[period].price).toFixed(2),
        cost: +(chargeKwh * peakValleyPrices[period].price).toFixed(2),
      }
    })

    res.json({
      success: true,
      data: {
        summary: {
          batteryCapacity: capacity,
          dailyDischargeKwh: dailyKwh,
          dailyGrossProfit: +dailyProfit.toFixed(2),
          dailyNetProfit: +netDailyProfit.toFixed(2),
          monthlyProfit: +monthlyProfit.toFixed(2),
          annualProfit: +annualProfit.toFixed(2),
          batteryDegradationCost: +batteryDegradationCost.toFixed(2),
        },
        priceConfig: peakValleyPrices,
        hourlyBreakdown,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

export default router
