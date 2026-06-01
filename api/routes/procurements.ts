import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { supplier_id, status, material_name } = req.query
  let sql = `SELECT p.*, s.name AS supplier_name FROM procurements p JOIN suppliers s ON p.supplier_id = s.id WHERE 1=1`
  const params: any[] = []
  if (supplier_id) { sql += ' AND p.supplier_id = ?'; params.push(Number(supplier_id)) }
  if (status) { sql += ' AND p.status = ?'; params.push(status as string) }
  if (material_name) { sql += ' AND p.material_name LIKE ?'; params.push(`%${material_name}%`) }
  sql += ' ORDER BY p.created_at DESC'
  res.json(db.prepare(sql).all(...params))
})

router.get('/:id', (req: Request, res: Response): void => {
  const row = db.prepare(`SELECT p.*, s.name AS supplier_name FROM procurements p JOIN suppliers s ON p.supplier_id = s.id WHERE p.id = ?`).get(req.params.id)
  if (!row) { res.status(404).json({ error: '未找到' }); return }
  res.json(row)
})

router.post('/', (req: Request, res: Response): void => {
  const { supplier_id, batch_no, material_name, inspection_report, quantity, unit, price, arrival_time, inspector_id, status } = req.body
  const r = db.prepare('INSERT INTO procurements (supplier_id, batch_no, material_name, inspection_report, quantity, unit, price, arrival_time, inspector_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(supplier_id, batch_no, material_name, inspection_report || null, quantity, unit, price, arrival_time, inspector_id || null, status || 'pending')
  res.json({ id: r.lastInsertRowid })
})

router.put('/:id', (req: Request, res: Response): void => {
  const { status } = req.body
  db.prepare('UPDATE procurements SET status=COALESCE(?,status), updated_at=CURRENT_TIMESTAMP WHERE id=?').run(status, req.params.id)
  res.json({ ok: true })
})

export default router
