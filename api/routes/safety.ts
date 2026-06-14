import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { v4 as uuidv4 } from 'uuid'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/checks', authMiddleware, roleMiddleware('driver'), (req: Request, res: Response): void => {
  const driverId = req.user!.userId
  const { order_id, check_items, photos, status } = req.body

  if (!order_id || !check_items || !status) {
    res.status(400).json({ success: false, error: '参数不完整' })
    return
  }

  const id = `sc_${uuidv4().substring(0, 8)}`
  db.prepare(`
    INSERT INTO safety_checks (id, order_id, driver_id, check_items, photos, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, order_id, driverId, JSON.stringify(check_items), JSON.stringify(photos || []), status)

  const record = db.prepare('SELECT * FROM safety_checks WHERE id = ?').get(id)
  res.json({ success: true, data: record })
})

router.get('/checks', authMiddleware, (req: Request, res: Response): void => {
  const orderId = req.query.orderId as string
  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 20
  const offset = (page - 1) * pageSize

  const conditions: string[] = []
  const params: any[] = []

  if (orderId) {
    conditions.push('order_id = ?')
    params.push(orderId)
  }

  const whereSql = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

  const total = db.prepare(`SELECT COUNT(*) as count FROM safety_checks ${whereSql}`).get(...params) as { count: number }
  const list = db.prepare(`
    SELECT sc.*, o.waybill_no, u.name as driver_name
    FROM safety_checks sc
    JOIN orders o ON sc.order_id = o.id
    LEFT JOIN users u ON sc.driver_id = u.id
    ${whereSql}
    ORDER BY sc.checked_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset)

  res.json({ success: true, list, total: total.count })
})

router.post('/logs', authMiddleware, roleMiddleware('driver'), (req: Request, res: Response): void => {
  const driverId = req.user!.userId
  const { order_id, start_time, end_time, mileage, weather, road_condition, remarks } = req.body

  if (!start_time) {
    res.status(400).json({ success: false, error: '出车时间为必填' })
    return
  }

  const id = `dl_${uuidv4().substring(0, 8)}`
  db.prepare(`
    INSERT INTO driving_logs (id, driver_id, order_id, start_time, end_time, mileage, weather, road_condition, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, driverId, order_id || null, start_time, end_time || null, mileage || 0, weather || '', road_condition || '', remarks || '')

  const log = db.prepare('SELECT * FROM driving_logs WHERE id = ?').get(id)
  res.json({ success: true, data: log })
})

router.get('/logs', authMiddleware, (req: Request, res: Response): void => {
  const driverId = req.query.driverId as string || (req.user!.role === 'driver' ? req.user!.userId : undefined)
  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 20
  const offset = (page - 1) * pageSize

  const conditions: string[] = []
  const params: any[] = []

  if (driverId) {
    conditions.push('dl.driver_id = ?')
    params.push(driverId)
  }

  const whereSql = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

  const total = db.prepare(`SELECT COUNT(*) as count FROM driving_logs dl ${whereSql}`).get(...params) as { count: number }
  const list = db.prepare(`
    SELECT dl.*, o.waybill_no, u.name as driver_name
    FROM driving_logs dl
    LEFT JOIN orders o ON CAST(dl.order_id AS TEXT) = o.id
    LEFT JOIN users u ON CAST(dl.driver_id AS TEXT) = CAST(u.id AS TEXT)
    ${whereSql}
    ORDER BY dl.start_time DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset)

  res.json({ success: true, list, total: total.count })
})

router.get('/waybills', authMiddleware, (req: Request, res: Response): void => {
  const orderId = req.query.orderId as string

  const conditions: string[] = []
  const params: any[] = []

  if (orderId) {
    conditions.push('w.order_id = ?')
    params.push(orderId)
  }

  if (req.user!.role === 'driver') {
    conditions.push('o.driver_id = ?')
    params.push(req.user!.userId)
  } else if (req.user!.role === 'shipper') {
    conditions.push('o.shipper_id = ?')
    params.push(req.user!.userId)
  }

  const whereSql = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

  const list = db.prepare(`
    SELECT w.*, o.waybill_no as order_waybill_no, f.origin, f.destination, o.total_fee,
      u_d.name as driver_name, u_s.name as shipper_name
    FROM waybills w
    JOIN orders o ON w.order_id = o.id
    JOIN freights f ON o.freight_id = f.id
    LEFT JOIN users u_d ON o.driver_id = u_d.id
    LEFT JOIN users u_s ON o.shipper_id = u_s.id
    ${whereSql}
    ORDER BY w.archived_at DESC
  `).all(...params)

  res.json({ success: true, list })
})

router.get('/export', authMiddleware, roleMiddleware('admin', 'shipper', 'driver'), (req: Request, res: Response): void => {
  const startDate = req.query.startDate as string
  const endDate = req.query.endDate as string

  const conditions: string[] = []
  const params: any[] = []

  if (startDate) {
    conditions.push('sc.checked_at >= ?')
    params.push(startDate)
  }
  if (endDate) {
    conditions.push('sc.checked_at <= ?')
    params.push(endDate)
  }

  if (req.user!.role === 'driver') {
    conditions.push('sc.driver_id = ?')
    params.push(req.user!.userId)
  } else if (req.user!.role === 'shipper') {
    conditions.push('o.shipper_id = ?')
    params.push(req.user!.userId)
  }

  const whereSql = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

  const safetyChecks = db.prepare(`
    SELECT sc.*, o.waybill_no, f.origin, f.destination, u.name as driver_name
    FROM safety_checks sc
    JOIN orders o ON sc.order_id = o.id
    JOIN freights f ON o.freight_id = f.id
    LEFT JOIN users u ON sc.driver_id = u.id
    ${whereSql}
    ORDER BY sc.checked_at DESC
  `).all(...params)

  res.json({
    success: true,
    data: safetyChecks,
    export_type: 'safety_records',
    exported_at: new Date().toISOString()
  })
})

export default router
