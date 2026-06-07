import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
import { getDb } from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

const STORAGE_RATES: Record<string, { hourly: number; daily: number; monthly: number }> = {
  small: { hourly: 2, daily: 30, monthly: 600 },
  medium: { hourly: 3, daily: 45, monthly: 900 },
  large: { hourly: 5, daily: 70, monthly: 1400 },
  xlarge: { hourly: 8, daily: 100, monthly: 2000 },
}

function calculateBillingAmount(startTime: string, endTime: string, compartmentSize: string, billingType: string): { amount: number; total_hours: number; breakdown: Record<string, unknown> } {
  const start = dayjs(startTime)
  const end = dayjs(endTime)
  const rates = STORAGE_RATES[compartmentSize] || STORAGE_RATES.small

  const totalMinutes = end.diff(start, 'minute')
  const totalHours = Math.ceil(totalMinutes / 60)
  const totalDays = Math.ceil(totalMinutes / (60 * 24))

  if (billingType === 'monthly') {
    const months = Math.max(1, Math.ceil(totalMinutes / (60 * 24 * 30)))
    const monthlyAmount = months * rates.monthly
    return {
      amount: monthlyAmount,
      total_hours: totalHours,
      breakdown: { months, monthly_rate: rates.monthly, type: 'monthly' },
    }
  }

  if (billingType === 'daily') {
    const dailyAmount = totalDays * rates.daily
    const monthlyCap = rates.monthly
    const amount = Math.min(dailyAmount, monthlyCap)
    return {
      amount,
      total_hours: totalHours,
      breakdown: { total_days: totalDays, daily_rate: rates.daily, daily_amount: dailyAmount, monthly_cap: monthlyCap, capped: dailyAmount > monthlyCap, type: 'daily' },
    }
  }

  const first24hHours = Math.min(totalHours, 24)
  const first24hAmount = Math.min(first24hHours * rates.hourly, rates.daily)

  if (totalHours <= 24) {
    return {
      amount: first24hAmount,
      total_hours: totalHours,
      breakdown: { hours: first24hHours, hourly_rate: rates.hourly, raw_hourly: first24hHours * rates.hourly, daily_cap: rates.daily, type: 'hourly_24h' },
    }
  }

  const remainingHours = totalHours - 24
  const remainingDays = Math.ceil(remainingHours / 24)
  const remainingAmount = remainingDays * rates.daily
  let totalAmount = first24hAmount + remainingAmount

  const monthlyCap = rates.monthly
  if (totalAmount > monthlyCap) {
    totalAmount = monthlyCap
  }

  return {
    amount: totalAmount,
    total_hours: totalHours,
    breakdown: {
      first_24h: { hours: first24hHours, hourly_rate: rates.hourly, raw: first24hHours * rates.hourly, capped: first24hAmount },
      remaining: { days: remainingDays, daily_rate: rates.daily, amount: remainingAmount },
      subtotal: first24hAmount + remainingAmount,
      monthly_cap: monthlyCap,
      capped: first24hAmount + remainingAmount > monthlyCap,
      type: 'hourly_tiered',
    },
  }
}

router.get('/rates', (req: Request, res: Response): void => {
  res.json({ success: true, data: STORAGE_RATES })
})

router.post('/calculate', (req: Request, res: Response): void => {
  try {
    const { start_time, end_time, compartment_size, billing_type } = req.body

    if (!start_time || !end_time || !compartment_size) {
      res.status(400).json({ success: false, error: '开始时间、结束时间和格口大小为必填项' })
      return
    }

    const type = billing_type || 'hourly'
    const result = calculateBillingAmount(start_time, end_time, compartment_size, type)

    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Calculate billing error:', error)
    res.status(500).json({ success: false, error: '计算存储费用失败' })
  }
})

router.post('/start', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { compartment_id, package_id, billing_type } = req.body

    if (!compartment_id) {
      res.status(400).json({ success: false, error: '格口ID为必填项' })
      return
    }

    const db = getDb()
    const compartment = db.prepare('SELECT * FROM compartments WHERE id = ?').get(compartment_id) as Record<string, unknown> | undefined
    if (!compartment) {
      res.status(404).json({ success: false, error: '格口不存在' })
      return
    }

    const size = compartment.size as string
    const type = billing_type || 'hourly'
    const rates = STORAGE_RATES[size] || STORAGE_RATES.small
    const ratePerUnit = type === 'hourly' ? rates.hourly : type === 'daily' ? rates.daily : rates.monthly

    const id = uuidv4()
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

    db.prepare(`
      INSERT INTO storage_billings (id, user_id, compartment_id, package_id, billing_type, rate_per_unit, start_time, end_time, total_hours, total_amount, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 0, 0, 'active', ?, ?)
    `).run(id, req.user!.id, compartment_id, package_id || null, type, ratePerUnit, now, now, now)

    const billing = db.prepare(`
      SELECT sb.*, cmp.code as compartment_code, cmp.size as compartment_size, c.name as cabinet_name
      FROM storage_billings sb
      LEFT JOIN compartments cmp ON sb.compartment_id = cmp.id
      LEFT JOIN cabinets c ON cmp.cabinet_id = c.id
      WHERE sb.id = ?
    `).get(id)

    res.status(201).json({ success: true, data: billing })
  } catch (error) {
    console.error('Start storage billing error:', error)
    res.status(500).json({ success: false, error: '启动存储计费失败' })
  }
})

router.get('/billing/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const billing = db.prepare(`
      SELECT sb.*, cmp.code as compartment_code, cmp.size as compartment_size, c.name as cabinet_name
      FROM storage_billings sb
      LEFT JOIN compartments cmp ON sb.compartment_id = cmp.id
      LEFT JOIN cabinets c ON cmp.cabinet_id = c.id
      WHERE sb.id = ?
    `).get(req.params.id) as Record<string, unknown> | undefined

    if (!billing) {
      res.status(404).json({ success: false, error: '计费记录不存在' })
      return
    }

    let currentAmount = billing.total_amount as number
    let currentHours = billing.total_hours as number

    if (billing.status === 'active') {
      const size = billing.compartment_size as string || 'small'
      const result = calculateBillingAmount(
        billing.start_time as string,
        dayjs().format('YYYY-MM-DD HH:mm:ss'),
        size,
        billing.billing_type as string,
      )
      currentAmount = result.amount
      currentHours = result.total_hours
    }

    res.json({
      success: true,
      data: {
        ...billing,
        current_amount: currentAmount,
        current_hours: currentHours,
      },
    })
  } catch (error) {
    console.error('Get billing error:', error)
    res.status(500).json({ success: false, error: '获取计费详情失败' })
  }
})

router.post('/billing/:id/settle', authMiddleware, (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const billing = db.prepare('SELECT * FROM storage_billings WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!billing) {
      res.status(404).json({ success: false, error: '计费记录不存在' })
      return
    }

    if (billing.status !== 'active') {
      res.status(400).json({ success: false, error: '该计费记录已结算' })
      return
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const compartment = db.prepare('SELECT size FROM compartments WHERE id = ?').get(billing.compartment_id) as { size: string } | undefined
    const size = compartment?.size || 'small'

    const result = calculateBillingAmount(
      billing.start_time as string,
      now,
      size,
      billing.billing_type as string,
    )

    const settleBilling = db.transaction(() => {
      db.prepare(`
        UPDATE storage_billings SET end_time = ?, total_hours = ?, total_amount = ?, status = 'settled', updated_at = ?
        WHERE id = ?
      `).run(now, result.total_hours, result.amount, now, req.params.id)

      if (billing.compartment_id) {
        db.prepare('UPDATE compartments SET status = ?, current_package_id = NULL, updated_at = ? WHERE id = ? AND current_package_id = ?')
          .run('available', now, billing.compartment_id as string, billing.package_id as string | null)
      }
    })

    settleBilling()

    const settled = db.prepare(`
      SELECT sb.*, cmp.code as compartment_code, cmp.size as compartment_size
      FROM storage_billings sb
      LEFT JOIN compartments cmp ON sb.compartment_id = cmp.id
      WHERE sb.id = ?
    `).get(req.params.id)

    res.json({
      success: true,
      data: {
        ...(settled as Record<string, unknown>),
        breakdown: result.breakdown,
      },
    })
  } catch (error) {
    console.error('Settle billing error:', error)
    res.status(500).json({ success: false, error: '结算存储费用失败' })
  }
})

router.get('/user/billings', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { status } = req.query
    const db = getDb()

    let sql = `
      SELECT sb.*, cmp.code as compartment_code, cmp.size as compartment_size, c.name as cabinet_name
      FROM storage_billings sb
      LEFT JOIN compartments cmp ON sb.compartment_id = cmp.id
      LEFT JOIN cabinets c ON cmp.cabinet_id = c.id
      WHERE sb.user_id = ?
    `
    const params: unknown[] = [req.user!.id]

    if (status) {
      sql += ' AND sb.status = ?'
      params.push(status)
    }

    sql += ' ORDER BY sb.created_at DESC'
    const billings = db.prepare(sql).all(...params)

    const enriched = billings.map((b: Record<string, unknown>) => {
      if (b.status === 'active') {
        const size = b.compartment_size as string || 'small'
        const result = calculateBillingAmount(b.start_time as string, dayjs().format('YYYY-MM-DD HH:mm:ss'), size, b.billing_type as string)
        return { ...b, current_amount: result.amount, current_hours: result.total_hours }
      }
      return b
    })

    res.json({ success: true, data: enriched })
  } catch (error) {
    console.error('List user billings error:', error)
    res.status(500).json({ success: false, error: '获取用户计费列表失败' })
  }
})

export default router
