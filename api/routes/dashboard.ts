import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.get('/overview', (_req: Request, res: Response): void => {
  const onlineRiders = (db.prepare("SELECT COUNT(*) as count FROM riders WHERE status = 'online'").get() as any).count
  const pendingOrders = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").get() as any).count
  const todayCompleted = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'completed' AND date(updated_at) = date('now', 'localtime')").get() as any).count
  const deliveringOrders = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'delivering'").get() as any).count
  const totalRiders = (db.prepare("SELECT COUNT(*) as count FROM riders").get() as any).count
  const totalOrders = (db.prepare("SELECT COUNT(*) as count FROM orders").get() as any).count
  const totalAlerts = (db.prepare("SELECT COUNT(*) as count FROM alerts WHERE status = 'pending'").get() as any).count
  const abnormalTrajectories = (db.prepare("SELECT COUNT(*) as count FROM trajectories WHERE is_abnormal = 1 AND date(timestamp) = date('now', 'localtime')").get() as any).count

  res.json({
    success: true,
    data: {
      online_riders: onlineRiders,
      pending_orders: pendingOrders,
      today_completed: todayCompleted,
      delivering_orders: deliveringOrders,
      total_riders: totalRiders,
      total_orders: totalOrders,
      total_alerts: totalAlerts,
      abnormal_trajectories: abnormalTrajectories,
    },
  })
})

router.get('/fulfillment', (_req: Request, res: Response): void => {
  const fulfillment = db
    .prepare(
      `SELECT z.id as zone_id, z.name as zone_name,
       COUNT(o.id) as total_orders,
       SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
       ROUND(SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(o.id), 1) as fulfillment_rate
       FROM dispatch_zones z
       LEFT JOIN orders o ON o.zone_id = z.id
       GROUP BY z.id ORDER BY z.id`,
    )
    .all()

  res.json({ success: true, data: fulfillment })
})

router.get('/roi', (_req: Request, res: Response): void => {
  const roi = db
    .prepare(
      `SELECT z.id as zone_id, z.name as zone_name,
       SUM(i.total_amount) as total_income,
       COUNT(DISTINCT i.order_id) as completed_orders,
       ROUND(SUM(i.total_amount) / NULLIF(COUNT(DISTINCT i.order_id), 0), 2) as avg_income_per_order,
       COUNT(DISTINCT i.rider_id) as active_riders,
       ROUND(SUM(i.total_amount) / NULLIF(COUNT(DISTINCT i.rider_id), 0), 2) as income_per_rider
       FROM dispatch_zones z
       LEFT JOIN orders o ON o.zone_id = z.id
       LEFT JOIN incomes i ON i.order_id = o.id
       GROUP BY z.id ORDER BY z.id`,
    )
    .all()

  res.json({ success: true, data: roi })
})

router.get('/trends', (_req: Request, res: Response): void => {
  const ordersByHour = db
    .prepare(
      `SELECT strftime('%H', created_at) as hour, COUNT(*) as count 
       FROM orders 
       WHERE created_at >= datetime('now', '-24 hours', 'localtime') 
       GROUP BY hour ORDER BY hour`,
    )
    .all()

  const ridersByHour = db
    .prepare(
      `SELECT strftime('%H', updated_at) as hour, 
       SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online_count
       FROM riders 
       WHERE updated_at >= datetime('now', '-24 hours', 'localtime') 
       GROUP BY hour ORDER BY hour`,
    )
    .all()

  res.json({ success: true, data: { orders_by_hour: ordersByHour, riders_by_hour: ridersByHour } })
})

export default router
