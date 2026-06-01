import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { name, status } = req.query
  let sql = 'SELECT * FROM suppliers WHERE 1=1'
  const params: any[] = []
  if (name) { sql += ' AND name LIKE ?'; params.push(`%${name}%`) }
  if (status) { sql += ' AND status = ?'; params.push(status as string) }
  sql += ' ORDER BY created_at DESC'
  res.json(db.prepare(sql).all(...params))
})

router.get('/:id', (req: Request, res: Response): void => {
  const row = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id)
  if (!row) { res.status(404).json({ error: '未找到' }); return }
  res.json(row)
})

router.post('/', (req: Request, res: Response): void => {
  const { name, contact, phone, license_no, qualification_expiry, status } = req.body
  const r = db.prepare('INSERT INTO suppliers (name, contact, phone, license_no, qualification_expiry, status) VALUES (?, ?, ?, ?, ?, ?)').run(name, contact || null, phone || null, license_no || null, qualification_expiry || null, status || 'active')
  res.json({ id: r.lastInsertRowid })
})

router.put('/:id', (req: Request, res: Response): void => {
  const { name, contact, phone, license_no, qualification_expiry, status } = req.body
  db.prepare('UPDATE suppliers SET name=COALESCE(?,name), contact=COALESCE(?,contact), phone=COALESCE(?,phone), license_no=COALESCE(?,license_no), qualification_expiry=COALESCE(?,qualification_expiry), status=COALESCE(?,status), updated_at=CURRENT_TIMESTAMP WHERE id=?').run(name, contact, phone, license_no, qualification_expiry, status, req.params.id)
  res.json({ ok: true })
})

export default router
