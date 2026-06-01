import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/alerts/near-expiry', (_req: Request, res: Response): void => {
  const rows = db.prepare(`SELECT i.*, p.material_name, p.batch_no FROM inventories i JOIN procurements p ON i.procurement_id = p.id WHERE i.expiry_date <= date('now', '+7 days') AND i.expiry_date > date('now') AND i.status != 'disposed' ORDER BY i.expiry_date ASC`).all()
  res.json(rows)
})

router.get('/alerts/expired', (_req: Request, res: Response): void => {
  const rows = db.prepare(`SELECT i.*, p.material_name, p.batch_no FROM inventories i JOIN procurements p ON i.procurement_id = p.id WHERE i.expiry_date <= date('now') AND i.status != 'disposed' ORDER BY i.expiry_date ASC`).all()
  res.json(rows)
})

router.get('/', (req: Request, res: Response): void => {
  const { status, location, near_expiry } = req.query
  let sql = `SELECT i.*, p.material_name, p.batch_no FROM inventories i JOIN procurements p ON i.procurement_id = p.id WHERE 1=1`
  const params: any[] = []
  if (status) { sql += ' AND i.status = ?'; params.push(status as string) }
  if (location) { sql += ' AND i.location LIKE ?'; params.push(`%${location}%`) }
  if (near_expiry === 'true' || near_expiry === '1') {
    sql += ` AND i.expiry_date <= date('now', '+7 days') AND i.expiry_date > date('now') AND i.status != 'disposed'`
  }
  sql += ' ORDER BY i.expiry_date ASC'
  res.json(db.prepare(sql).all(...params))
})

router.get('/:id', (req: Request, res: Response): void => {
  const row = db.prepare(`SELECT i.*, p.material_name, p.batch_no, p.supplier_id, p.quantity AS procurement_quantity, p.unit, p.price, p.arrival_time, p.inspection_report, p.status AS procurement_status FROM inventories i JOIN procurements p ON i.procurement_id = p.id WHERE i.id = ?`).get(req.params.id)
  if (!row) { res.status(404).json({ error: '未找到' }); return }
  res.json(row)
})

router.put('/:id', (req: Request, res: Response): void => {
  const { status, remaining, location } = req.body
  db.prepare('UPDATE inventories SET status=COALESCE(?,status), remaining=COALESCE(?,remaining), location=COALESCE(?,location), updated_at=CURRENT_TIMESTAMP WHERE id=?').run(status, remaining, location, req.params.id)
  res.json({ ok: true })
})

export default router
