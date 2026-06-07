import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { smartDispatch } from '../dispatch.js'

const router = Router()

function generateOrderNo(): string {
  const now = new Date()
  const dateStr = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0')
  const lastOrder = db.prepare("SELECT order_no FROM orders WHERE order_no LIKE ? ORDER BY order_no DESC LIMIT 1").get(`DD${dateStr}%`) as any
  let seq = 1
  if (lastOrder) {
    seq = parseInt(lastOrder.order_no.slice(-5)) + 1
  }
  return `DD${dateStr}${String(seq).padStart(5, '0')}`
}

router.get('/', (req: Request, res: Response): void => {
  const page = Number(req.query.page) || 1
  const pageSize = Number(req.query.page_size) || 20
  const type = req.query.type as string
  const status = req.query.status as string
  const merchantId = req.query.merchant_id as string
  const riderId = req.query.rider_id as string
  const zoneId = req.query.zone_id as string

  const conditions: string[] = []
  const params: any[] = []

  if (type) {
    conditions.push('o.type = ?')
    params.push(type)
  }
  if (status) {
    conditions.push('o.status = ?')
    params.push(status)
  }
  if (merchantId) {
    conditions.push('o.merchant_id = ?')
    params.push(merchantId)
  }
  if (riderId) {
    conditions.push('o.rider_id = ?')
    params.push(riderId)
  }
  if (zoneId) {
    conditions.push('o.zone_id = ?')
    params.push(zoneId)
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
  const total = (db.prepare(`SELECT COUNT(*) as count FROM orders o ${whereClause}`).get(...params) as any).count
  const offset = (page - 1) * pageSize

  const orders = db
    .prepare(
      `SELECT o.*, m.name as merchant_name, r.name as rider_name, z.name as zone_name 
       FROM orders o 
       LEFT JOIN merchants m ON o.merchant_id = m.id 
       LEFT JOIN riders r ON o.rider_id = r.id 
       LEFT JOIN dispatch_zones z ON o.zone_id = z.id 
       ${whereClause} ORDER BY o.id DESC LIMIT ? OFFSET ?`,
    )
    .all(...params, pageSize, offset)

  res.json({ success: true, data: { list: orders, total, page, page_size: pageSize } })
})

router.get('/:id', (req: Request, res: Response): void => {
  const order = db
    .prepare(
      `SELECT o.*, m.name as merchant_name, m.address as merchant_address, r.name as rider_name, r.phone as rider_phone, z.name as zone_name 
       FROM orders o 
       LEFT JOIN merchants m ON o.merchant_id = m.id 
       LEFT JOIN riders r ON o.rider_id = r.id 
       LEFT JOIN dispatch_zones z ON o.zone_id = z.id 
       WHERE o.id = ?`,
    )
    .get(req.params.id)

  if (!order) {
    res.status(404).json({ success: false, error: '订单不存在' })
    return
  }
  res.json({ success: true, data: order })
})

router.post('/', (req: Request, res: Response): void => {
  const { type, merchant_id, pickup_address, pickup_time_start, pickup_time_end, delivery_address, delivery_time_start, delivery_time_end, cargo_type, special_requirements, zone_id } = req.body

  if (!merchant_id || !pickup_address || !delivery_address) {
    res.status(400).json({ success: false, error: '商户ID、取货地址、配送地址为必填项' })
    return
  }

  const validOrderTypes = ['instant', 'scheduled', 'batch']
  if (type && !validOrderTypes.includes(type)) {
    res.status(400).json({ success: false, error: '订单类型必须为 instant/scheduled/batch' })
    return
  }

  if (type === 'scheduled' && (!pickup_time_start || !delivery_time_start)) {
    res.status(400).json({ success: false, error: '预约单必须填写取货开始时间和配送开始时间' })
    return
  }

  if (type === 'batch' && !pickup_time_start) {
    res.status(400).json({ success: false, error: '批量单必须填写取货开始时间' })
    return
  }

  const validCargoTypes = ['general', 'food', 'drink', 'medicine', 'document']
  if (cargo_type && !validCargoTypes.includes(cargo_type)) {
    res.status(400).json({ success: false, error: '货物类型必须为 general/food/drink/medicine/document' })
    return
  }

  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(merchant_id) as any
  if (!merchant) {
    res.status(400).json({ success: false, error: '商户不存在' })
    return
  }
  if (merchant.verify_status !== 'approved') {
    res.status(400).json({ success: false, error: '商户未通过审核，无法创建订单' })
    return
  }

  const orderNo = generateOrderNo()
  const result = db
    .prepare(
      `INSERT INTO orders (order_no, type, merchant_id, pickup_address, pickup_time_start, pickup_time_end, delivery_address, delivery_time_start, delivery_time_end, cargo_type, special_requirements, zone_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(orderNo, type || 'instant', merchant_id, pickup_address, pickup_time_start || '', pickup_time_end || '', delivery_address, delivery_time_start || '', delivery_time_end || '', cargo_type || 'general', special_requirements || '', zone_id || null)

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: order })
})

router.put('/:id', (req: Request, res: Response): void => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  if (!order) {
    res.status(404).json({ success: false, error: '订单不存在' })
    return
  }

  const fields: string[] = []
  const params: any[] = []
  const allowedFields = ['type', 'pickup_address', 'pickup_time_start', 'pickup_time_end', 'delivery_address', 'delivery_time_start', 'delivery_time_end', 'cargo_type', 'special_requirements', 'zone_id']

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      fields.push(`${field} = ?`)
      params.push(req.body[field])
    }
  }

  if (fields.length === 0) {
    res.status(400).json({ success: false, error: '没有需要更新的字段' })
    return
  }

  fields.push("updated_at = datetime('now', 'localtime')")
  params.push(req.params.id)

  db.prepare(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`).run(...params)
  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: updated })
})

router.post('/:id/dispatch', (req: Request, res: Response): void => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  if (!order) {
    res.status(404).json({ success: false, error: '订单不存在' })
    return
  }

  if ((order as any).status !== 'pending') {
    res.status(400).json({ success: false, error: '只有待调度订单才能进行智能调度' })
    return
  }

  const candidates = smartDispatch(Number(req.params.id))
  res.json({ success: true, data: { order_id: Number(req.params.id), candidates } })
})

router.post('/:id/grab', (req: Request, res: Response): void => {
  const { rider_id } = req.body
  if (!rider_id) {
    res.status(400).json({ success: false, error: 'rider_id 为必填项' })
    return
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  if (!order) {
    res.status(404).json({ success: false, error: '订单不存在' })
    return
  }

  if ((order as any).status !== 'pending' && (order as any).status !== 'dispatched') {
    res.status(400).json({ success: false, error: '该订单状态不允许抢单' })
    return
  }

  const rider = db.prepare('SELECT * FROM riders WHERE id = ?').get(rider_id)
  if (!rider) {
    res.status(404).json({ success: false, error: '骑手不存在' })
    return
  }

  db.prepare("UPDATE orders SET rider_id = ?, status = 'dispatched', updated_at = datetime('now', 'localtime') WHERE id = ?").run(rider_id, req.params.id)
  db.prepare("INSERT INTO dispatch_records (order_id, rider_id, dispatch_type, weight_score, rider_response) VALUES (?, ?, 'grab', 0, 'accepted')").run(req.params.id, rider_id)
  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: updated })
})

router.post('/:id/transfer', (req: Request, res: Response): void => {
  const { from_rider_id, to_rider_id } = req.body
  if (!from_rider_id || !to_rider_id) {
    res.status(400).json({ success: false, error: 'from_rider_id 和 to_rider_id 为必填项' })
    return
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  if (!order) {
    res.status(404).json({ success: false, error: '订单不存在' })
    return
  }

  if ((order as any).rider_id !== from_rider_id) {
    res.status(400).json({ success: false, error: '转单骑手与订单骑手不匹配' })
    return
  }

  const toRider = db.prepare('SELECT * FROM riders WHERE id = ?').get(to_rider_id)
  if (!toRider) {
    res.status(404).json({ success: false, error: '目标骑手不存在' })
    return
  }

  db.prepare("UPDATE orders SET rider_id = ?, updated_at = datetime('now', 'localtime') WHERE id = ?").run(to_rider_id, req.params.id)
  db.prepare("INSERT INTO dispatch_records (order_id, rider_id, dispatch_type, weight_score, rider_response) VALUES (?, ?, 'transfer', 0, 'accepted')").run(req.params.id, to_rider_id)
  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: updated })
})

router.put('/:id/status', (req: Request, res: Response): void => {
  const { status } = req.body
  const validStatuses = ['pending', 'dispatched', 'picking_up', 'delivering', 'completed', 'cancelled']
  if (!validStatuses.includes(status)) {
    res.status(400).json({ success: false, error: `status 必须为 ${validStatuses.join('/')}` })
    return
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  if (!order) {
    res.status(404).json({ success: false, error: '订单不存在' })
    return
  }

  db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now', 'localtime') WHERE id = ?").run(status, req.params.id)
  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: updated })
})

export default router
