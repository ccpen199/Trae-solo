import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import path from 'path'
import db from '../db.js'
import { authMiddleware, roleMiddleware } from '../middleware.js'

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'))
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ storage })

const router = Router()

router.post('/', authMiddleware, roleMiddleware('family'), (req: Request, res: Response): void => {
  try {
    const { patient_id, service_id, scheduled_at, address, notes } = req.body

    if (!service_id) {
      res.status(400).json({ success: false, error: '缺少服务项目ID' })
      return
    }

    const service = db.prepare('SELECT * FROM services WHERE id = ? AND status = ?').get(service_id, 'active') as any
    if (!service) {
      res.status(404).json({ success: false, error: '服务项目不存在或已停用' })
      return
    }

    const result = db.prepare(
      'INSERT INTO orders (patient_id, service_id, family_user_id, status, scheduled_at, address, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      patient_id || null,
      service_id,
      req.user!.id,
      'pending',
      scheduled_at || null,
      address || null,
      notes || null
    )

    db.prepare(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user!.id, 'create_order', 'order', result.lastInsertRowid, req.ip)

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid)

    res.status(201).json({ success: true, data: order })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { status, nurse_id, family_user_id } = req.query
    let where = '1=1'
    const params: any[] = []

    if (status) {
      where += ' AND o.status = ?'
      params.push(status)
    }
    if (nurse_id) {
      where += ' AND o.nurse_id = ?'
      params.push(nurse_id)
    }
    if (family_user_id) {
      where += ' AND o.family_user_id = ?'
      params.push(family_user_id)
    }

    if (req.user!.role === 'family') {
      where += ' AND o.family_user_id = ?'
      params.push(req.user!.id)
    }
    if (req.user!.role === 'nurse') {
      const nurse = db.prepare('SELECT id FROM nurses WHERE user_id = ?').get(req.user!.id) as any
      if (nurse) {
        where += ' AND o.nurse_id = ?'
        params.push(nurse.id)
      }
    }

    const orders = db.prepare(
      `SELECT o.*, s.name as service_name, s.category as service_category, s.price as service_price,
        p.name as patient_name, n_user.name as nurse_name
      FROM orders o
      LEFT JOIN services s ON o.service_id = s.id
      LEFT JOIN patients p ON o.patient_id = p.id
      LEFT JOIN nurses n ON o.nurse_id = n.id
      LEFT JOIN users n_user ON n.user_id = n_user.id
      WHERE ${where}
      ORDER BY o.created_at DESC`
    ).all(...params) as any[]

    res.json({ success: true, data: orders })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any
    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }

    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(order.service_id) as any

    let nurse = null
    if (order.nurse_id) {
      const nurseRow = db.prepare('SELECT n.*, u.name, u.phone FROM nurses n JOIN users u ON n.user_id = u.id WHERE n.id = ?').get(order.nurse_id) as any
      nurse = nurseRow
    }

    let patient = null
    if (order.patient_id) {
      patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(order.patient_id)
    }

    const photos = db.prepare('SELECT * FROM service_photos WHERE order_id = ?').all(req.params.id) as any[]
    const confirmations = db.prepare('SELECT * FROM family_confirmations WHERE order_id = ?').all(req.params.id) as any[]
    const tracks = db.prepare('SELECT * FROM service_tracks WHERE order_id = ? ORDER BY recorded_at DESC LIMIT 1').get(req.params.id) as any

    res.json({
      success: true,
      data: { ...order, service, nurse, patient, photos, confirmations, latest_track: tracks || null }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id/status', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { status } = req.body
    const validStatuses = ['pending', 'dispatched', 'accepted', 'in_progress', 'completed', 'cancelled']

    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: '无效的状态值' })
      return
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any
    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }

    const completedAt = status === 'completed' ? "datetime('now')" : null

    if (completedAt) {
      db.prepare('UPDATE orders SET status = ?, completed_at = datetime(\'now\') WHERE id = ?').run(status, req.params.id)
    } else {
      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id)
    }

    if (status === 'completed') {
      db.prepare('UPDATE nurses SET total_services = total_services + 1 WHERE id = ?').run(order.nurse_id)
    }

    db.prepare(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.user!.id, 'update_order_status', 'order', parseInt(req.params.id), `status -> ${status}`, req.ip)

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)

    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/:id/accept', authMiddleware, roleMiddleware('nurse'), (req: Request, res: Response): void => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any
    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }

    if (order.status !== 'dispatched') {
      res.status(400).json({ success: false, error: '订单状态不可接受' })
      return
    }

    const nurse = db.prepare('SELECT id FROM nurses WHERE user_id = ?').get(req.user!.id) as any
    if (!nurse || order.nurse_id !== nurse.id) {
      res.status(403).json({ success: false, error: '无权接受此订单' })
      return
    }

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('accepted', req.params.id)
    db.prepare('UPDATE nurses SET today_load = today_load + 1 WHERE id = ?').run(nurse.id)

    db.prepare(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user!.id, 'accept_order', 'order', parseInt(req.params.id), req.ip)

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)

    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/:id/gps', authMiddleware, roleMiddleware('nurse'), (req: Request, res: Response): void => {
  try {
    const { latitude, longitude } = req.body

    if (latitude === undefined || longitude === undefined) {
      res.status(400).json({ success: false, error: '缺少经纬度信息' })
      return
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any
    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }

    db.prepare(
      'INSERT INTO service_tracks (order_id, latitude, longitude) VALUES (?, ?, ?)'
    ).run(req.params.id, latitude, longitude)

    res.status(201).json({ success: true, data: { message: 'GPS位置已记录' } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/:id/photos', authMiddleware, roleMiddleware('nurse'), upload.single('photo'), (req: Request, res: Response): void => {
  try {
    const { photo_type } = req.body
    const file = req.file

    if (!file) {
      res.status(400).json({ success: false, error: '缺少照片文件' })
      return
    }

    const validTypes = ['before', 'after', 'document']
    if (!photo_type || !validTypes.includes(photo_type)) {
      res.status(400).json({ success: false, error: '无效的照片类型' })
      return
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any
    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }

    const result = db.prepare(
      'INSERT INTO service_photos (order_id, photo_type, file_path) VALUES (?, ?, ?)'
    ).run(parseInt(req.params.id), photo_type, file.path)

    db.prepare(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.user!.id, 'upload_photo', 'order', parseInt(req.params.id), `type: ${photo_type}`, req.ip)

    res.status(201).json({
      success: true,
      data: { id: result.lastInsertRowid, photo_type, file_path: file.path }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/:id/signature', authMiddleware, roleMiddleware('nurse'), (req: Request, res: Response): void => {
  try {
    const { signature_data } = req.body

    if (!signature_data) {
      res.status(400).json({ success: false, error: '缺少签名数据' })
      return
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any
    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('completed', req.params.id)

    const result = db.prepare(
      'INSERT INTO family_confirmations (order_id, user_id, signature_data) VALUES (?, ?, ?)'
    ).run(parseInt(req.params.id), req.user!.id, signature_data)

    db.prepare('UPDATE nurses SET total_services = total_services + 1 WHERE id = ?').run(order.nurse_id)

    db.prepare(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user!.id, 'sign_order', 'order', parseInt(req.params.id), req.ip)

    res.status(201).json({
      success: true,
      data: { id: result.lastInsertRowid, message: '签名已提交，订单已完成' }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/:id/family-confirm', authMiddleware, roleMiddleware('family'), (req: Request, res: Response): void => {
  try {
    const { signature_data } = req.body

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any
    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }

    if (order.family_user_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '无权确认此订单' })
      return
    }

    const result = db.prepare(
      'INSERT INTO family_confirmations (order_id, user_id, signature_data) VALUES (?, ?, ?)'
    ).run(parseInt(req.params.id), req.user!.id, signature_data || null)

    db.prepare(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user!.id, 'family_confirm', 'order', parseInt(req.params.id), req.ip)

    res.status(201).json({
      success: true,
      data: { id: result.lastInsertRowid, message: '家属确认已提交' }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
