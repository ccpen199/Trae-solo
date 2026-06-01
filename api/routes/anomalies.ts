import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/stats', (_req: Request, res: Response): void => {
  const byType = db.prepare("SELECT type, COUNT(*) AS count FROM anomalies GROUP BY type").all()
  const byStatus = db.prepare("SELECT status, COUNT(*) AS count FROM anomalies GROUP BY status").all()
  res.json({ by_type: byType, by_status: byStatus })
})

router.get('/', (req: Request, res: Response): void => {
  const { type, status } = req.query
  let sql = 'SELECT * FROM anomalies WHERE 1=1'
  const params: any[] = []
  if (type) { sql += ' AND type = ?'; params.push(type as string) }
  if (status) { sql += ' AND status = ?'; params.push(status as string) }
  sql += ' ORDER BY created_at DESC'
  res.json(db.prepare(sql).all(...params))
})

router.get('/:id', (req: Request, res: Response): void => {
  const row = db.prepare('SELECT * FROM anomalies WHERE id = ?').get(req.params.id)
  if (!row) { res.status(404).json({ error: '未找到' }); return }
  const rectifications = db.prepare('SELECT * FROM rectifications WHERE anomaly_id = ?').all(req.params.id)
  ;(row as any).rectifications = rectifications
  res.json(row)
})

router.post('/', (req: Request, res: Response): void => {
  const { type, title, description, related_id, reporter_id } = req.body
  const r = db.prepare('INSERT INTO anomalies (type, title, description, related_id, status, reporter_id) VALUES (?, ?, ?, ?, ?, ?)').run(type, title, description || null, related_id || null, 'open', reporter_id || null)
  res.json({ id: r.lastInsertRowid })
})

router.put('/:id', (req: Request, res: Response): void => {
  const { status } = req.body
  db.prepare('UPDATE anomalies SET status=COALESCE(?,status), updated_at=CURRENT_TIMESTAMP WHERE id=?').run(status, req.params.id)
  res.json({ ok: true })
})

export default router
