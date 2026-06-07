import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.max(1, Number(req.query.pageSize) || 20)
    const offset = (page - 1) * pageSize

    let where = 'WHERE 1=1'
    const params: any[] = []

    if (req.query.status) {
      where += ' AND o.status = ?'
      params.push(req.query.status)
    }
    if (req.query.rider_id) {
      where += ' AND o.rider_id = ?'
      params.push(Number(req.query.rider_id))
    }
    if (req.query.search) {
      where += ' AND (o.order_no LIKE ? OR o.pickup_address LIKE ? OR o.delivery_address LIKE ?)'
      params.push(`%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`)
    }

    const total = (db.prepare(`SELECT COUNT(*) as count FROM delivery_orders o ${where}`).get(...params) as any).count
    const rows = db.prepare(
      `SELECT o.*, r.name as rider_name, r.phone as rider_phone
       FROM delivery_orders o LEFT JOIN riders r ON o.rider_id = r.id
       ${where} ORDER BY o.id DESC LIMIT ? OFFSET ?`
    ).all(...params, pageSize, offset)

    res.json({ success: true, data: { list: rows, total, page, pageSize } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const order = db.prepare(
      `SELECT o.*, r.name as rider_name, r.phone as rider_phone, r.latitude as rider_lat, r.longitude as rider_lng
       FROM delivery_orders o LEFT JOIN riders r ON o.rider_id = r.id WHERE o.id = ?`
    ).get(req.params.id)

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' })
      return
    }

    const tracks = db.prepare(
      'SELECT * FROM gps_tracks WHERE order_id = ? ORDER BY recorded_at ASC'
    ).all(req.params.id)

    res.json({ success: true, data: { ...order, tracks } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const {
      order_no, pickup_lat, pickup_lng, pickup_address,
      delivery_lat, delivery_lng, delivery_address,
      estimated_pickup_time, estimated_delivery_time,
      delivery_time_window_start, delivery_time_window_end,
      weight, base_fee, reward, subsidy, timeout_penalty_tier
    } = req.body

    if (!order_no) {
      res.status(400).json({ success: false, error: 'order_no is required' })
      return
    }

    const now = new Date().toISOString()
    const result = db.prepare(
      `INSERT INTO delivery_orders (
        order_no, pickup_lat, pickup_lng, pickup_address,
        delivery_lat, delivery_lng, delivery_address,
        estimated_pickup_time, estimated_delivery_time,
        delivery_time_window_start, delivery_time_window_end,
        weight, base_fee, reward, subsidy, timeout_penalty_tier, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
    ).run(
      order_no, pickup_lat ?? null, pickup_lng ?? null, pickup_address || null,
      delivery_lat ?? null, delivery_lng ?? null, delivery_address || null,
      estimated_pickup_time || null, estimated_delivery_time || null,
      delivery_time_window_start || null, delivery_time_window_end || null,
      weight ?? 0, base_fee ?? 0, reward ?? 0, subsidy ?? 0, timeout_penalty_tier ?? 0,
      now, now
    )

    const order = db.prepare('SELECT * FROM delivery_orders WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: order })
  } catch (error: any) {
    if (error.message?.includes('UNIQUE')) {
      res.status(409).json({ success: false, error: 'Order number already exists' })
      return
    }
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const existing = db.prepare('SELECT * FROM delivery_orders WHERE id = ?').get(req.params.id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Order not found' })
      return
    }

    const fields: string[] = []
    const values: any[] = []
    const allowedFields = [
      'pickup_lat', 'pickup_lng', 'pickup_address',
      'delivery_lat', 'delivery_lng', 'delivery_address',
      'estimated_pickup_time', 'estimated_delivery_time',
      'delivery_time_window_start', 'delivery_time_window_end',
      'weight', 'base_fee', 'reward', 'subsidy', 'timeout_penalty_tier', 'rider_id'
    ]

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        fields.push(`${field} = ?`)
        values.push(req.body[field])
      }
    }

    if (fields.length === 0) {
      res.status(400).json({ success: false, error: 'No fields to update' })
      return
    }

    fields.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(req.params.id)

    db.prepare(`UPDATE delivery_orders SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    const order = db.prepare('SELECT * FROM delivery_orders WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: order })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/:id/pickup', (req: Request, res: Response): void => {
  try {
    const order = db.prepare('SELECT * FROM delivery_orders WHERE id = ?').get(req.params.id) as any
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' })
      return
    }
    if (order.status !== 'assigned') {
      res.status(400).json({ success: false, error: 'Order must be in assigned status to pickup' })
      return
    }

    const now = new Date().toISOString()
    db.prepare("UPDATE delivery_orders SET status = 'picked_up', picked_up_at = ?, updated_at = ? WHERE id = ?").run(now, now, req.params.id)

    const updated = db.prepare('SELECT * FROM delivery_orders WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/:id/deliver', (req: Request, res: Response): void => {
  try {
    const order = db.prepare('SELECT * FROM delivery_orders WHERE id = ?').get(req.params.id) as any
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' })
      return
    }
    if (order.status !== 'picked_up') {
      res.status(400).json({ success: false, error: 'Order must be in picked_up status to deliver' })
      return
    }

    const now = new Date().toISOString()
    db.prepare("UPDATE delivery_orders SET status = 'delivered', delivered_at = ?, updated_at = ? WHERE id = ?").run(now, now, req.params.id)

    if (order.rider_id) {
      db.prepare('UPDATE riders SET total_orders = total_orders + 1, total_income = total_income + ? WHERE id = ?').run(
        (order.base_fee || 0) + (order.reward || 0) + (order.subsidy || 0),
        order.rider_id
      )
      db.prepare('UPDATE riders SET current_load = MAX(0, current_load - 1) WHERE id = ?').run(order.rider_id)
    }

    const updated = db.prepare('SELECT * FROM delivery_orders WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/:id/cancel', (req: Request, res: Response): void => {
  try {
    const order = db.prepare('SELECT * FROM delivery_orders WHERE id = ?').get(req.params.id) as any
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' })
      return
    }
    if (['delivered', 'cancelled'].includes(order.status)) {
      res.status(400).json({ success: false, error: `Cannot cancel order in ${order.status} status` })
      return
    }

    const now = new Date().toISOString()
    db.prepare("UPDATE delivery_orders SET status = 'cancelled', updated_at = ? WHERE id = ?").run(now, req.params.id)

    if (order.rider_id) {
      db.prepare('UPDATE riders SET current_load = MAX(0, current_load - 1) WHERE id = ?').run(order.rider_id)
    }

    const updated = db.prepare('SELECT * FROM delivery_orders WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:id/tracks', (req: Request, res: Response): void => {
  try {
    const tracks = db.prepare('SELECT * FROM gps_tracks WHERE order_id = ? ORDER BY recorded_at ASC').all(req.params.id)
    res.json({ success: true, data: tracks })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/:id/track', (req: Request, res: Response): void => {
  try {
    const { rider_id, latitude, longitude, speed, heading } = req.body
    if (!rider_id || latitude === undefined || longitude === undefined) {
      res.status(400).json({ success: false, error: 'rider_id, latitude, longitude are required' })
      return
    }

    const result = db.prepare(
      `INSERT INTO gps_tracks (rider_id, order_id, latitude, longitude, speed, heading) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(rider_id, req.params.id, latitude, longitude, speed ?? 0, heading ?? 0)

    const track = db.prepare('SELECT * FROM gps_tracks WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: track })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
