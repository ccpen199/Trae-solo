import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

router.post('/auto', (req: Request, res: Response): void => {
  try {
    const { order_id } = req.body
    if (!order_id) {
      res.status(400).json({ success: false, error: 'order_id is required' })
      return
    }

    const order = db.prepare('SELECT * FROM delivery_orders WHERE id = ?').get(order_id) as any
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' })
      return
    }
    if (order.status !== 'pending') {
      res.status(400).json({ success: false, error: 'Order is not in pending status' })
      return
    }

    const riders = db.prepare(
      `SELECT * FROM riders WHERE status = 'online' AND current_load < max_load`
    ).all() as any[]

    if (riders.length === 0) {
      res.status(404).json({ success: false, error: 'No available riders' })
      return
    }

    const grids = db.prepare('SELECT * FROM capacity_grids').all() as any[]

    function getNearestGridWeather(lat: number, lng: number): { factor: number; desc: string } {
      let nearest = grids[0]
      let minDist = Infinity
      for (const g of grids) {
        const d = haversineDistance(lat, lng, g.center_lat, g.center_lng)
        if (d < minDist) {
          minDist = d
          nearest = g
        }
      }
      return { factor: nearest.weather_factor, desc: nearest.weather_description }
    }

    const now = new Date()
    const scored = riders.map(rider => {
      const pickupDist = haversineDistance(rider.latitude, rider.longitude, order.pickup_lat, order.pickup_lng)
      const maxDist = 20
      const distScore = Math.max(0, 1 - pickupDist / maxDist)

      const perfScore = rider.performance_rate

      const loadScore = 1 - rider.current_load / rider.max_load

      let noviceBonus = 0
      if (rider.is_novice && rider.novice_start_date) {
        const startDate = new Date(rider.novice_start_date)
        const daysSinceStart = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceStart <= 7) {
          noviceBonus = 0.10
        }
      }

      const weather = getNearestGridWeather(rider.latitude, rider.longitude)
      const weatherScore = weather.factor

      const totalScore = distScore * 0.40 + perfScore * 0.25 + loadScore * 0.15 + (1 + noviceBonus) * 0.10 + weatherScore * 0.10

      return { rider, score: totalScore, distScore, perfScore, loadScore, noviceBonus, weatherScore, pickupDist }
    })

    scored.sort((a, b) => b.score - a.score)
    const best = scored[0]

    const nowISO = now.toISOString()
    db.prepare("UPDATE delivery_orders SET status = 'assigned', rider_id = ?, assigned_at = ?, updated_at = ? WHERE id = ?").run(best.rider.id, nowISO, nowISO, order_id)
    db.prepare('UPDATE riders SET current_load = current_load + 1 WHERE id = ?').run(best.rider.id)

    const dispatchReason = `距离:${best.pickupDist.toFixed(1)}km 绩效:${best.perfScore.toFixed(2)} 负载:${best.rider.current_load}/${best.rider.max_load}${best.noviceBonus > 0 ? ' 新手保护' : ''} 天气:${best.weatherScore.toFixed(2)}`

    db.prepare(
      `INSERT INTO dispatch_logs (order_id, rider_id, score, dispatch_reason) VALUES (?, ?, ?, ?)`
    ).run(order_id, best.rider.id, best.score, dispatchReason)

    const updatedOrder = db.prepare(
      `SELECT o.*, r.name as rider_name, r.phone as rider_phone FROM delivery_orders o JOIN riders r ON o.rider_id = r.id WHERE o.id = ?`
    ).get(order_id)

    res.json({ success: true, data: { order: updatedOrder, dispatch: { rider_id: best.rider.id, rider_name: best.rider.name, score: best.score, reason: dispatchReason } } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/manual', (req: Request, res: Response): void => {
  try {
    const { order_id, rider_id } = req.body
    if (!order_id || !rider_id) {
      res.status(400).json({ success: false, error: 'order_id and rider_id are required' })
      return
    }

    const order = db.prepare('SELECT * FROM delivery_orders WHERE id = ?').get(order_id) as any
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' })
      return
    }
    if (order.status !== 'pending') {
      res.status(400).json({ success: false, error: 'Order is not in pending status' })
      return
    }

    const rider = db.prepare('SELECT * FROM riders WHERE id = ?').get(rider_id) as any
    if (!rider) {
      res.status(404).json({ success: false, error: 'Rider not found' })
      return
    }

    const nowISO = new Date().toISOString()
    db.prepare("UPDATE delivery_orders SET status = 'assigned', rider_id = ?, assigned_at = ?, updated_at = ? WHERE id = ?").run(rider_id, nowISO, nowISO, order_id)
    db.prepare('UPDATE riders SET current_load = current_load + 1 WHERE id = ?').run(rider_id)

    db.prepare(
      `INSERT INTO dispatch_logs (order_id, rider_id, score, dispatch_reason) VALUES (?, ?, ?, ?)`
    ).run(order_id, rider_id, 0, '手动派单')

    const updatedOrder = db.prepare(
      `SELECT o.*, r.name as rider_name, r.phone as rider_phone FROM delivery_orders o JOIN riders r ON o.rider_id = r.id WHERE o.id = ?`
    ).get(order_id)

    res.json({ success: true, data: { order: updatedOrder } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/logs', (req: Request, res: Response): void => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.max(1, Number(req.query.pageSize) || 20)
    const offset = (page - 1) * pageSize

    const total = (db.prepare('SELECT COUNT(*) as count FROM dispatch_logs').get() as any).count
    const logs = db.prepare(
      `SELECT dl.*, r.name as rider_name, o.order_no
       FROM dispatch_logs dl
       JOIN riders r ON dl.rider_id = r.id
       JOIN delivery_orders o ON dl.order_id = o.id
       ORDER BY dl.created_at DESC LIMIT ? OFFSET ?`
    ).all(pageSize, offset)

    res.json({ success: true, data: { list: logs, total, page, pageSize } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
