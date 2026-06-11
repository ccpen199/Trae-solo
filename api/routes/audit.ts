import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.get('/logs', (req: Request, res: Response): void => {
  const { idCard, certificationId, startDate, endDate, action } = req.query

  let whereClause = '1=1'
  const params: any[] = []

  if (idCard) {
    whereClause += ' AND id_card = ?'
    params.push(idCard)
  }
  if (certificationId) {
    whereClause += ' AND certification_id = ?'
    params.push(certificationId)
  }
  if (startDate) {
    whereClause += ' AND timestamp >= ?'
    params.push(startDate)
  }
  if (endDate) {
    whereClause += ' AND timestamp <= ?'
    params.push(endDate)
  }
  if (action) {
    whereClause += ' AND action = ?'
    params.push(action)
  }

  const logs = db.prepare(`
    SELECT * FROM audit_logs WHERE ${whereClause} ORDER BY timestamp DESC LIMIT 200
  `).all(...params)

  res.json({ success: true, data: logs })
})

router.get('/logs/:id/screenshots', (req: Request, res: Response): void => {
  const { id } = req.params

  const log = db.prepare('SELECT * FROM audit_logs WHERE log_id = ?').get(id) as any
  if (!log) {
    res.status(404).json({ success: false, error: '审计日志不存在' })
    return
  }

  const screenshots = db.prepare(`
    SELECT * FROM screenshots WHERE certification_id = ? ORDER BY frame_order
  `).all(log.certification_id)

  res.json({ success: true, data: screenshots })
})

export default router
