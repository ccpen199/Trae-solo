import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/credits', authMiddleware, roleMiddleware('admin'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = db.prepare(`
      SELECT sc.*, u.name, u.phone, u.company
      FROM shipper_credits sc
      JOIN users u ON sc.shipper_id = u.id
      ORDER BY sc.credit_limit DESC
      LIMIT 50
    `).all() as any[]

    res.json(rows.map((row) => {
      const usedPct = row.credit_limit > 0 ? row.used_amount / row.credit_limit : 0
      return {
        id: String(row.shipper_id),
        companyName: row.company ?? row.name,
        contact: row.name,
        phone: row.phone,
        creditLimit: row.credit_limit,
        usedCredit: row.used_amount,
        rating: usedPct > 0.9 ? 'C' : usedPct > 0.7 ? 'B' : 'A',
        status: usedPct > 0.95 ? 'review' : 'active',
      }
    }))
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.patch('/credits/:shipperId', authMiddleware, roleMiddleware('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { creditLimit } = req.body
    if (!creditLimit || Number(creditLimit) <= 0) {
      res.status(400).json({ success: false, error: '缺少授信额度' })
      return
    }
    db.prepare('UPDATE shipper_credits SET credit_limit = ?, available_amount = ? - used_amount, updated_at = datetime("now") WHERE shipper_id = ?')
      .run(creditLimit, creditLimit, req.params.shipperId)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/risks', authMiddleware, roleMiddleware('admin'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = db.prepare(`
      SELECT dp.*, u.name, u.phone
      FROM driver_profiles dp
      JOIN users u ON dp.user_id = u.id
      ORDER BY dp.credit_score ASC
      LIMIT 50
    `).all() as any[]

    res.json(rows.map((row) => {
      const riskLevel = row.status === 'blacklisted' || row.credit_score < 76
        ? 'high'
        : row.violation_count > 0 || row.complaint_rate > 0.04
          ? 'medium'
          : 'low'
      const riskType = row.status === 'pending'
        ? '资质待审'
        : row.status === 'blacklisted'
          ? '黑名单'
          : row.violation_count > 0
            ? '违章记录'
            : '信用巡检'
      return {
        id: String(row.id),
        driverName: row.name,
        phone: row.phone,
        vehicleType: row.vehicle_type,
        riskLevel,
        riskType,
        description: `信用分 ${Math.round(row.credit_score)}，违章 ${row.violation_count} 次，准点率 ${Math.round(row.on_time_rate)}%`,
        status: row.status === 'approved' ? 'approved' : row.status === 'rejected' ? 'rejected' : 'pending',
      }
    }))
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.patch('/risks/:driverId', authMiddleware, roleMiddleware('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body
    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({ success: false, error: '状态无效' })
      return
    }
    db.prepare('UPDATE driver_profiles SET status = ? WHERE id = ?').run(status, req.params.driverId)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/warnings', authMiddleware, roleMiddleware('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', pageSize = '20', level } = req.query
    let sql = `
      SELECT sw.*, rp.from_city, rp.to_city, rp.current_price
      FROM supply_demand_warnings sw
      LEFT JOIN route_prices rp ON sw.route_id = rp.id
      WHERE 1=1
    `
    const params: any[] = []
    if (level) { sql += ' AND sw.warning_level = ?'; params.push(level) }
    const total = (db.prepare(`SELECT COUNT(*) as count FROM supply_demand_warnings sw ${level ? "WHERE sw.warning_level = ?" : ""}`).get(...(level ? [level] : [])) as any).count
    const p = parseInt(page as string)
    const ps = parseInt(pageSize as string)
    sql += ' ORDER BY sw.created_at DESC LIMIT ? OFFSET ?'
    params.push(ps, (p - 1) * ps)
    const warnings = db.prepare(sql).all(...params)
    res.json({ success: true, warnings, total })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/risk/drivers', authMiddleware, roleMiddleware('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { status = 'pending', page = '1', pageSize = '20' } = req.query
    const p = parseInt(page as string)
    const ps = parseInt(pageSize as string)
    let sql = `
      SELECT dp.*, u.name, u.phone, u.created_at as registered_at
      FROM driver_profiles dp
      JOIN users u ON dp.user_id = u.id
    `
    const params: any[] = []
    if (status) { sql += ' WHERE dp.status = ?'; params.push(status) }
    const total = (db.prepare(`SELECT COUNT(*) as count FROM driver_profiles dp ${status ? "WHERE dp.status = ?" : ""}`).get(...(status ? [status] : [])) as any).count
    sql += ' ORDER BY dp.credit_score ASC LIMIT ? OFFSET ?'
    params.push(ps, (p - 1) * ps)
    const reviews = db.prepare(sql).all(...params)
    res.json({ success: true, reviews, total })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/risk/drivers/:driverId/approve', authMiddleware, roleMiddleware('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    db.prepare('UPDATE driver_profiles SET status = ? WHERE id = ?').run('approved', req.params.driverId)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/risk/drivers/:driverId/reject', authMiddleware, roleMiddleware('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { reason } = req.body
    db.prepare('UPDATE driver_profiles SET status = ? WHERE id = ?').run('rejected', req.params.driverId)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/credit/shipper', authMiddleware, roleMiddleware('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', pageSize = '20' } = req.query
    const p = parseInt(page as string)
    const ps = parseInt(pageSize as string)
    const total = (db.prepare('SELECT COUNT(*) as count FROM shipper_credits').get() as any).count
    const credits = db.prepare(`
      SELECT sc.*, u.name, u.phone, u.company
      FROM shipper_credits sc
      JOIN users u ON sc.shipper_id = u.id
      ORDER BY sc.credit_limit DESC
      LIMIT ? OFFSET ?
    `).all(ps, (p - 1) * ps)
    res.json({ success: true, credits, total })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/credit/shipper/:shipperId', authMiddleware, roleMiddleware('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { creditLimit } = req.body
    if (!creditLimit) {
      res.status(400).json({ success: false, error: '缺少授信额度' })
      return
    }
    db.prepare('UPDATE shipper_credits SET credit_limit = ?, available_amount = ? - used_amount, updated_at = datetime("now") WHERE shipper_id = ?')
      .run(creditLimit, creditLimit, req.params.shipperId)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/forecast', authMiddleware, roleMiddleware('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { region, days = '30' } = req.query
    const forecasts = []
    const baseVolume = 500 + Math.random() * 300
    for (let i = 0; i < parseInt(days as string); i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      const weekday = date.getDay()
      const seasonal = 1 + Math.sin(((date.getMonth() + 1) / 12) * Math.PI * 2) * 0.3
      const weekendFactor = (weekday === 0 || weekday === 6) ? 0.7 : 1.0
      const volume = Math.round(baseVolume * seasonal * weekendFactor * (0.9 + Math.random() * 0.2))
      const upper = Math.round(volume * 1.15)
      const lower = Math.round(volume * 0.85)
      forecasts.push({ date: dateStr, volume, upper, lower })
    }
    res.json({ success: true, forecasts, confidence: 0.85 })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/dashboard', authMiddleware, roleMiddleware('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const totalDrivers = (db.prepare('SELECT COUNT(*) as count FROM driver_profiles WHERE status = ?').get('approved') as any).count
    const idleDrivers = (db.prepare("SELECT COUNT(*) as count FROM driver_locations WHERE idle_status = 'idle'").get() as any).count
    const totalOrders = (db.prepare('SELECT COUNT(*) as count FROM orders').get() as any).count
    const completedOrders = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'completed'").get() as any).count
    const pendingOrders = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").get() as any).count
    const totalRevenue = db.prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM settlements WHERE status = ?').get('completed') as any
    const totalPlatformFee = db.prepare('SELECT COALESCE(SUM(platform_fee), 0) as total FROM settlements WHERE status = ?').get('completed') as any

    const alerts = db.prepare(`
      SELECT sw.*, rp.from_city, rp.to_city
      FROM supply_demand_warnings sw
      LEFT JOIN route_prices rp ON sw.route_id = rp.id
      WHERE sw.warning_level IN ('high', 'critical')
      ORDER BY sw.created_at DESC LIMIT 5
    `).all()

    const topRoutes = db.prepare(`
      SELECT from_city, to_city, COUNT(*) as order_count
      FROM orders
      GROUP BY from_city, to_city
      ORDER BY order_count DESC LIMIT 5
    `).all()

    res.json({
      success: true,
      overview: {
        totalDrivers,
        idleDrivers,
        totalOrders,
        completedOrders,
        pendingOrders,
        totalRevenue: totalRevenue.total,
        totalPlatformFee: totalPlatformFee.total,
        completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
      },
      alerts,
      topRoutes,
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
