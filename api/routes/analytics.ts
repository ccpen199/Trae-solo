import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/overview', (req: Request, res: Response): void => {
  try {
    const totalRiders = (db.prepare('SELECT COUNT(*) as count FROM riders').get() as any).count
    const onlineRiders = (db.prepare("SELECT COUNT(*) as count FROM riders WHERE status = 'online'").get() as any).count
    const noviceRiders = (db.prepare('SELECT COUNT(*) as count FROM riders WHERE is_novice = 1').get() as any).count
    const totalOrders = (db.prepare('SELECT COUNT(*) as count FROM delivery_orders').get() as any).count
    const pendingOrders = (db.prepare("SELECT COUNT(*) as count FROM delivery_orders WHERE status = 'pending'").get() as any).count
    const deliveredOrders = (db.prepare("SELECT COUNT(*) as count FROM delivery_orders WHERE status = 'delivered'").get() as any).count
    const timeoutOrders = (db.prepare("SELECT COUNT(*) as count FROM delivery_orders WHERE status = 'timeout'").get() as any).count
    const activeAlerts = (db.prepare('SELECT COUNT(*) as count FROM monitoring_alerts WHERE resolved = 0').get() as any).count
    const totalIncome = (db.prepare("SELECT COALESCE(SUM(base_fee + reward + subsidy), 0) as total FROM delivery_orders WHERE status = 'delivered'").get() as any).total

    res.json({
      success: true,
      data: {
        riders: { total: totalRiders, online: onlineRiders, novice: noviceRiders },
        orders: { total: totalOrders, pending: pendingOrders, delivered: deliveredOrders, timeout: timeoutOrders },
        alerts: { active: activeAlerts },
        income: { total: totalIncome }
      }
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/riders/income', (req: Request, res: Response): void => {
  try {
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20))
    const incomeData = db.prepare(
      `SELECT r.id, r.name, r.phone, r.total_orders, r.total_income,
              COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN o.base_fee ELSE 0 END), 0) as base_fee_sum,
              COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN o.reward ELSE 0 END), 0) as reward_sum,
              COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN o.subsidy ELSE 0 END), 0) as subsidy_sum
       FROM riders r
       LEFT JOIN delivery_orders o ON r.id = o.rider_id
       GROUP BY r.id
       ORDER BY r.total_income DESC
       LIMIT ?`
    ).all(limit)

    res.json({ success: true, data: incomeData })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/violations/cluster', (req: Request, res: Response): void => {
  try {
    const byType = db.prepare(
      `SELECT type, COUNT(*) as count, AVG(penalty_points) as avg_penalty
       FROM rider_violations
       GROUP BY type
       ORDER BY count DESC`
    ).all()

    const byRider = db.prepare(
      `SELECT r.id, r.name, COUNT(v.id) as violation_count, SUM(v.penalty_points) as total_penalty
       FROM rider_violations v
       JOIN riders r ON v.rider_id = r.id
       GROUP BY r.id
       ORDER BY violation_count DESC
       LIMIT 10`
    ).all()

    const timeoutPatterns = db.prepare(
      `SELECT strftime('%H', o.delivery_time_window_start) as hour,
              COUNT(*) as timeout_count
       FROM delivery_orders o
       WHERE o.status = 'timeout'
       GROUP BY strftime('%H', o.delivery_time_window_start)
       ORDER BY hour ASC`
    ).all()

    res.json({
      success: true,
      data: {
        by_type: byType,
        by_rider: byRider,
        timeout_by_hour: timeoutPatterns
      }
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/capacity/gaps', (req: Request, res: Response): void => {
  try {
    const gaps = db.prepare(
      `SELECT g.id, g.grid_code, g.grid_name, g.center_lat, g.center_lng,
              g.heat_density, g.rider_count, g.active_orders, g.load_balance_coefficient,
              g.weather_factor, g.weather_description,
              CASE WHEN g.active_orders > g.rider_count * 2 THEN 'critical'
                   WHEN g.active_orders > g.rider_count * 1.5 THEN 'warning'
                   ELSE 'normal' END as gap_level,
              MAX(0, g.active_orders - g.rider_count) as rider_shortage
       FROM capacity_grids g
       ORDER BY rider_shortage DESC`
    ).all()

    res.json({ success: true, data: gaps })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/orders/trend', (req: Request, res: Response): void => {
  try {
    const days = Math.min(30, Number(req.query.days) || 7)
    const trendData = db.prepare(
      `SELECT date(created_at) as date,
              COUNT(*) as total_orders,
              SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
              SUM(CASE WHEN status = 'timeout' THEN 1 ELSE 0 END) as timeout,
              SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
       FROM delivery_orders
       WHERE created_at >= date('now', ?)
       GROUP BY date(created_at)
       ORDER BY date ASC`
    ).all(`-${days} days`)

    res.json({ success: true, data: trendData })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/income/breakdown', (req: Request, res: Response): void => {
  try {
    const breakdown = db.prepare(
      `SELECT
         COALESCE(SUM(base_fee), 0) as total_base_fee,
         COALESCE(SUM(reward), 0) as total_reward,
         COALESCE(SUM(subsidy), 0) as total_subsidy,
         COALESCE(SUM(timeout_penalty_amount), 0) as total_penalty
       FROM delivery_orders
       WHERE status = 'delivered' OR status = 'timeout'`
    ).get()

    res.json({ success: true, data: breakdown })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
