import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'

const router = Router()

router.get('/overview', (_req: Request, res: Response): void => {
  const db = getDb()

  const totalMerchants = (db.prepare('SELECT COUNT(*) as count FROM merchants').get() as { count: number }).count
  const activeMerchants = (db.prepare("SELECT COUNT(*) as count FROM merchants WHERE status = 'approved'").get() as { count: number }).count
  const totalOrders = (db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number }).count
  const totalRevenue = (db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE status IN (?, ?)').get('paid', 'used') as { total: number }).total

  const totalPaid = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('paid', 'used')").get() as { count: number }).count
  const totalUsed = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'used'").get() as { count: number }).count
  const verificationRate = totalPaid > 0 ? Number((totalUsed / totalPaid * 100).toFixed(1)) : 0

  const repeatBuyers = (db.prepare(`
    SELECT COUNT(*) as count FROM (
      SELECT user_id FROM orders WHERE status IN ('paid', 'used') GROUP BY user_id HAVING COUNT(*) > 1
    )
  `).get() as { count: number }).count
  const totalBuyers = (db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count FROM orders WHERE status IN ('paid', 'used')
  `).get() as { count: number }).count
  const repurchaseRate = totalBuyers > 0 ? Number((repeatBuyers / totalBuyers * 100).toFixed(1)) : 0

  res.json({
    code: 200,
    message: 'ok',
    data: {
      totalMerchants,
      activeMerchants,
      totalOrders,
      totalRevenue,
      verificationRate,
      repurchaseRate,
    },
  })
})

router.get('/top-categories', (req: Request, res: Response): void => {
  const db = getDb()
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit as string) || 10))

  const categories = db.prepare(`
    SELECT m.category, COUNT(o.id) as order_count, COALESCE(SUM(o.amount), 0) as revenue
    FROM merchants m
    LEFT JOIN orders o ON m.id = o.merchant_id AND o.status IN ('paid', 'used')
    GROUP BY m.category
    ORDER BY order_count DESC
    LIMIT ?
  `).all(limit)

  res.json({ code: 200, message: 'ok', data: categories })
})

router.get('/daily-trend', (req: Request, res: Response): void => {
  const db = getDb()
  const days = Math.min(90, Math.max(7, parseInt(req.query.days as string) || 30))

  const trend = db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as order_count, COALESCE(SUM(amount), 0) as revenue,
      SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END) as verified_count
    FROM orders
    WHERE created_at >= datetime('now', '-' || ? || ' days')
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all(days)

  res.json({ code: 200, message: 'ok', data: trend })
})

router.get('/merchant-ranking', (req: Request, res: Response): void => {
  const db = getDb()
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10))

  const ranking = db.prepare(`
    SELECT m.id, m.name, m.category, m.street, m.rating, m.popularity,
      COUNT(o.id) as order_count, COALESCE(SUM(o.amount), 0) as revenue
    FROM merchants m
    LEFT JOIN orders o ON m.id = o.merchant_id AND o.status IN ('paid', 'used')
    WHERE m.status = 'approved'
    GROUP BY m.id
    ORDER BY revenue DESC
    LIMIT ?
  `).all(limit)

  res.json({ code: 200, message: 'ok', data: ranking })
})

export default router
