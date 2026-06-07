import { Router, type Request, type Response } from 'express'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/info', authMiddleware, (req: Request, res: Response): void => {
  try {
    const user = (req as any).user
    const data = {
      name: user.name || '市民',
      card_number: '3201' + '****' + '1234',
      id_number: '320106****1234',
      insurance_type: '城镇职工基本医疗保险',
      insurance_status: '正常参保',
      base_salary: 8000,
      personal_ratio: '8%',
      company_ratio: '16%',
      personal_monthly: 640,
      company_monthly: 1280,
      accumulated_personal: 38400,
      accumulated_company: 76800,
      total_accumulated: 115200,
      medical_balance: 12580.50,
      last_payment: '2026-05',
      payment_months: 60,
    }
    res.json({ code: 0, message: 'success', data })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.get('/records', authMiddleware, (req: Request, res: Response): void => {
  try {
    const records = []
    for (let i = 0; i < 12; i++) {
      const month = i + 1
      records.push({
        period: `2026-${String(month).padStart(2, '0')}`,
        base: 8000,
        personal_amount: 640,
        company_amount: 1280,
        status: month <= 5 ? '已缴' : '待缴',
        payment_date: month <= 5 ? `2026-${String(month).padStart(2, '0')}-15` : null,
      })
    }
    res.json({ code: 0, message: 'success', data: records })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

export default router
