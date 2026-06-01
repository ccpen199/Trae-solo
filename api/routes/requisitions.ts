import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { window_no, menu_id, operator_id } = req.query
  let sql = `SELECT r.*, i.location, i.remaining, i.expiry_date, p.material_name, p.batch_no, p.unit FROM requisitions r JOIN inventories i ON r.inventory_id = i.id JOIN procurements p ON i.procurement_id = p.id WHERE 1=1`
  const params: any[] = []
  if (window_no) { sql += ' AND r.window_no = ?'; params.push(window_no as string) }
  if (menu_id) { sql += ' AND r.menu_id = ?'; params.push(Number(menu_id)) }
  if (operator_id) { sql += ' AND r.operator_id = ?'; params.push(Number(operator_id)) }
  sql += ' ORDER BY r.requisition_time DESC'
  res.json(db.prepare(sql).all(...params))
})

router.post('/', (req: Request, res: Response): void => {
  const { inventory_id, quantity, window_no, menu_id, requisition_time, operator_id } = req.body
  const updateInventory = db.prepare('UPDATE inventories SET remaining = remaining - ? WHERE id = ? AND remaining >= ?')
  const insertRequisition = db.prepare('INSERT INTO requisitions (inventory_id, quantity, window_no, menu_id, requisition_time, operator_id) VALUES (?, ?, ?, ?, ?, ?)')
  const tx = db.transaction(() => {
    const upd = updateInventory.run(quantity, inventory_id, quantity)
    if (upd.changes === 0) throw new Error('库存不足')
    const r = insertRequisition.run(inventory_id, quantity, window_no, menu_id || null, requisition_time, operator_id)
    return r.lastInsertRowid
  })
  try {
    const id = tx()
    res.json({ id })
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

export default router
