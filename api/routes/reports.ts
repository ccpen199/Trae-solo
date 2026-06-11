import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.get('/response', auth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const byMonth = db.prepare(
      `SELECT strftime('%Y-%m', created_at) as month,
              COUNT(*) as total,
              SUM(CASE WHEN julianday(updated_at) - julianday(created_at) <= 3 THEN 1 ELSE 0 END) as on_time
       FROM repair_orders
       WHERE created_at >= date('now','-6 months','localtime')
       GROUP BY strftime('%Y-%m', created_at)
       ORDER BY month`
    ).all()

    const avgResponse = db.prepare(
      `SELECT AVG(julianday(updated_at) - julianday(created_at)) * 24 as avg_hours
       FROM repair_orders WHERE status != 'pending'`
    ).get() as any

    const overdueCount = (db.prepare(
      "SELECT COUNT(*) as c FROM repair_orders WHERE julianday(updated_at) - julianday(created_at) > 3 AND status != 'pending'"
    ).get() as any).c
    const totalCompleted = (db.prepare("SELECT COUNT(*) as c FROM repair_orders WHERE status NOT IN ('pending')").get() as any).c
    const overdueRate = totalCompleted > 0 ? Math.round((overdueCount / totalCompleted) * 10000) / 100 : 0

    res.json({ success: true, data: { byMonth, avgResponseHours: Math.round((avgResponse?.avg_hours || 0) * 100) / 100, overdueRate } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/completion', auth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const byCategory = db.prepare(
      `SELECT category, COUNT(*) as total,
              SUM(CASE WHEN status IN ('completed','closed') THEN 1 ELSE 0 END) as completed
       FROM repair_orders GROUP BY category`
    ).all()

    const byMonth = db.prepare(
      `SELECT strftime('%Y-%m', created_at) as month,
              COUNT(*) as total,
              SUM(CASE WHEN status IN ('completed','closed') THEN 1 ELSE 0 END) as completed
       FROM repair_orders
       WHERE created_at >= date('now','-6 months','localtime')
       GROUP BY strftime('%Y-%m', created_at)
       ORDER BY month`
    ).all()

    const total = (db.prepare('SELECT COUNT(*) as c FROM repair_orders').get() as any).c
    const completed = (db.prepare("SELECT COUNT(*) as c FROM repair_orders WHERE status IN ('completed','closed')").get() as any).c
    const completionRate = total > 0 ? Math.round((completed / total) * 10000) / 100 : 0

    res.json({ success: true, data: { byCategory, byMonth, total, completed, completionRate } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/device-online', auth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const byDay = db.prepare(
      `SELECT date(last_heartbeat) as date,
              COUNT(*) as total,
              SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online
       FROM devices
       GROUP BY date(last_heartbeat)
       ORDER BY date DESC LIMIT 30`
    ).all()

    const currentOnline = (db.prepare("SELECT COUNT(*) as c FROM devices WHERE status = 'online'").get() as any).c
    const total = (db.prepare('SELECT COUNT(*) as c FROM devices').get() as any).c
    const onlineRate = total > 0 ? Math.round((currentOnline / total) * 10000) / 100 : 0

    res.json({ success: true, data: { byDay, currentOnline, total, onlineRate } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/payment', auth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const byMonth = db.prepare(
      `SELECT strftime('%Y-%m', created_at) as month,
              COUNT(*) as total,
              SUM(amount) as total_amount,
              SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount,
              SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count
       FROM payments
       WHERE created_at >= date('now','-6 months','localtime')
       GROUP BY strftime('%Y-%m', created_at)
       ORDER BY month`
    ).all()

    const byType = db.prepare(
      `SELECT type, COUNT(*) as total, SUM(amount) as total_amount,
              SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount
       FROM payments GROUP BY type`
    ).all()

    const totalAmount = (db.prepare('SELECT SUM(amount) as a FROM payments').get() as any).a || 0
    const paidAmount = (db.prepare("SELECT SUM(amount) as a FROM payments WHERE status = 'paid'").get() as any).a || 0
    const collectionRate = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 10000) / 100 : 0

    res.json({ success: true, data: { byMonth, byType, totalAmount, paidAmount, collectionRate } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
