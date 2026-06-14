import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { orgId, status, page = '1', pageSize = '20' } = req.query
    const p = Number(page)
    const ps = Number(pageSize)
    let where = 'WHERE 1=1'
    const params: any[] = []
    if (orgId) {
      where += ' AND dev.org_id = ?'
      params.push(Number(orgId))
    }
    if (status) {
      where += ' AND dev.status = ?'
      params.push(status)
    }
    const total = (db.prepare(`SELECT COUNT(*) as count FROM devices dev ${where}`).get(...params) as any).count
    const list = db.prepare(
      `SELECT dev.*, v.plate_number, o.name as org_name
       FROM devices dev
       LEFT JOIN vehicles v ON dev.vehicle_id = v.id
       LEFT JOIN organizations o ON dev.org_id = o.id
       ${where} ORDER BY dev.id LIMIT ? OFFSET ?`,
    ).all(...params, ps, (p - 1) * ps)
    res.json({ success: true, data: { list, total } })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.post('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { sn, protocol, vehicleId, orgId } = req.body
    const result = db.prepare(
      'INSERT INTO devices (sn, protocol, vehicle_id, org_id) VALUES (?, ?, ?, ?)',
    ).run(sn, protocol, vehicleId || null, orgId)
    const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: device })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.put('/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { vehicleId, orgId } = req.body
    const existing = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '设备不存在' })
      return
    }
    db.prepare('UPDATE devices SET vehicle_id=?, org_id=? WHERE id=?').run(
      vehicleId !== undefined ? vehicleId : existing.vehicle_id,
      orgId !== undefined ? orgId : existing.org_id,
      req.params.id,
    )
    const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: device })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.post('/:id/upgrade', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { firmwareVersion, targetVersion } = req.body
    const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id) as any
    if (!device) {
      res.status(404).json({ success: false, error: '设备不存在' })
      return
    }
    const result = db.prepare(
      'INSERT INTO upgrade_tasks (device_id, from_version, to_version, status) VALUES (?, ?, ?, ?)',
    ).run(Number(req.params.id), firmwareVersion || device.firmware_version, targetVersion, 'pending')
    res.status(201).json({ success: true, data: { taskId: result.lastInsertRowid } })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.get('/upgrade-tasks', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { status, page = '1', pageSize = '20' } = req.query
    const p = Number(page)
    const ps = Number(pageSize)
    let where = 'WHERE 1=1'
    const params: any[] = []
    if (status) {
      where += ' AND ut.status = ?'
      params.push(status)
    }
    const total = (db.prepare(`SELECT COUNT(*) as count FROM upgrade_tasks ut ${where}`).get(...params) as any).count
    const list = db.prepare(
      `SELECT ut.*, dev.sn as device_sn, dev.firmware_version as current_version
       FROM upgrade_tasks ut
       LEFT JOIN devices dev ON ut.device_id = dev.id
       ${where} ORDER BY ut.id DESC LIMIT ? OFFSET ?`,
    ).all(...params, ps, (p - 1) * ps)
    res.json({ success: true, data: { list, total } })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

export default router
