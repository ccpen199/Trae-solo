import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.post('/calculate', (req: Request, res: Response): void => {
  const { total_price, down_payment_pct = 30, loan_years = 30, commercial_rate = 3.95, commercial_amount, fund_rate = 2.85, fund_amount, user_id } = req.body

  const downPayment = total_price * down_payment_pct / 100
  const loanAmount = total_price - downPayment

  let cAmount = commercial_amount || loanAmount
  let fAmount = fund_amount || 0
  if (!commercial_amount && !fund_amount) {
    cAmount = loanAmount
    fAmount = 0
  }
  const actualLoan = cAmount + fAmount
  if (actualLoan > loanAmount) {
    cAmount = loanAmount - fAmount
  }

  const monthlyRateC = commercial_rate / 100 / 12
  const monthlyRateF = fund_rate / 100 / 12
  const months = loan_years * 12

  const calcMonthly = (principal: number, monthlyRate: number) => {
    if (principal <= 0 || monthlyRate <= 0) return 0
    return principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1)
  }

  const monthlyC = calcMonthly(cAmount * 10000, monthlyRateC)
  const monthlyF = calcMonthly(fAmount * 10000, monthlyRateF)
  const totalMonthly = Math.round((monthlyC + monthlyF) * 100) / 100
  const totalRepay = totalMonthly * months
  const totalInterest = totalRepay - (cAmount + fAmount) * 10000

  const result = {
    total_price,
    down_payment: Math.round(downPayment * 100) / 100,
    down_payment_pct,
    loan_amount: Math.round((cAmount + fAmount) * 100) / 100,
    commercial: {
      amount: cAmount,
      rate: commercial_rate,
      monthly: Math.round(monthlyC * 100) / 100,
      total_repay: Math.round(monthlyC * months * 100) / 100,
      total_interest: Math.round((monthlyC * months - cAmount * 10000) * 100) / 100,
    },
    fund: {
      amount: fAmount,
      rate: fund_rate,
      monthly: Math.round(monthlyF * 100) / 100,
      total_repay: Math.round(monthlyF * months * 100) / 100,
      total_interest: Math.round((monthlyF * months - fAmount * 10000) * 100) / 100,
    },
    total_monthly: totalMonthly,
    total_repay: Math.round(totalRepay * 100) / 100,
    total_interest: Math.round(totalInterest * 100) / 100,
    loan_years,
    months,
    schedule: generateSchedule(cAmount * 10000, fAmount * 10000, monthlyRateC, monthlyRateF, months, monthlyC, monthlyF),
  }

  if (user_id) {
    const db = getDb()
    db.prepare(
      `INSERT INTO mortgage_calculations (user_id, total_price, down_payment_pct, loan_years, commercial_rate, commercial_amount, fund_rate, fund_amount, monthly_payment, total_interest, result_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(user_id, total_price, down_payment_pct, loan_years, commercial_rate, cAmount, fund_rate, fAmount, totalMonthly, Math.round(totalInterest * 100) / 100, JSON.stringify(result))
  }

  res.json({ success: true, data: result })
})

function generateSchedule(cPrincipal: number, fPrincipal: number, cRate: number, fRate: number, months: number, cMonthly: number, fMonthly: number) {
  const schedule = []
  let cRemain = cPrincipal
  let fRemain = fPrincipal
  for (let i = 1; i <= Math.min(months, 12); i++) {
    const cInterest = cRemain * cRate
    const cPrincipal_pay = cMonthly - cInterest
    cRemain = Math.max(0, cRemain - cPrincipal_pay)

    const fInterest = fRemain * fRate
    const fPrincipal_pay = fMonthly - fInterest
    fRemain = Math.max(0, fRemain - fPrincipal_pay)

    schedule.push({
      month: i,
      commercial_interest: Math.round(cInterest * 100) / 100,
      commercial_principal: Math.round(cPrincipal_pay * 100) / 100,
      fund_interest: Math.round(fInterest * 100) / 100,
      fund_principal: Math.round(fPrincipal_pay * 100) / 100,
      total_payment: Math.round((cMonthly + fMonthly) * 100) / 100,
      remaining: Math.round((cRemain + fRemain) * 100) / 100,
    })
  }
  return schedule
}

router.get('/history', (req: Request, res: Response): void => {
  const db = getDb()
  const { user_id } = req.query
  if (!user_id) {
    res.json({ success: true, data: [] })
    return
  }
  const rows = db.prepare('SELECT * FROM mortgage_calculations WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(user_id)
  res.json({ success: true, data: rows })
})

export default router
