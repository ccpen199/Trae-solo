import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/generate', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.body
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any
    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }
    if (!order.assigned_driver_id) {
      res.status(400).json({ success: false, error: '订单未分配司机' })
      return
    }
    const waybillNo = `WB${Date.now()}`
    const result = db.prepare(`
      INSERT INTO waybills (waybill_no, order_id, driver_id, status)
      VALUES (?, ?, ?, 'generated')
    `).run(waybillNo, orderId, order.assigned_driver_id)
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('in_transit', orderId)
    const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(Number(result.lastInsertRowid)) as any
    res.status(201).json({ success: true, waybill })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/list', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId
    const role = (req as any).user.role
    const { status, page = '1', pageSize = '20' } = req.query
    let sql = `
      SELECT w.*, o.from_city, o.to_city, o.cargo_type, o.weight, o.price,
             u.name as driver_name, dp.plate_no
      FROM waybills w
      JOIN orders o ON w.order_id = o.id
      LEFT JOIN driver_profiles dp ON w.driver_id = dp.id
      LEFT JOIN users u ON dp.user_id = u.id
      WHERE 1=1
    `
    const params: any[] = []
    if (status) { sql += ' AND w.status = ?'; params.push(status) }
    if (role === 'shipper') { sql += ' AND o.shipper_id = ?'; params.push(userId) }
    if (role === 'driver') {
      const dp = db.prepare('SELECT id FROM driver_profiles WHERE user_id = ?').get(userId) as any
      if (dp) { sql += ' AND w.driver_id = ?'; params.push(dp.id) }
    }
    const countSql = sql.replace('SELECT w.*', 'SELECT COUNT(*) as count').replace(/LEFT JOIN.*\n?/g, '').replace(/JOIN.*\n?/g, '').replace(/WHERE 1=1/, 'WHERE 1=1')
    const totalResult = db.prepare(`SELECT COUNT(*) as count FROM waybills w JOIN orders o ON w.order_id = o.id WHERE 1=1 ${status ? ' AND w.status = ?' : ''} ${role === 'shipper' ? ' AND o.shipper_id = ?' : ''} ${role === 'driver' ? ' AND w.driver_id = ?' : ''}`).get(...params) as any
    sql += ' ORDER BY w.created_at DESC LIMIT ? OFFSET ?'
    const p = parseInt(page as string)
    const ps = parseInt(pageSize as string)
    params.push(ps, (p - 1) * ps)
    const waybills = db.prepare(sql).all(...params)
    res.json({ success: true, waybills, total: totalResult?.count || waybills.length })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:waybillId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const waybill = db.prepare(`
      SELECT w.*, o.from_city, o.to_city, o.cargo_type, o.weight, o.price, o.mode,
             u.name as driver_name, u.phone as driver_phone, dp.plate_no, dp.vehicle_type
      FROM waybills w
      JOIN orders o ON w.order_id = o.id
      LEFT JOIN driver_profiles dp ON w.driver_id = dp.id
      LEFT JOIN users u ON dp.user_id = u.id
      WHERE w.id = ?
    `).get(req.params.waybillId) as any
    if (!waybill) {
      res.status(404).json({ success: false, error: '运单不存在' })
      return
    }
    const statusLogs = db.prepare('SELECT * FROM waybill_status_logs WHERE waybill_id = ? ORDER BY created_at').all(req.params.waybillId)
    res.json({ success: true, waybill, statusLogs })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:waybillId/status', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, location } = req.body
    const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(req.params.waybillId) as any
    if (!waybill) {
      res.status(404).json({ success: false, error: '运单不存在' })
      return
    }
    const updates: string[] = []
    const params: any[] = []
    if (location) {
      updates.push('current_lat = ?', 'current_lng = ?')
      params.push(location.lat, location.lng)
    }
    const now = new Date().toISOString()
    if (status === 'loaded') { updates.push('loaded_at = ?'); params.push(now) }
    if (status === 'arrived') { updates.push('arrived_at = ?'); params.push(now) }
    if (status === 'signed') { updates.push('signed_at = ?'); params.push(now) }
    updates.push('status = ?')
    params.push(status)
    params.push(req.params.waybillId)
    db.prepare(`UPDATE waybills SET ${updates.join(', ')} WHERE id = ?`).run(...params)
    db.prepare('INSERT INTO waybill_status_logs (waybill_id, status, location_lat, location_lng) VALUES (?, ?, ?, ?)')
      .run(Number(req.params.waybillId), status, location?.lat || null, location?.lng || null)
    if (status === 'signed') {
      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('completed', waybill.order_id)
    }
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:waybillId/temperature', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const records = db.prepare('SELECT * FROM temperature_logs WHERE waybill_id = ? ORDER BY recorded_at').all(req.params.waybillId) as any[]
    const alerts = records.filter(r => r.is_alert === 1)
    res.json({ success: true, records, alerts })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
