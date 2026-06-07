import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

const cityPoints: Record<string, { x: number; y: number }> = {
  '北京': { x: 0.52, y: 0.22 },
  '上海': { x: 0.55, y: 0.35 },
  '广州': { x: 0.58, y: 0.65 },
  '深圳': { x: 0.57, y: 0.68 },
  '成都': { x: 0.36, y: 0.58 },
  '武汉': { x: 0.45, y: 0.50 },
  '杭州': { x: 0.60, y: 0.50 },
  '南京': { x: 0.50, y: 0.40 },
  '重庆': { x: 0.38, y: 0.55 },
  '西安': { x: 0.35, y: 0.40 },
  '长沙': { x: 0.48, y: 0.60 },
  '郑州': { x: 0.40, y: 0.35 },
}

router.get('/stats', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const onlineDrivers = (db.prepare("SELECT COUNT(*) as count FROM driver_locations WHERE idle_status != 'offline'").get() as any).count
    const todayOrders = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE date(created_at) = date('now')").get() as any).count
    const totalCapacity = (db.prepare("SELECT COALESCE(SUM(capacity), 0) as total FROM driver_profiles WHERE status = 'approved'").get() as any).total
    res.json({
      onlineDrivers,
      todayOrders,
      avgMatchTime: 18,
      totalCapacity: Math.round(totalCapacity),
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/heatmap', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = db.prepare(`
      SELECT o.from_city as city, COUNT(*) as count
      FROM orders o
      GROUP BY o.from_city
      UNION ALL
      SELECT o.to_city as city, COUNT(*) as count
      FROM orders o
      GROUP BY o.to_city
    `).all() as { city: string; count: number }[]

    const totals = new Map<string, number>()
    for (const row of rows) {
      totals.set(row.city, (totals.get(row.city) ?? 0) + row.count)
    }
    const maxCount = Math.max(...Array.from(totals.values()), 1)
    const points = Array.from(totals.entries()).map(([city, count]) => ({
      ...(cityPoints[city] ?? { x: 0.5, y: 0.5 }),
      intensity: Number((count / maxCount).toFixed(2)),
      label: city,
    }))
    res.json({ points })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
