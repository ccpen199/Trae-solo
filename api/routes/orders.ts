import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { v4 as uuidv4 } from 'uuid'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 20
  const status = req.query.status as string
  const userId = req.user!.userId
  const role = req.user!.role

  const offset = (page - 1) * pageSize
  const conditions: string[] = []
  const params: any[] = []

  if (role === 'driver') {
    conditions.push('o.driver_id = ?')
    params.push(userId)
  } else if (role === 'shipper') {
    conditions.push('o.shipper_id = ?')
    params.push(userId)
  }

  if (status) {
    conditions.push('o.status = ?')
    params.push(status)
  }

  const whereSql = conditions.length > 0 ? conditions.join(' AND ') : '1=1'

  const total = db.prepare(`SELECT COUNT(*) as count FROM orders o WHERE ${whereSql}`).get(...params) as { count: number }

  const list = db.prepare(`
    SELECT o.*, u_d.name as driver_name, u_s.name as shipper_name,
      f.origin, f.destination, f.goods_type, f.weight, f.need_vat
    FROM orders o
    LEFT JOIN users u_d ON o.driver_id = u_d.id
    LEFT JOIN users u_s ON o.shipper_id = u_s.id
    LEFT JOIN freights f ON o.freight_id = f.id
    WHERE ${whereSql}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset)

  res.json({ success: true, list, total: total.count })
})

router.get('/:id', authMiddleware, (req: Request, res: Response): void => {
  const order = db.prepare(`
    SELECT o.*, u_d.name as driver_name, u_d.phone as driver_phone,
      u_s.name as shipper_name, u_s.phone as shipper_phone,
      f.origin, f.destination, f.goods_type, f.weight, f.description, f.need_vat,
      f.invoice_entity_id, ie.company_name as invoice_company_name
    FROM orders o
    LEFT JOIN users u_d ON o.driver_id = u_d.id
    LEFT JOIN users u_s ON o.shipper_id = u_s.id
    LEFT JOIN freights f ON o.freight_id = f.id
    LEFT JOIN invoice_entities ie ON f.invoice_entity_id = ie.id
    WHERE o.id = ?
  `).get(req.params.id)

  if (!order) {
    res.status(404).json({ success: false, error: '运单不存在' })
    return
  }

  const safetyCheck = db.prepare('SELECT * FROM safety_checks WHERE order_id = ?').get(req.params.id)
  const invoice = db.prepare('SELECT * FROM invoices WHERE order_id = ?').get(req.params.id)
  const settlement = db.prepare('SELECT * FROM settlements WHERE order_id = ?').get(req.params.id)
  const waybill = db.prepare('SELECT * FROM waybills WHERE order_id = ?').get(req.params.id)
  const gpsTracks = db.prepare('SELECT * FROM gps_tracks WHERE order_id = ? ORDER BY recorded_at ASC').all(req.params.id)

  res.json({
    success: true,
    data: {
      ...(order as Record<string, any>),
      safety_check: safetyCheck || null,
      invoice: invoice || null,
      settlement: settlement || null,
      waybill: waybill || null,
      gps_tracks: gpsTracks,
    }
  })
})

router.post('/:id/confirm-pickup', authMiddleware, roleMiddleware('driver'), (req: Request, res: Response): void => {
  const orderId = req.params.id
  const driverId = req.user!.userId

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any
  if (!order) {
    res.status(404).json({ success: false, error: '运单不存在' })
    return
  }
  if (order.driver_id !== driverId) {
    res.status(403).json({ success: false, error: '无权操作此运单' })
    return
  }
  if (order.status !== 'pending') {
    res.status(400).json({ success: false, error: '当前状态不允许确认装货' })
    return
  }

  const now = new Date().toISOString()
  db.prepare("UPDATE orders SET status = 'pickup', pickup_time = ? WHERE id = ?").run(now, orderId)

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)
  res.json({ success: true, data: updated })
})

router.post('/:id/start-transit', authMiddleware, roleMiddleware('driver'), (req: Request, res: Response): void => {
  const orderId = req.params.id
  const driverId = req.user!.userId

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any
  if (!order || order.driver_id !== driverId) {
    res.status(404).json({ success: false, error: '运单不存在或无权操作' })
    return
  }
  if (order.status !== 'pickup') {
    res.status(400).json({ success: false, error: '当前状态不允许开始运输' })
    return
  }

  db.prepare("UPDATE orders SET status = 'transit' WHERE id = ?").run(orderId)
  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)
  res.json({ success: true, data: updated })
})

router.post('/:id/confirm-delivery', authMiddleware, roleMiddleware('driver'), (req: Request, res: Response): void => {
  const orderId = req.params.id
  const driverId = req.user!.userId

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any
  if (!order || order.driver_id !== driverId) {
    res.status(404).json({ success: false, error: '运单不存在或无权操作' })
    return
  }
  if (order.status !== 'transit') {
    res.status(400).json({ success: false, error: '当前状态不允许确认送达' })
    return
  }

  const now = new Date().toISOString()

  const tx = db.transaction(() => {
    db.prepare("UPDATE orders SET status = 'delivered', delivery_time = ? WHERE id = ?").run(now, orderId)

    const waybillId = `wb_${uuidv4().substring(0, 8)}`
    const waybillData = JSON.stringify({
      orderNo: orderId,
      fee: order.total_fee,
      deliveredAt: now,
    })
    db.prepare('INSERT INTO waybills (id, order_id, waybill_no, electronic_data) VALUES (?, ?, ?, ?)').run(
      waybillId, orderId, `WB${order.waybill_no?.substring(2) || uuidv4().substring(0, 8)}`, waybillData
    )
  })
  tx()

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)
  res.json({ success: true, data: updated })
})

router.post('/:id/gps', authMiddleware, (req: Request, res: Response): void => {
  const orderId = req.params.id
  const { points } = req.body

  if (!points || !Array.isArray(points) || points.length === 0) {
    res.status(400).json({ success: false, error: '轨迹点数据无效' })
    return
  }

  const stmt = db.prepare('INSERT INTO gps_tracks (id, order_id, latitude, longitude, speed, recorded_at, synced) VALUES (?, ?, ?, ?, ?, ?, 1)')

  const tx = db.transaction((pts: any[]) => {
    for (const p of pts) {
      stmt.run(uuidv4(), orderId, p.latitude, p.longitude, p.speed || 0, p.recorded_at || new Date().toISOString())
    }
  })
  tx(points)

  res.json({ success: true, saved: points.length })
})

export default router
