import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { menu_date, from, to } = req.query
  let sql = 'SELECT * FROM menus WHERE 1=1'
  const params: any[] = []
  if (menu_date) { sql += ' AND menu_date = ?'; params.push(menu_date as string) }
  if (from) { sql += ' AND menu_date >= ?'; params.push(from as string) }
  if (to) { sql += ' AND menu_date <= ?'; params.push(to as string) }
  sql += ' ORDER BY menu_date DESC'
  res.json(db.prepare(sql).all(...params))
})

router.get('/:id', (req: Request, res: Response): void => {
  const menu = db.prepare('SELECT * FROM menus WHERE id = ?').get(req.params.id)
  if (!menu) { res.status(404).json({ error: '未找到' }); return }
  const dishes = db.prepare('SELECT * FROM menu_dishes WHERE menu_id = ?').all(req.params.id) as any[]
  const dishIds = dishes.map(d => d.id)
  const ingredients = dishIds.length
    ? db.prepare(`SELECT mdi.*, p.material_name, p.batch_no, p.unit, p.price, p.supplier_id FROM menu_dish_ingredients mdi JOIN procurements p ON mdi.procurement_id = p.id WHERE mdi.menu_dish_id IN (${dishIds.map(() => '?').join(',')})`).all(...dishIds) as Array<{ menu_dish_id: number }>
    : []
  const ingredientMap = new Map<number, any[]>()
  for (const ing of ingredients) {
    if (!ingredientMap.has(ing.menu_dish_id)) ingredientMap.set(ing.menu_dish_id, [])
    ingredientMap.get(ing.menu_dish_id)!.push(ing)
  }
  const sampleStmt = db.prepare('SELECT * FROM samples WHERE menu_dish_id = ?')
  for (const dish of dishes) {
    ;(dish as any).ingredients = ingredientMap.get(dish.id) || []
    ;(dish as any).sample = sampleStmt.get(dish.id) || null
  }
  ;(menu as any).dishes = dishes
  res.json(menu)
})

router.post('/', (req: Request, res: Response): void => {
  const { menu_date } = req.body
  const r = db.prepare('INSERT INTO menus (menu_date) VALUES (?)').run(menu_date)
  res.json({ id: r.lastInsertRowid })
})

router.post('/:id/dishes', (req: Request, res: Response): void => {
  const { dish_name, chef_id } = req.body
  const r = db.prepare('INSERT INTO menu_dishes (menu_id, dish_name, chef_id) VALUES (?, ?, ?)').run(req.params.id, dish_name, chef_id || null)
  res.json({ id: r.lastInsertRowid })
})

router.post('/dishes/:dishId/ingredients', (req: Request, res: Response): void => {
  const { procurement_id, quantity } = req.body
  const r = db.prepare('INSERT INTO menu_dish_ingredients (menu_dish_id, procurement_id, quantity) VALUES (?, ?, ?)').run(req.params.dishId, procurement_id, quantity)
  res.json({ id: r.lastInsertRowid })
})

router.delete('/dishes/:dishId', (req: Request, res: Response): void => {
  db.prepare('DELETE FROM menu_dish_ingredients WHERE menu_dish_id = ?').run(req.params.dishId)
  db.prepare('DELETE FROM samples WHERE menu_dish_id = ?').run(req.params.dishId)
  db.prepare('DELETE FROM menu_dishes WHERE id = ?').run(req.params.dishId)
  res.json({ ok: true })
})

export default router
