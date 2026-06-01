import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/missing', (req: Request, res: Response): void => {
  const { menu_id } = req.query
  if (!menu_id) { res.status(400).json({ error: 'menu_id 必填' }); return }
  const rows = db.prepare(`SELECT md.* FROM menu_dishes md LEFT JOIN samples s ON md.id = s.menu_dish_id WHERE md.menu_id = ? AND s.id IS NULL`).all(Number(menu_id))
  res.json(rows)
})

router.get('/', (req: Request, res: Response): void => {
  const { menu_dish_id, operator_id } = req.query
  let sql = `SELECT s.*, md.dish_name FROM samples s JOIN menu_dishes md ON s.menu_dish_id = md.id WHERE 1=1`
  const params: any[] = []
  if (menu_dish_id) { sql += ' AND s.menu_dish_id = ?'; params.push(Number(menu_dish_id)) }
  if (operator_id) { sql += ' AND s.operator_id = ?'; params.push(Number(operator_id)) }
  res.json(db.prepare(sql).all(...params))
})

router.post('/', (req: Request, res: Response): void => {
  const { menu_dish_id, photo_url, sample_time, operator_id } = req.body
  const r = db.prepare('INSERT INTO samples (menu_dish_id, photo_url, sample_time, operator_id) VALUES (?, ?, ?, ?)').run(menu_dish_id, photo_url || null, sample_time, operator_id)
  res.json({ id: r.lastInsertRowid })
})

export default router
