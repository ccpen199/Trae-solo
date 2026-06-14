import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/stats', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { orgId, routeId, date } = req.query
    let where = 'WHERE 1=1'
    const params: any[] = []
    if (orgId) {
      where += ' AND r.org_id = ?'
      params.push(Number(orgId))
    }
    if (routeId) {
      where += ' AND s.route_id = ?'
      params.push(Number(routeId))
    }
    if (date) {
      where += ' AND s.planned_departure LIKE ?'
      params.push(`${date}%`)
    }
    const stats = db.prepare(
      `SELECT
        COUNT(*) as totalTrips,
        SUM(CASE WHEN s.status = 'on_time' THEN 1 ELSE 0 END) as onTimeTrips,
        SUM(CASE WHEN s.status = 'late' THEN 1 ELSE 0 END) as lateTrips,
        SUM(CASE WHEN s.status = 'early' THEN 1 ELSE 0 END) as earlyTrips
       FROM schedules s
       LEFT JOIN routes r ON s.route_id = r.id
       ${where}`,
    ).get(...params) as any
    const totalTrips = stats.totalTrips || 0
    const onTimeTrips = stats.onTimeTrips || 0
    const onTimeRate = totalTrips > 0 ? Math.round((onTimeTrips / totalTrips) * 10000) / 100 : 0
    res.json({
      success: true,
      data: { onTimeRate, totalTrips, onTimeTrips, lateTrips: stats.lateTrips || 0, earlyTrips: stats.earlyTrips || 0 },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.get('/trips', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { routeId, date, page = '1', pageSize = '20' } = req.query
    const p = Number(page)
    const ps = Number(pageSize)
    let where = 'WHERE 1=1'
    const params: any[] = []
    if (routeId) {
      where += ' AND s.route_id = ?'
      params.push(Number(routeId))
    }
    if (date) {
      where += ' AND s.planned_departure LIKE ?'
      params.push(`${date}%`)
    }
    const total = (db.prepare(`SELECT COUNT(*) as count FROM schedules s ${where}`).get(...params) as any).count
    const list = db.prepare(
      `SELECT s.*, r.name as route_name, v.plate_number, d.name as driver_name
       FROM schedules s
       LEFT JOIN routes r ON s.route_id = r.id
       LEFT JOIN vehicles v ON s.vehicle_id = v.id
       LEFT JOIN drivers d ON s.driver_id = d.id
       ${where} ORDER BY s.planned_departure DESC LIMIT ? OFFSET ?`,
    ).all(...params, ps, (p - 1) * ps)
    res.json({ success: true, data: { list, total } })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

export default router
