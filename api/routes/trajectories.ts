import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const orderId = req.query.order_id as string
  const riderId = req.query.rider_id as string

  const conditions: string[] = []
  const params: any[] = []

  if (orderId) {
    conditions.push('t.order_id = ?')
    params.push(orderId)
  }
  if (riderId) {
    conditions.push('t.rider_id = ?')
    params.push(riderId)
  }

  if (conditions.length === 0) {
    res.status(400).json({ success: false, error: '必须提供 order_id 或 rider_id' })
    return
  }

  const whereClause = 'WHERE ' + conditions.join(' AND ')
  const trajectories = db
    .prepare(
      `SELECT t.*, r.name as rider_name, o.order_no FROM trajectories t LEFT JOIN riders r ON t.rider_id = r.id LEFT JOIN orders o ON t.order_id = o.id ${whereClause} ORDER BY t.timestamp DESC`,
    )
    .all(...params)

  res.json({ success: true, data: trajectories })
})

router.post('/', (req: Request, res: Response): void => {
  const { rider_id, order_id, longitude, latitude, is_abnormal } = req.body

  if (!rider_id || !order_id || longitude === undefined || latitude === undefined) {
    res.status(400).json({ success: false, error: 'rider_id、order_id、longitude、latitude 为必填项' })
    return
  }

  const result = db
    .prepare('INSERT INTO trajectories (rider_id, order_id, longitude, latitude, is_abnormal) VALUES (?, ?, ?, ?, ?)')
    .run(rider_id, order_id, longitude, latitude, is_abnormal || 0)

  const trajectory = db.prepare('SELECT * FROM trajectories WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: trajectory })
})

export default router
