import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware, roleMiddleware } from '../middleware.js'

const router = Router()

router.get('/patients', authMiddleware, roleMiddleware('family'), (req: Request, res: Response): void => {
  try {
    const patients = db.prepare('SELECT * FROM patients WHERE family_user_id = ? ORDER BY created_at DESC').all(req.user!.id) as any[]

    res.json({ success: true, data: patients })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/patients/:id', authMiddleware, roleMiddleware('family'), (req: Request, res: Response): void => {
  try {
    const patient = db.prepare('SELECT * FROM patients WHERE id = ? AND family_user_id = ?').get(req.params.id, req.user!.id) as any
    if (!patient) {
      res.status(404).json({ success: false, error: '患者不存在' })
      return
    }

    res.json({ success: true, data: patient })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/orders', authMiddleware, roleMiddleware('family'), (req: Request, res: Response): void => {
  try {
    const { status } = req.query
    let sql = `SELECT o.*, s.name as service_name, s.category as service_category, s.price as service_price,
      p.name as patient_name, n_user.name as nurse_name
    FROM orders o
    LEFT JOIN services s ON o.service_id = s.id
    LEFT JOIN patients p ON o.patient_id = p.id
    LEFT JOIN nurses n ON o.nurse_id = n.id
    LEFT JOIN users n_user ON n.user_id = n_user.id
    WHERE o.family_user_id = ?`
    const params: any[] = [req.user!.id]

    if (status) {
      sql += ' AND o.status = ?'
      params.push(status)
    }

    sql += ' ORDER BY o.created_at DESC'

    const orders = db.prepare(sql).all(...params) as any[]

    res.json({ success: true, data: orders })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/nurse-location/:orderId', authMiddleware, roleMiddleware('family'), (req: Request, res: Response): void => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND family_user_id = ?').get(req.params.orderId, req.user!.id) as any
    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }

    const track = db.prepare(
      'SELECT latitude, longitude, recorded_at FROM service_tracks WHERE order_id = ? ORDER BY recorded_at DESC LIMIT 1'
    ).get(req.params.orderId) as any

    if (!track) {
      res.json({ success: true, data: null })
      return
    }

    res.json({ success: true, data: track })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
