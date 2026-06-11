import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.get('/stats', auth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const byLevel = db.prepare(
      "SELECT level, COUNT(*) as count FROM device_alerts GROUP BY level"
    ).all()

    const byStatus = db.prepare(
      "SELECT status, COUNT(*) as count FROM device_alerts GROUP BY status"
    ).all()

    const byType = db.prepare(
      "SELECT type, COUNT(*) as count FROM device_alerts GROUP BY type"
    ).all()

    const byDate = db.prepare(
      "SELECT date(created_at) as date, COUNT(*) as count FROM device_alerts WHERE created_at >= date('now','-30 days','localtime') GROUP BY date(created_at) ORDER BY date"
    ).all()

    const total = (db.prepare('SELECT COUNT(*) as c FROM device_alerts').get() as any).c
    const active = (db.prepare("SELECT COUNT(*) as c FROM device_alerts WHERE status = 'active'").get() as any).c
    const critical = (db.prepare("SELECT COUNT(*) as c FROM device_alerts WHERE level = 'critical' AND status = 'active'").get() as any).c

    res.json({ success: true, data: { byLevel, byStatus, byType, byDate, total, active, critical } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { level, status, device_id, page = '1', pageSize = '20' } = req.query
    const p = Number(page)
    const ps = Number(pageSize)
    const conditions: string[] = []
    const params: any[] = []

    if (level) { conditions.push('da.level = ?'); params.push(level) }
    if (status) { conditions.push('da.status = ?'); params.push(status) }
    if (device_id) { conditions.push('da.device_id = ?'); params.push(device_id) }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
    const total = (db.prepare(`SELECT COUNT(*) as c FROM device_alerts da ${where}`).get(params) as any).c
    const rows = db.prepare(
      `SELECT da.*, d.name as device_name, d.type as device_type, u.name as handler_name
       FROM device_alerts da
       LEFT JOIN devices d ON da.device_id = d.id
       LEFT JOIN users u ON da.handler_id = u.id
       ${where} ORDER BY da.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, ps, (p - 1) * ps)

    res.json({ success: true, data: { list: rows, total, page: p, pageSize: ps } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const alert = db.prepare(
      `SELECT da.*, d.name as device_name, d.type as device_type, d.sn as device_sn, u.name as handler_name
       FROM device_alerts da
       LEFT JOIN devices d ON da.device_id = d.id
       LEFT JOIN users u ON da.handler_id = u.id
       WHERE da.id = ?`
    ).get(req.params.id) as any

    if (!alert) {
      res.status(404).json({ success: false, error: '告警不存在' })
      return
    }

    res.json({ success: true, data: alert })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id/handle', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, message } = req.body
    if (!['processing', 'resolved'].includes(status)) {
      res.status(400).json({ success: false, error: '处理状态无效' })
      return
    }

    const alert = db.prepare('SELECT id FROM device_alerts WHERE id = ?').get(req.params.id) as any
    if (!alert) {
      res.status(404).json({ success: false, error: '告警不存在' })
      return
    }

    db.prepare(
      "UPDATE device_alerts SET status = ?, handler_id = ?, handled_at = datetime('now','localtime') WHERE id = ?"
    ).run(status, req.user!.id, req.params.id)

    const updated = db.prepare('SELECT * FROM device_alerts WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
