import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/:vehicleId/trajectory', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { vehicleId } = req.params
    const { startTime, endTime } = req.query
    let where = 'WHERE vehicle_id = ?'
    const params: any[] = [Number(vehicleId)]
    if (startTime) {
      where += ' AND timestamp >= ?'
      params.push(startTime)
    }
    if (endTime) {
      where += ' AND timestamp <= ?'
      params.push(endTime)
    }
    const points = db.prepare(
      `SELECT id, vehicle_id as vehicleId, lat, lng, speed, heading, timestamp FROM trajectory_points ${where} ORDER BY timestamp ASC`,
    ).all(...params)
    res.json({ success: true, data: { points } })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

export default router
