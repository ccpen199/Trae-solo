import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.get('/summary', (req: Request, res: Response): void => {
  const warehouses = (db.prepare(`SELECT w.*,
    COUNT(p.code) as total_parts,
    SUM(CASE WHEN p.status = 'in_stock' THEN 1 ELSE 0 END) as in_stock_count,
    SUM(CASE WHEN p.status = 'reserved' THEN 1 ELSE 0 END) as reserved_count,
    SUM(CASE WHEN p.status = 'used' THEN 1 ELSE 0 END) as used_count
    FROM warehouses w LEFT JOIN parts p ON w.id = p.warehouse_id
    GROUP BY w.id`).all() as any[]).map((w) => ({
    id: w.id,
    name: w.name,
    address: w.address,
    lat: w.lat,
    lng: w.lng,
    totalParts: w.total_parts,
    inStockCount: w.in_stock_count,
    reservedCount: w.reserved_count,
    usedCount: w.used_count,
  }))

  const totalParts = (db.prepare("SELECT COUNT(*) as c FROM parts").get() as any).c
  const lowStockAlerts = (db.prepare("SELECT COUNT(*) as c FROM parts WHERE status = 'in_stock' GROUP BY warehouse_id, category HAVING c < 3").all() as any[]).length

  res.json({
    success: true,
    data: { warehouses, totalParts, lowStockAlerts },
  })
})

router.get('/parts', (req: Request, res: Response): void => {
  const { warehouseId, search, status } = req.query

  let sql = `SELECT p.*, w.name as warehouse_name FROM parts p JOIN warehouses w ON p.warehouse_id = w.id WHERE 1=1`
  const params: any[] = []

  if (warehouseId) {
    sql += ` AND p.warehouse_id = ?`
    params.push(warehouseId)
  }
  if (search) {
    sql += ` AND (p.name LIKE ? OR p.code LIKE ? OR p.category LIKE ?)`
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }
  if (status) {
    sql += ` AND p.status = ?`
    params.push(status)
  }

  sql += ` ORDER BY p.inbound_date DESC`

  const parts = (db.prepare(sql).all(...params) as any[]).map((p) => ({
    code: p.code,
    name: p.name,
    category: p.category,
    warehouseId: p.warehouse_id,
    warehouseName: p.warehouse_name,
    status: p.status,
    boundOrderId: p.bound_order_id,
    inboundBatch: p.inbound_batch,
    inboundDate: p.inbound_date,
  }))

  res.json({
    success: true,
    data: { parts, total: parts.length },
  })
})

router.post('/parts/:code/bind', (req: Request, res: Response): void => {
  const { orderId } = req.body
  const partCode = req.params.code

  if (!orderId) {
    res.status(400).json({ success: false, error: '请提供工单ID' })
    return
  }

  const part = db.prepare('SELECT * FROM parts WHERE code = ?').get(partCode) as any
  if (!part) {
    res.status(404).json({ success: false, error: '配件不存在' })
    return
  }

  if (part.status !== 'in_stock') {
    res.status(400).json({ success: false, error: '配件不在库，无法绑定' })
    return
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any
  if (!order) {
    res.status(404).json({ success: false, error: '工单不存在' })
    return
  }

  db.prepare('UPDATE parts SET status = ?, bound_order_id = ? WHERE code = ?').run('reserved', orderId, partCode)

  const existing = db.prepare('SELECT * FROM order_parts WHERE order_id = ? AND part_code = ?').get(orderId, partCode) as any
  if (!existing) {
    db.prepare('INSERT INTO order_parts (id, order_id, part_code, quantity) VALUES (?, ?, ?, ?)').run(
      `OP${Date.now()}_${partCode}`, orderId, partCode, 1,
    )
  }

  res.json({
    success: true,
    data: { partCode, orderId, status: 'reserved' },
  })
})

export default router
