import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { anomaly_id } = req.query
  let sql = 'SELECT * FROM rectifications WHERE 1=1'
  const params: any[] = []
  if (anomaly_id) { sql += ' AND anomaly_id = ?'; params.push(Number(anomaly_id)) }
  res.json(db.prepare(sql).all(...params))
})

router.post('/', (req: Request, res: Response): void => {
  const { anomaly_id, measure, result, operator_id } = req.body
  const r = db.prepare('INSERT INTO rectifications (anomaly_id, measure, result, operator_id) VALUES (?, ?, ?, ?)').run(anomaly_id, measure, result || null, operator_id || null)
  res.json({ id: r.lastInsertRowid })
})

router.put('/:id', (req: Request, res: Response): void => {
  const { measure, result } = req.body
  db.prepare('UPDATE rectifications SET measure=COALESCE(?,measure), result=COALESCE(?,result) WHERE id=?').run(measure, result, req.params.id)
  res.json({ ok: true })
})

export default router
