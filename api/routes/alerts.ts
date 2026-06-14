import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { type, level, status, vehicleId, startTime, endTime, page = '1', pageSize = '20' } = req.query
    const p = Number(page)
    const ps = Number(pageSize)
    let where = 'WHERE 1=1'
    const params: any[] = []
    if (type) {
      where += ' AND a.type = ?'
      params.push(type)
    }
    if (level) {
      where += ' AND a.level = ?'
      params.push(level)
    }
    if (status) {
      where += ' AND a.status = ?'
      params.push(status)
    }
    if (vehicleId) {
      where += ' AND a.vehicle_id = ?'
      params.push(Number(vehicleId))
    }
    if (startTime) {
      where += ' AND a.timestamp >= ?'
      params.push(startTime)
    }
    if (endTime) {
      where += ' AND a.timestamp <= ?'
      params.push(endTime)
    }
    const total = (db.prepare(`SELECT COUNT(*) as count FROM alerts a ${where}`).get(...params) as any).count
    const list = db.prepare(
      `SELECT a.*, v.plate_number as vehicle_plate, d.name as driver_name,
              u_processed.username as processed_by_name,
              u_confirm.username as confirm_by_name,
              u_resolve.username as resolve_by_name
       FROM alerts a
       LEFT JOIN vehicles v ON a.vehicle_id = v.id
       LEFT JOIN drivers d ON a.driver_id = d.id
       LEFT JOIN users u_processed ON a.processed_by = u_processed.id
       LEFT JOIN users u_confirm ON a.confirm_by = u_confirm.id
       LEFT JOIN users u_resolve ON a.resolve_by = u_resolve.id
       ${where} ORDER BY a.timestamp DESC LIMIT ? OFFSET ?`,
    ).all(...params, ps, (p - 1) * ps)
    res.json({ success: true, data: { list, total } })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.put('/:id/process', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { action, remark } = req.body
    if (!['acknowledge', 'resolve', 'dismiss'].includes(action)) {
      res.status(400).json({ success: false, error: '无效的操作类型' })
      return
    }
    const existing = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '告警不存在' })
      return
    }
    const statusMap: Record<string, string> = {
      acknowledge: 'acknowledged',
      resolve: 'resolved',
      dismiss: 'dismissed',
    }
    const newStatus = statusMap[action]
    const now = new Date().toISOString()
    const userId = req.user!.id

    const processTxn = db.transaction(() => {
      if (action === 'acknowledge') {
        db.prepare(
          'UPDATE alerts SET status = ?, confirm_at = ?, confirm_by = ?, confirm_note = ?, processed_by = ?, processed_at = ?, remark = ? WHERE id = ?',
        ).run(newStatus, now, userId, remark || null, userId, now, remark || null, req.params.id)
      } else if (action === 'resolve') {
        db.prepare(
          'UPDATE alerts SET status = ?, resolve_at = ?, resolve_by = ?, resolve_note = ?, processed_by = ?, processed_at = ?, remark = ? WHERE id = ?',
        ).run(newStatus, now, userId, remark || null, userId, now, remark || null, req.params.id)
      } else {
        db.prepare('UPDATE alerts SET status = ?, processed_by = ?, processed_at = ?, remark = ? WHERE id = ?').run(
          newStatus,
          userId,
          now,
          remark || null,
          req.params.id,
        )
      }
      db.prepare(
        'INSERT INTO alert_audit_logs (alert_id, action, processed_by, processed_at, note) VALUES (?, ?, ?, ?, ?)',
      ).run(req.params.id, action, userId, now, remark || null)
    })
    processTxn()

    const alert = db.prepare(
      `SELECT a.*, v.plate_number as vehicle_plate, d.name as driver_name,
              u_processed.username as processed_by_name,
              u_confirm.username as confirm_by_name,
              u_resolve.username as resolve_by_name
       FROM alerts a
       LEFT JOIN vehicles v ON a.vehicle_id = v.id
       LEFT JOIN drivers d ON a.driver_id = d.id
       LEFT JOIN users u_processed ON a.processed_by = u_processed.id
       LEFT JOIN users u_confirm ON a.confirm_by = u_confirm.id
       LEFT JOIN users u_resolve ON a.resolve_by = u_resolve.id
       WHERE a.id = ?`,
    ).get(req.params.id)
    res.json({ success: true, data: alert })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.get('/:id/audit-logs', authMiddleware, (req: Request, res: Response): void => {
  try {
    const logs = db.prepare(
      `SELECT l.*, u.username as processed_by_name
       FROM alert_audit_logs l
       LEFT JOIN users u ON l.processed_by = u.id
       WHERE l.alert_id = ?
       ORDER BY l.processed_at ASC`,
    ).all(req.params.id)
    res.json({ success: true, data: logs })
  } catch {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.put('/:id/review', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { note } = req.body
    const existing = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '告警不存在' })
      return
    }
    const now = new Date().toISOString()
    const userId = req.user!.id
    db.prepare(
      'INSERT INTO alert_audit_logs (alert_id, action, processed_by, processed_at, note) VALUES (?, ?, ?, ?, ?)',
    ).run(req.params.id, 'review', userId, now, note || null)
    res.json({ success: true, data: { ok: true } })
  } catch {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

export default router

