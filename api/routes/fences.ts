import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { orgId, page = '1', pageSize = '20' } = req.query
    const p = Number(page)
    const ps = Number(pageSize)
    let where = 'WHERE 1=1'
    const params: any[] = []
    if (orgId) {
      where += ' AND f.org_id = ?'
      params.push(Number(orgId))
    }
    const total = (db.prepare(`SELECT COUNT(*) as count FROM fences f ${where}`).get(...params) as any).count
    const list = db.prepare(
      `SELECT f.*, o.name as org_name FROM fences f LEFT JOIN organizations o ON f.org_id = o.id ${where} ORDER BY f.id LIMIT ? OFFSET ?`,
    ).all(...params, ps, (p - 1) * ps)
    res.json({ success: true, data: { list, total } })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.post('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { name, type, coordinates, radius, enabled, alert_type, orgId } = req.body
    const result = db.prepare(
      'INSERT INTO fences (name, type, coordinates, radius, enabled, alert_type, org_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).run(name, type, JSON.stringify(coordinates), radius || null, enabled !== false ? 1 : 0, alert_type, orgId)
    const fence = db.prepare('SELECT * FROM fences WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: fence })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.put('/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { name, type, coordinates, radius, enabled, alert_type, orgId } = req.body
    const existing = db.prepare('SELECT * FROM fences WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '围栏不存在' })
      return
    }
    db.prepare(
      'UPDATE fences SET name=?, type=?, coordinates=?, radius=?, enabled=?, alert_type=?, org_id=? WHERE id=?',
    ).run(
      name || existing.name,
      type || existing.type,
      coordinates ? JSON.stringify(coordinates) : existing.coordinates,
      radius !== undefined ? radius : existing.radius,
      enabled !== undefined ? (enabled ? 1 : 0) : existing.enabled,
      alert_type || existing.alert_type,
      orgId || existing.org_id,
      req.params.id,
    )
    const fence = db.prepare('SELECT * FROM fences WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: fence })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.delete('/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const existing = db.prepare('SELECT * FROM fences WHERE id = ?').get(req.params.id)
    if (!existing) {
      res.status(404).json({ success: false, error: '围栏不存在' })
      return
    }
    db.prepare('DELETE FROM fence_bindings WHERE fence_id = ?').run(req.params.id)
    db.prepare('DELETE FROM fences WHERE id = ?').run(req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.get('/:id/bindings', authMiddleware, (req: Request, res: Response): void => {
  try {
    const bindings = db.prepare('SELECT * FROM fence_bindings WHERE fence_id = ?').all(req.params.id)
    res.json({ success: true, data: bindings })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.post('/:id/bindings', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { vehicleId, fleetId } = req.body
    const result = db.prepare('INSERT INTO fence_bindings (fence_id, vehicle_id, fleet_id) VALUES (?, ?, ?)').run(
      Number(req.params.id),
      vehicleId || null,
      fleetId || null,
    )
    res.status(201).json({ success: true, data: { id: result.lastInsertRowid } })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

export default router
