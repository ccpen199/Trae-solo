import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/behavior/stats', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { orgId, startTime, endTime } = req.query
    let where = 'WHERE 1=1'
    const params: any[] = []
    if (orgId) {
      where += ' AND d.org_id = ?'
      params.push(Number(orgId))
    }
    if (startTime) {
      where += ' AND be.timestamp >= ?'
      params.push(startTime)
    }
    if (endTime) {
      where += ' AND be.timestamp <= ?'
      params.push(endTime)
    }
    const drivers = db.prepare(
      `SELECT d.id as driverId, d.name as driverName, d.score,
        COALESCE(SUM(CASE WHEN be.type = 'harsh_accel' THEN 1 ELSE 0 END), 0) as harshAccelCount,
        COALESCE(SUM(CASE WHEN be.type = 'harsh_brake' THEN 1 ELSE 0 END), 0) as harshBrakeCount,
        COALESCE(SUM(CASE WHEN be.type = 'fatigue' THEN 1 ELSE 0 END), 0) as fatigueCount,
        COALESCE(SUM(CASE WHEN be.type = 'overspeed' THEN 1 ELSE 0 END), 0) as overspeedCount
       FROM drivers d
       LEFT JOIN behavior_events be ON d.id = be.driver_id ${where.replace('WHERE 1=1', 'AND 1=1').replace('WHERE', 'WHERE')}
       GROUP BY d.id
       ORDER BY d.score ASC`,
    ).all(...params)
    res.json({ success: true, data: { drivers } })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.get('/behavior/events', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { driverId, type, startTime, endTime, page = '1', pageSize = '20' } = req.query
    const p = Number(page)
    const ps = Number(pageSize)
    let where = 'WHERE 1=1'
    const params: any[] = []
    if (driverId) {
      where += ' AND be.driver_id = ?'
      params.push(Number(driverId))
    }
    if (type) {
      where += ' AND be.type = ?'
      params.push(type)
    }
    if (startTime) {
      where += ' AND be.timestamp >= ?'
      params.push(startTime)
    }
    if (endTime) {
      where += ' AND be.timestamp <= ?'
      params.push(endTime)
    }
    const total = (db.prepare(`SELECT COUNT(*) as count FROM behavior_events be ${where}`).get(...params) as any).count
    const list = db.prepare(
      `SELECT be.*, d.name as driver_name, v.plate_number
       FROM behavior_events be
       LEFT JOIN drivers d ON be.driver_id = d.id
       LEFT JOIN vehicles v ON be.vehicle_id = v.id
       ${where} ORDER BY be.timestamp DESC LIMIT ? OFFSET ?`,
    ).all(...params, ps, (p - 1) * ps)
    res.json({ success: true, data: { list, total } })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

export default router
