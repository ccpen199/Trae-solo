import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/alerts', (req: Request, res: Response): void => {
  try {
    const resolved = req.query.resolved
    let where = 'WHERE 1=1'
    const params: any[] = []

    if (resolved !== undefined) {
      where += ' AND resolved = ?'
      params.push(Number(resolved))
    }

    const alerts = db.prepare(
      `SELECT ma.*, r.name as rider_name, r.phone as rider_phone, o.order_no
       FROM monitoring_alerts ma
       JOIN riders r ON ma.rider_id = r.id
       LEFT JOIN delivery_orders o ON ma.order_id = o.id
       ${where}
       ORDER BY ma.created_at DESC`
    ).all(...params)

    res.json({ success: true, data: alerts })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/alerts', (req: Request, res: Response): void => {
  try {
    const { rider_id, order_id, alert_type, severity, message } = req.body
    if (!rider_id || !alert_type) {
      res.status(400).json({ success: false, error: 'rider_id and alert_type are required' })
      return
    }

    const result = db.prepare(
      `INSERT INTO monitoring_alerts (rider_id, order_id, alert_type, severity, message) VALUES (?, ?, ?, ?, ?)`
    ).run(rider_id, order_id || null, alert_type, severity || 'warning', message || null)

    const alert = db.prepare('SELECT * FROM monitoring_alerts WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: alert })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/alerts/:id/resolve', (req: Request, res: Response): void => {
  try {
    const alert = db.prepare('SELECT * FROM monitoring_alerts WHERE id = ?').get(req.params.id)
    if (!alert) {
      res.status(404).json({ success: false, error: 'Alert not found' })
      return
    }

    const now = new Date().toISOString()
    db.prepare('UPDATE monitoring_alerts SET resolved = 1, resolved_at = ? WHERE id = ?').run(now, req.params.id)

    const updated = db.prepare('SELECT * FROM monitoring_alerts WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/tracks', (req: Request, res: Response): void => {
  try {
    const rider_id = req.query.rider_id
    const order_id = req.query.order_id
    let where = 'WHERE 1=1'
    const params: any[] = []

    if (rider_id) {
      where += ' AND rider_id = ?'
      params.push(Number(rider_id))
    }
    if (order_id) {
      where += ' AND order_id = ?'
      params.push(Number(order_id))
    }

    const tracks = db.prepare(
      `SELECT gt.*, r.name as rider_name, o.order_no
       FROM gps_tracks gt
       JOIN riders r ON gt.rider_id = r.id
       LEFT JOIN delivery_orders o ON gt.order_id = o.id
       ${where}
       ORDER BY gt.recorded_at DESC
       LIMIT 500`
    ).all(...params)

    res.json({ success: true, data: tracks })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/tracks/check-deviation', (req: Request, res: Response): void => {
  try {
    const { order_id, current_lat, current_lng } = req.body
    if (!order_id || current_lat === undefined || current_lng === undefined) {
      res.status(400).json({ success: false, error: 'order_id, current_lat, current_lng are required' })
      return
    }

    const order = db.prepare('SELECT * FROM delivery_orders WHERE id = ?').get(order_id) as any
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' })
      return
    }

    function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
      const R = 6371000
      const dLat = ((lat2 - lat1) * Math.PI) / 180
      const dLng = ((lng2 - lng1) * Math.PI) / 180
      const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    }

    const pickupDist = haversine(current_lat, current_lng, order.pickup_lat, order.pickup_lng)
    const deliveryDist = haversine(current_lat, current_lng, order.delivery_lat, order.delivery_lng)
    const deviationThreshold = 2000

    const fromPickup = pickupDist
    const fromDelivery = deliveryDist
    const isDeviated = Math.min(fromPickup, fromDelivery) > deviationThreshold

    if (isDeviated && order.rider_id) {
      const existing = db.prepare(
        `SELECT * FROM monitoring_alerts WHERE order_id = ? AND alert_type = 'gps_deviation' AND resolved = 0`
      ).get(order_id)

      if (!existing) {
        db.prepare(
          `INSERT INTO monitoring_alerts (rider_id, order_id, alert_type, severity, message) VALUES (?, ?, 'gps_deviation', 'warning', ?)`
        ).run(order.rider_id, order_id, `GPS轨迹偏移超过${(deviationThreshold / 1000).toFixed(1)}公里`)
      }
    }

    res.json({
      success: true,
      data: {
        distance_from_pickup_meters: Math.round(fromPickup),
        distance_from_delivery_meters: Math.round(fromDelivery),
        deviation_threshold_meters: deviationThreshold,
        is_deviated: isDeviated,
      }
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
