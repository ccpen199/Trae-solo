import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware, roleMiddleware } from '../middleware.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const { category } = req.query
    let sql = "SELECT * FROM services WHERE status = 'active'"
    const params: any[] = []

    if (category) {
      sql += ' AND category = ?'
      params.push(category)
    }

    sql += ' ORDER BY created_at DESC'

    const services = db.prepare(sql).all(...params) as any[]

    res.json({ success: true, data: services })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/', authMiddleware, roleMiddleware('admin'), (req: Request, res: Response): void => {
  try {
    const { name, category, sop, contraindications, price, duration_minutes, required_qualification } = req.body

    if (!name || !category || price === undefined) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const result = db.prepare(
      'INSERT INTO services (name, category, sop, contraindications, price, duration_minutes, required_qualification) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(name, category, sop || null, contraindications || null, price, duration_minutes || 60, required_qualification || null)

    db.prepare(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user!.id, 'create_service', 'service', result.lastInsertRowid, req.ip)

    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(result.lastInsertRowid)

    res.status(201).json({ success: true, data: service })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id) as any
    if (!service) {
      res.status(404).json({ success: false, error: '服务项目不存在' })
      return
    }

    res.json({ success: true, data: service })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id', authMiddleware, roleMiddleware('admin'), (req: Request, res: Response): void => {
  try {
    const existing = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '服务项目不存在' })
      return
    }

    const { name, category, sop, contraindications, price, duration_minutes, required_qualification, status } = req.body

    db.prepare(
      'UPDATE services SET name = ?, category = ?, sop = ?, contraindications = ?, price = ?, duration_minutes = ?, required_qualification = ?, status = ? WHERE id = ?'
    ).run(
      name || existing.name,
      category || existing.category,
      sop !== undefined ? sop : existing.sop,
      contraindications !== undefined ? contraindications : existing.contraindications,
      price !== undefined ? price : existing.price,
      duration_minutes || existing.duration_minutes,
      required_qualification !== undefined ? required_qualification : existing.required_qualification,
      status || existing.status,
      req.params.id
    )

    db.prepare(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user!.id, 'update_service', 'service', parseInt(req.params.id), req.ip)

    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id)

    res.json({ success: true, data: service })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/:id', authMiddleware, roleMiddleware('admin'), (req: Request, res: Response): void => {
  try {
    const existing = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '服务项目不存在' })
      return
    }

    db.prepare('UPDATE services SET status = ? WHERE id = ?').run('inactive', req.params.id)

    db.prepare(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user!.id, 'delete_service', 'service', parseInt(req.params.id), req.ip)

    res.json({ success: true, data: { message: '服务项目已停用' } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
