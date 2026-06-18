import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'

const router = Router()

router.post('/calculate', (req: Request, res: Response): void => {
  const db = getDb()
  const { userId, retirementAge, averageSalary, personalIndex } = req.body

  if (!userId || !retirementAge) {
    res.status(400).json({ success: false, error: '缺少必要参数' })
    return
  }

  const user = db.prepare('SELECT * FROM user WHERE id = ?').get(userId)
  if (!user) {
    res.status(404).json({ success: false, error: '用户不存在' })
    return
  }

  const pensionRecord = db.prepare("SELECT * FROM insurance_record WHERE user_id = ? AND insurance_type = 'pension'").get(userId)
  if (!pensionRecord) {
    res.status(404).json({ success: false, error: '未找到养老保险参保记录' })
    return
  }

  const insuredMonths = (pensionRecord as any).insured_months || 0
  const personalAccount = (pensionRecord as any).personal_account || 0

  const avgSalary = averageSalary || 8000
  const index = personalIndex || 1.0
  const months = insuredMonths

  const basePension = avgSalary * (1 + index) / 2 * (months / 12) * 0.01
  const personalPension = personalAccount / (retirementAge === 55 ? 170 : 139)
  const totalPension = Math.round((basePension + personalPension) * 100) / 100

  res.json({
    success: true,
    data: {
      userId,
      retirementAge,
      insuredYears: Math.floor(months / 12),
      insuredMonths: months,
      personalAccountBalance: personalAccount,
      averageSocialSalary: avgSalary,
      personalContributionIndex: index,
      basePension: Math.round(basePension * 100) / 100,
      personalPension: Math.round(personalPension * 100) / 100,
      totalMonthlyPension: totalPension,
      calculationTime: new Date().toISOString()
    }
  })
})

router.get('/estimate/:userId', (req: Request, res: Response): void => {
  const db = getDb()
  const { userId } = req.params

  const pensionRecord = db.prepare("SELECT * FROM insurance_record WHERE user_id = ? AND insurance_type = 'pension'").get(userId)
  if (!pensionRecord) {
    res.status(404).json({ success: false, error: '未找到养老保险参保记录' })
    return
  }

  const insuredMonths = (pensionRecord as any).insured_months || 0
  const personalAccount = (pensionRecord as any).personal_account || 0

  const scenarios = [
    { retirementAge: 50, divisor: 195 },
    { retirementAge: 55, divisor: 170 },
    { retirementAge: 60, divisor: 139 }
  ]

  const estimates = scenarios.map(s => {
    const avgSalary = 8000
    const index = 1.0
    const basePension = avgSalary * (1 + index) / 2 * (insuredMonths / 12) * 0.01
    const personalPension = personalAccount / s.divisor
    return {
      retirementAge: s.retirementAge,
      basePension: Math.round(basePension * 100) / 100,
      personalPension: Math.round(personalPension * 100) / 100,
      totalMonthlyPension: Math.round((basePension + personalPension) * 100) / 100
    }
  })

  res.json({
    success: true,
    data: {
      userId,
      insuredYears: Math.floor(insuredMonths / 12),
      insuredMonths,
      personalAccountBalance: personalAccount,
      estimates
    }
  })
})

export default router
