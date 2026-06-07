import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware, roleMiddleware } from '../middleware.js'

const router = Router()

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

router.post('/smart', authMiddleware, roleMiddleware('admin', 'family'), (req: Request, res: Response): void => {
  try {
    const { order_id } = req.body

    if (!order_id) {
      res.status(400).json({ success: false, error: '缺少订单ID' })
      return
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id) as any
    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }

    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(order.service_id) as any

    const nurses = db.prepare(
      "SELECT n.*, u.name, u.phone FROM nurses n JOIN users u ON n.user_id = u.id WHERE n.status IN ('verified', 'online')"
    ).all() as any[]

    const patient = order.patient_id
      ? db.prepare('SELECT * FROM patients WHERE id = ?').get(order.patient_id) as any
      : null

    const orderLat = patient ? 31.23 : (order.address ? 31.23 : 31.23)
    const orderLng = patient ? 121.47 : (order.address ? 121.47 : 121.47)

    const candidates = nurses.map(nurse => {
      let qualScore = 0
      if (service.required_qualification) {
        if (nurse.qualification === service.required_qualification) {
          qualScore = 100
        } else if (nurse.qualification === 'senior_nurse' && service.required_qualification === 'registered_nurse') {
          qualScore = 80
        } else {
          qualScore = 20
        }
      } else {
        qualScore = 70
      }

      const distance = haversineDistance(orderLat, orderLng, nurse.latitude, nurse.longitude)
      let distScore = Math.max(0, 100 - distance * 10)

      const ratingScore = (nurse.rating / 5) * 100

      const maxLoad = 5
      const loadScore = Math.max(0, (1 - nurse.today_load / maxLoad) * 100)

      const totalScore = qualScore * 0.4 + distScore * 0.25 + ratingScore * 0.2 + loadScore * 0.15

      return {
        nurse_id: nurse.id,
        name: nurse.name,
        qualification: nurse.qualification,
        rating: nurse.rating,
        today_load: nurse.today_load,
        distance: Math.round(distance * 100) / 100,
        scores: {
          qualification: Math.round(qualScore * 100) / 100,
          distance: Math.round(distScore * 100) / 100,
          rating: Math.round(ratingScore * 100) / 100,
          load: Math.round(loadScore * 100) / 100,
          total: Math.round(totalScore * 100) / 100
        }
      }
    })

    candidates.sort((a, b) => b.scores.total - a.scores.total)

    const top5 = candidates.slice(0, 5)

    db.prepare(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.user!.id, 'smart_dispatch', 'order', order_id, `candidates: ${top5.length}`, req.ip)

    res.json({ success: true, data: top5 })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/assign', authMiddleware, roleMiddleware('admin'), (req: Request, res: Response): void => {
  try {
    const { order_id, nurse_id } = req.body

    if (!order_id || !nurse_id) {
      res.status(400).json({ success: false, error: '缺少订单ID或护士ID' })
      return
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id) as any
    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }

    const nurse = db.prepare('SELECT * FROM nurses WHERE id = ?').get(nurse_id) as any
    if (!nurse) {
      res.status(404).json({ success: false, error: '护士不存在' })
      return
    }

    db.prepare('UPDATE orders SET nurse_id = ?, status = ? WHERE id = ?').run(nurse_id, 'dispatched', order_id)

    db.prepare(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.user!.id, 'assign_nurse', 'order', order_id, `nurse_id: ${nurse_id}`, req.ip)

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id)

    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
