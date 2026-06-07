import { Router, type Request, type Response } from 'express'
import dayjs from 'dayjs'
import db from '../db.js'
import { authMiddleware } from './auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/bills', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const { period, status } = req.query

    let sql = 'SELECT * FROM electricity_bills WHERE user_id = ?'
    const params: any[] = [userId]

    if (period) { sql += ' AND billing_period = ?'; params.push(period as string) }
    if (status) { sql += ' AND status = ?'; params.push(status as string) }

    sql += ' ORDER BY billing_period DESC'
    const bills = db.prepare(sql).all(...params)
    res.json({ success: true, data: bills })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/bills/unpaid', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const bills = db.prepare(`
      SELECT * FROM electricity_bills
      WHERE user_id = ? AND status IN ('unpaid', 'overdue')
      ORDER BY due_date ASC
    `).all(userId)
    res.json({ success: true, data: bills })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/bills/analysis', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id

    const monthlyTrend = db.prepare(`
      SELECT billing_period, SUM(total_kwh) as total_kwh, SUM(total_amount) as total_amount,
             SUM(peak_kwh) as peak_kwh, SUM(valley_kwh) as valley_kwh, SUM(flat_kwh) as flat_kwh
      FROM electricity_bills WHERE user_id = ?
      GROUP BY billing_period ORDER BY billing_period
    `).all(userId)

    const totals = db.prepare(`
      SELECT SUM(total_kwh) as total_kwh, SUM(peak_kwh) as peak_kwh,
             SUM(valley_kwh) as valley_kwh, SUM(flat_kwh) as flat_kwh,
             SUM(total_amount) as total_amount, SUM(peak_amount) as peak_amount,
             SUM(valley_amount) as valley_amount, SUM(flat_amount) as flat_amount
      FROM electricity_bills WHERE user_id = ?
    `).get(userId) as any

    const statusSummary = db.prepare(`
      SELECT status, COUNT(*) as count, SUM(total_amount) as total_amount
      FROM electricity_bills WHERE user_id = ? GROUP BY status
    `).all(userId)

    const peakValleyBreakdown = {
      peak_ratio: totals?.total_kwh ? (totals.peak_kwh / totals.total_kwh).toFixed(2) : 0,
      valley_ratio: totals?.total_kwh ? (totals.valley_kwh / totals.total_kwh).toFixed(2) : 0,
      flat_ratio: totals?.total_kwh ? (totals.flat_kwh / totals.total_kwh).toFixed(2) : 0,
    }

    res.json({
      success: true,
      data: { monthlyTrend, peakValleyBreakdown, statusSummary, totals }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/bills/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const bill = db.prepare('SELECT * FROM electricity_bills WHERE id = ? AND user_id = ?').get(req.params.id, userId)
    if (!bill) {
      res.status(404).json({ success: false, error: '账单不存在' })
      return
    }
    res.json({ success: true, data: bill })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/bills/:id/pay', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const { payment_method = 'demo_wallet' } = req.body || {}

    if (!payment_method) {
      res.status(400).json({ success: false, error: '请选择支付方式' })
      return
    }

    const bill = db.prepare('SELECT * FROM electricity_bills WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any
    if (!bill) {
      res.status(404).json({ success: false, error: '账单不存在' })
      return
    }
    if (bill.status === 'paid') {
      res.status(400).json({ success: false, error: '账单已支付' })
      return
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const transactionNo = 'TXN' + dayjs().format('YYYYMMDDHHmmss') + String(bill.id).padStart(6, '0')

    db.prepare("UPDATE electricity_bills SET status = 'paid', paid_at = ? WHERE id = ?").run(now, bill.id)
    db.prepare(`
      INSERT INTO payments (user_id, bill_id, amount, payment_method, transaction_no, paid_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, bill.id, bill.total_amount, payment_method, transactionNo, now)

    db.prepare(`
      INSERT INTO points_transactions (user_id, type, amount, source, description)
      VALUES (?, 'earn', ?, 'bill_pay', ?)
    `).run(userId, Math.floor(bill.total_amount), `缴纳电费${bill.billing_period}期奖励积分`)

    db.prepare('UPDATE users SET points_balance = points_balance + ? WHERE id = ?').run(Math.floor(bill.total_amount), userId)

    res.json({ success: true, data: { transaction_no: transactionNo, paid_at: now }, message: '支付成功' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/outages', async (req: Request, res: Response): Promise<void> => {
  try {
    const { area, status } = req.query
    let sql = 'SELECT * FROM outage_notices WHERE 1=1'
    const params: any[] = []

    if (area) { sql += ' AND area LIKE ?'; params.push(`%${area}%`) }
    if (status) { sql += ' AND status = ?'; params.push(status as string) }

    sql += ' ORDER BY start_time DESC'
    const outages = db.prepare(sql).all(...params)
    res.json({ success: true, data: outages })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/outages/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const outage = db.prepare('SELECT * FROM outage_notices WHERE id = ?').get(req.params.id)
    if (!outage) {
      res.status(404).json({ success: false, error: '停电通知不存在' })
      return
    }
    res.json({ success: true, data: outage })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/price-tariff', async (req: Request, res: Response): Promise<void> => {
  try {
    const customerType = (req as any).user.customer_type
    const now = dayjs()
    const hour = now.hour()

    let periodType = 'flat'
    if (hour >= 7 && hour < 10) periodType = 'peak'
    else if (hour >= 10 && hour < 15) periodType = 'flat'
    else if (hour >= 15 && hour < 21) periodType = 'peak'
    else if (hour >= 21 && hour < 23) periodType = 'flat'
    else periodType = 'valley'

    const tariffs = db.prepare(`
      SELECT * FROM price_tariffs 
      WHERE customer_type = ? AND effective_to IS NULL
    `).all(customerType) as any[]

    const currentTariff = tariffs.find((t: any) => t.period_type === periodType)

    const timeSlots = [
      { period: 'peak', name: '峰时', hours: '07:00-10:00, 15:00-21:00' },
      { period: 'flat', name: '平时', hours: '10:00-15:00, 21:00-23:00' },
      { period: 'valley', name: '谷时', hours: '23:00-07:00' }
    ]

    res.json({
      success: true,
      data: {
        currentPeriod: periodType,
        currentPeriodName: timeSlots.find(s => s.period === periodType)?.name,
        currentPrice: currentTariff?.price_per_kwh || 0,
        tariffs: tariffs.map((t: any) => ({
          ...t,
          period_name: timeSlots.find(s => s.period === t.period_type)?.name,
          hours: timeSlots.find(s => s.period === t.period_type)?.hours
        })),
        now: now.format('YYYY-MM-DD HH:mm:ss')
      }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/meter-realtime', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id

    const latestReading = db.prepare(`
      SELECT mr.*, eb.meter_no, u.real_name
      FROM meter_readings mr
      JOIN users u ON mr.user_id = u.id
      LEFT JOIN electricity_bills eb ON eb.user_id = u.id
      WHERE mr.user_id = ?
      ORDER BY mr.reading_time DESC
      LIMIT 1
    `).get(userId) as any

    if (!latestReading) {
      res.status(404).json({ success: false, error: '暂无电表数据' })
      return
    }

    const yesterday = dayjs().subtract(1, 'day').toDate()
    const yesterdayReading = db.prepare(`
      SELECT reading_kwh FROM meter_readings 
      WHERE user_id = ? AND reading_time < ?
      ORDER BY reading_time DESC
      LIMIT 1
    `).get(userId, yesterday.toISOString()) as any

    const todayUsage = yesterdayReading 
      ? latestReading.reading_kwh - yesterdayReading.reading_kwh 
      : 0

    res.json({
      success: true,
      data: {
        ...latestReading,
        today_usage: parseFloat(todayUsage.toFixed(2)),
        estimated_monthly_usage: parseFloat((todayUsage * 30).toFixed(2))
      }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/outages/acknowledgements', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const acks = db.prepare(`
      SELECT * FROM outage_acknowledgements 
      WHERE user_id = ?
      ORDER BY acknowledged_at DESC
    `).all(userId)
    res.json({ success: true, data: acks })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/outages/:id/acknowledge', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const outageId = req.params.id

    const outage = db.prepare('SELECT * FROM outage_notices WHERE id = ?').get(outageId)
    if (!outage) {
      res.status(404).json({ success: false, error: '停电通知不存在' })
      return
    }

    const existingAck = db.prepare(`
      SELECT * FROM outage_acknowledgements 
      WHERE outage_id = ? AND user_id = ?
    `).get(outageId, userId)

    if (existingAck) {
      res.status(400).json({ success: false, error: '您已确认过此停电通知' })
      return
    }

    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO outage_acknowledgements (outage_id, user_id, acknowledged_at)
        VALUES (?, ?, ?)
      `).run(outageId, userId, dayjs().format('YYYY-MM-DD HH:mm:ss'))

      db.prepare(`
        UPDATE outage_notices 
        SET notified_users = notified_users + 1 
        WHERE id = ?
      `).run(outageId)
    })

    tx()

    const ack = db.prepare(`
      SELECT * FROM outage_acknowledgements 
      WHERE outage_id = ? AND user_id = ?
    `).get(outageId, userId)

    res.json({ success: true, data: ack, message: '确认成功' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
