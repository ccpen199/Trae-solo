import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { status, consumerId, technicianId } = req.query

  let sql = `SELECT o.*, d.brand, d.model, d.type as device_type,
    c.name as consumer_name, c.phone as consumer_phone,
    t.name as technician_name, t.phone as technician_phone
    FROM orders o
    LEFT JOIN devices d ON o.device_id = d.id
    LEFT JOIN users c ON o.consumer_id = c.id
    LEFT JOIN users t ON o.technician_id = t.id
    WHERE 1=1`
  const params: any[] = []

  if (status) {
    sql += ` AND o.status = ?`
    params.push(status)
  }
  if (consumerId) {
    sql += ` AND o.consumer_id = ?`
    params.push(consumerId)
  }
  if (technicianId) {
    sql += ` AND o.technician_id = ?`
    params.push(technicianId)
  }

  sql += ` ORDER BY o.created_at DESC`

  const orders = db.prepare(sql).all(...params) as any[]

  res.json({
    success: true,
    data: {
      orders: orders.map((o) => ({
        orderId: o.id,
        status: o.status,
        totalPrice: o.total_price,
        address: o.address,
        bookedAt: o.booked_at,
        createdAt: o.created_at,
        device: o.brand ? { id: o.device_id, brand: o.brand, model: o.model, type: o.device_type } : null,
        consumer: { id: o.consumer_id, name: o.consumer_name, phone: o.consumer_phone },
        technician: o.technician_id ? { id: o.technician_id, name: o.technician_name, phone: o.technician_phone } : null,
      })),
      total: orders.length,
    },
  })
})

router.get('/:id', (req: Request, res: Response): void => {
  const order = db.prepare(`SELECT o.*, d.brand, d.model, d.type as device_type, d.original_price,
    c.id as consumer_id, c.name as consumer_name, c.phone as consumer_phone, c.avatar as consumer_avatar,
    t.id as technician_id, t.name as technician_name, t.phone as technician_phone, t.avatar as technician_avatar
    FROM orders o
    LEFT JOIN devices d ON o.device_id = d.id
    LEFT JOIN users c ON o.consumer_id = c.id
    LEFT JOIN users t ON o.technician_id = t.id
    WHERE o.id = ?`).get(req.params.id) as any

  if (!order) {
    res.status(404).json({ success: false, error: '工单不存在' })
    return
  }

  const timeline = db.prepare('SELECT * FROM timeline_events WHERE order_id = ? ORDER BY created_at ASC').all(order.id) as any[]

  const orderParts = db.prepare(`SELECT op.*, p.name as part_name, p.category, p.status as part_status, p.warehouse_id, p.inbound_batch, p.inbound_date
    FROM order_parts op LEFT JOIN parts p ON op.part_code = p.code WHERE op.order_id = ?`).all(order.id) as any[]

  const escrow = db.prepare('SELECT * FROM escrows WHERE order_id = ?').get(order.id) as any

  const videos = db.prepare('SELECT * FROM video_records WHERE order_id = ? ORDER BY recorded_at ASC').all(order.id) as any[]

  res.json({
    success: true,
    data: {
      orderId: order.id,
      status: order.status,
      totalPrice: order.total_price,
      address: order.address,
      bookedAt: order.booked_at,
      createdAt: order.created_at,
      consumer: {
        id: order.consumer_id,
        name: order.consumer_name,
        phone: order.consumer_phone,
        avatar: order.consumer_avatar,
      },
      technician: order.technician_id ? {
        id: order.technician_id,
        name: order.technician_name,
        phone: order.technician_phone,
        avatar: order.technician_avatar,
      } : null,
      device: order.brand ? {
        id: order.device_id,
        brand: order.brand,
        model: order.model,
        type: order.device_type,
        originalPrice: order.original_price,
      } : null,
      timeline: timeline.map((t) => ({
        id: t.id,
        status: t.status,
        operatorId: t.operator_id,
        note: t.note,
        createdAt: t.created_at,
      })),
      parts: orderParts.map((p) => ({
        partCode: p.part_code,
        partName: p.part_name,
        category: p.category,
        quantity: p.quantity,
        status: p.part_status,
        warehouseId: p.warehouse_id,
        inboundBatch: p.inbound_batch,
        inboundDate: p.inbound_date,
      })),
      escrow: escrow ? {
        id: escrow.id,
        amount: escrow.amount,
        status: escrow.status,
        frozenAt: escrow.frozen_at,
        releasedAt: escrow.released_at,
      } : null,
      videoUrls: videos.map((v) => v.url),
    },
  })
})

router.post('/:id/accept', (req: Request, res: Response): void => {
  const { technicianId } = req.body
  const orderId = req.params.id

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any
  if (!order) {
    res.status(404).json({ success: false, error: '工单不存在' })
    return
  }

  if (order.status !== 'pending') {
    res.status(400).json({ success: false, error: '当前状态不允许接单' })
    return
  }

  const tech = db.prepare("SELECT * FROM technician_profiles WHERE user_id = ? AND status = 'approved'").get(technicianId) as any
  if (!tech) {
    res.status(403).json({ success: false, error: '技师不存在或未通过审核' })
    return
  }

  const now = new Date().toISOString()
  db.prepare('UPDATE orders SET technician_id = ?, status = ? WHERE id = ?').run(technicianId, 'accepted', orderId)
  db.prepare('INSERT INTO timeline_events (id, order_id, status, operator_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    `TL${Date.now()}`, orderId, 'accepted', technicianId, '技师已接单', now,
  )

  res.json({ success: true, data: { orderId, status: 'accepted' } })
})

router.post('/:id/arrive', (req: Request, res: Response): void => {
  const orderId = req.params.id
  const { location } = req.body

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any
  if (!order) {
    res.status(404).json({ success: false, error: '工单不存在' })
    return
  }

  if (order.status !== 'accepted') {
    res.status(400).json({ success: false, error: '当前状态不允许签到' })
    return
  }

  const now = new Date().toISOString()
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('arrived', orderId)
  db.prepare('INSERT INTO timeline_events (id, order_id, status, operator_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    `TL${Date.now()}`, orderId, 'arrived', order.technician_id,
    location ? `技师已到场签到，位置: ${location.lat},${location.lng}` : '技师已到场签到',
    now,
  )

  res.json({ success: true, data: { orderId, status: 'arrived' } })
})

router.post('/:id/complete', (req: Request, res: Response): void => {
  const orderId = req.params.id
  const { partsUsed, videoUrls, notes, totalPrice } = req.body

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any
  if (!order) {
    res.status(404).json({ success: false, error: '工单不存在' })
    return
  }

  if (!['arrived', 'repairing'].includes(order.status)) {
    res.status(400).json({ success: false, error: '当前状态不允许完工' })
    return
  }

  const now = new Date().toISOString()
  const price = totalPrice || order.total_price

  db.prepare('UPDATE orders SET status = ?, total_price = ? WHERE id = ?').run('verifying', price, orderId)
  db.prepare('INSERT INTO timeline_events (id, order_id, status, operator_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    `TL${Date.now()}`, orderId, 'verifying', order.technician_id,
    notes || '维修完成，等待验收',
    now,
  )

  if (partsUsed && Array.isArray(partsUsed)) {
    for (const pu of partsUsed) {
      const part = db.prepare('SELECT * FROM parts WHERE code = ?').get(pu.partCode) as any
      if (part) {
        db.prepare('UPDATE parts SET status = ?, bound_order_id = ? WHERE code = ?').run('used', orderId, pu.partCode)
        const existing = db.prepare('SELECT * FROM order_parts WHERE order_id = ? AND part_code = ?').get(orderId, pu.partCode) as any
        if (!existing) {
          db.prepare('INSERT INTO order_parts (id, order_id, part_code, quantity) VALUES (?, ?, ?, ?)').run(
            `OP${Date.now()}_${pu.partCode}`, orderId, pu.partCode, pu.quantity || 1,
          )
        }
      }
    }
  }

  if (videoUrls && Array.isArray(videoUrls)) {
    for (const url of videoUrls) {
      db.prepare('INSERT INTO video_records (id, order_id, url, duration, recorded_at) VALUES (?, ?, ?, ?, ?)').run(
        `VID${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, orderId, url, 0, now,
      )
    }
  }

  res.json({ success: true, data: { orderId, status: 'verifying' } })
})

router.post('/:id/verify', (req: Request, res: Response): void => {
  const orderId = req.params.id
  const { passed, complaint } = req.body

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any
  if (!order) {
    res.status(404).json({ success: false, error: '工单不存在' })
    return
  }

  if (order.status !== 'verifying') {
    res.status(400).json({ success: false, error: '当前状态不允许验收' })
    return
  }

  const now = new Date().toISOString()

  if (passed) {
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('completed', orderId)
    db.prepare('INSERT INTO timeline_events (id, order_id, status, operator_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      `TL${Date.now()}`, orderId, 'completed', order.consumer_id, '用户验收通过', now,
    )
    db.prepare('UPDATE escrows SET status = ?, released_at = ? WHERE order_id = ?').run('released', now, orderId)
    res.json({ success: true, data: { orderId, status: 'completed', escrowStatus: 'released' } })
  } else {
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('disputed', orderId)
    db.prepare('INSERT INTO timeline_events (id, order_id, status, operator_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      `TL${Date.now()}`, orderId, 'disputed', order.consumer_id, complaint || '用户验收不通过，发起争议', now,
    )
    db.prepare('UPDATE escrows SET status = ? WHERE order_id = ?').run('disputed', orderId)

    if (complaint) {
      const cmpId = `CMP${Date.now()}`
      db.prepare('INSERT INTO complaints (id, order_id, consumer_id, type, priority, status, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
        cmpId, orderId, order.consumer_id, 'quality', 'high', 'pending', complaint, now, now,
      )
    }

    res.json({ success: true, data: { orderId, status: 'disputed', escrowStatus: 'disputed' } })
  }
})

export default router
