import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { type, level, status } = req.query

  let whereClause = '1=1'
  const params: any[] = []

  if (type) {
    whereClause += ' AND type = ?'
    params.push(type)
  }
  if (level) {
    whereClause += ' AND level = ?'
    params.push(level)
  }
  if (status) {
    whereClause += ' AND status = ?'
    params.push(status)
  }

  const alerts = db.prepare(`
    SELECT * FROM alerts WHERE ${whereClause} ORDER BY trigger_time DESC
  `).all(...params)

  res.json({ success: true, data: alerts })
})

router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const { status, notes } = req.body

  if (!status || !['processed', 'pending'].includes(status)) {
    res.status(400).json({ success: false, error: '无效的状态值' })
    return
  }

  const alert = db.prepare('SELECT * FROM alerts WHERE alert_id = ?').get(id) as any
  if (!alert) {
    res.status(404).json({ success: false, error: '告警记录不存在' })
    return
  }

  db.prepare('UPDATE alerts SET status = ? WHERE alert_id = ?').run(status, id)

  const updated = db.prepare('SELECT * FROM alerts WHERE alert_id = ?').get(id)
  res.json({ success: true, data: updated })
})

export default router
