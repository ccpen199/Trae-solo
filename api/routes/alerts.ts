import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const status = req.query.status as string
  const type = req.query.type as string

  const conditions: string[] = []
  const params: any[] = []

  if (status) {
    conditions.push('a.status = ?')
    params.push(status)
  }
  if (type) {
    conditions.push('a.type = ?')
    params.push(type)
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
  const alerts = db
    .prepare(
      `SELECT a.*, r.name as rider_name, o.order_no, z.name as zone_name FROM alerts a LEFT JOIN riders r ON a.rider_id = r.id LEFT JOIN orders o ON a.order_id = o.id LEFT JOIN dispatch_zones z ON a.zone_id = z.id ${whereClause} ORDER BY a.created_at DESC`,
    )
    .all(...params)

  res.json({ success: true, data: alerts })
})

router.put('/:id', (req: Request, res: Response): void => {
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id)
  if (!alert) {
    res.status(404).json({ success: false, error: '告警不存在' })
    return
  }

  db.prepare("UPDATE alerts SET status = 'handled', handled_at = datetime('now', 'localtime') WHERE id = ?").run(req.params.id)
  db.prepare("INSERT INTO verify_logs (target_type, target_id, action, operator, reason) VALUES (?, ?, ?, ?, ?)").run('alert', req.params.id, 'alert_handled', 'admin', req.body.remark || '')
  const updated = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: updated })
})

export default router
