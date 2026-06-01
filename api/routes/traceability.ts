import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/dish/:menuDishId', (req: Request, res: Response): void => {
  const dish = db.prepare('SELECT md.*, m.menu_date FROM menu_dishes md JOIN menus m ON md.menu_id = m.id WHERE md.id = ?').get(req.params.menuDishId)
  if (!dish) { res.status(404).json({ error: '未找到菜品' }); return }
  const ingredients = db.prepare(`SELECT mdi.*, p.material_name, p.batch_no, p.unit, p.price, p.inspection_report, p.status AS procurement_status, p.supplier_id, s.name AS supplier_name FROM menu_dish_ingredients mdi JOIN procurements p ON mdi.procurement_id = p.id JOIN suppliers s ON p.supplier_id = s.id WHERE mdi.menu_dish_id = ?`).all(req.params.menuDishId) as any[]
  for (const ing of ingredients) {
    const inv = db.prepare('SELECT * FROM inventories WHERE procurement_id = ?').all(ing.procurement_id)
    const reqs = db.prepare(`SELECT r.* FROM requisitions r JOIN inventories i ON r.inventory_id = i.id WHERE i.procurement_id = ?`).all(ing.procurement_id)
    ing.inventory = inv
    ing.requisitions = reqs
  }
  const sample = db.prepare('SELECT * FROM samples WHERE menu_dish_id = ?').get(req.params.menuDishId)
  ;(dish as any).ingredients = ingredients
  ;(dish as any).sample = sample || null
  res.json(dish)
})

router.get('/batch/:batchNo', (req: Request, res: Response): void => {
  const procurement = db.prepare(`SELECT p.*, s.name AS supplier_name FROM procurements p JOIN suppliers s ON p.supplier_id = s.id WHERE p.batch_no = ?`).get(req.params.batchNo)
  if (!procurement) { res.status(404).json({ error: '未找到批次' }); return }
  const inventories = db.prepare('SELECT * FROM inventories WHERE procurement_id = ?').all((procurement as any).id) as any[]
  for (const inv of inventories) {
    inv.requisitions = db.prepare('SELECT * FROM requisitions WHERE inventory_id = ?').all(inv.id)
  }
  const dishIngredients = db.prepare('SELECT menu_dish_id FROM menu_dish_ingredients WHERE procurement_id = ?').all((procurement as any).id) as any[]
  const dishIds = dishIngredients.map(di => di.menu_dish_id)
  const dishes = dishIds.length
    ? db.prepare(`SELECT md.*, m.menu_date FROM menu_dishes md JOIN menus m ON md.menu_id = m.id WHERE md.id IN (${dishIds.map(() => '?').join(',')})`).all(...dishIds) as any[]
    : []
  for (const dish of dishes) {
    dish.sample = db.prepare('SELECT * FROM samples WHERE menu_dish_id = ?').get(dish.id) || null
  }
  ;(procurement as any).inventories = inventories
  ;(procurement as any).menu_dishes = dishes
  res.json(procurement)
})

router.get('/supplier/:supplierId', (req: Request, res: Response): void => {
  const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.supplierId)
  if (!supplier) { res.status(404).json({ error: '未找到供应商' }); return }
  const procurements = db.prepare('SELECT id, batch_no, material_name, quantity, unit, price, status, arrival_time, created_at FROM procurements WHERE supplier_id = ? ORDER BY created_at DESC').all(req.params.supplierId)
  ;(supplier as any).procurements = procurements
  res.json(supplier)
})

router.get('/export/report', (_req: Request, res: Response): void => {
  const supplierCount = (db.prepare('SELECT COUNT(*) AS count FROM suppliers').get() as any).count
  const procurementCount = (db.prepare('SELECT COUNT(*) AS count FROM procurements').get() as any).count
  const anomalyCount = (db.prepare('SELECT COUNT(*) AS count FROM anomalies').get() as any).count
  const sampleCount = (db.prepare('SELECT COUNT(*) AS count FROM samples').get() as any).count
  const nearExpiryCount = (db.prepare(`SELECT COUNT(*) AS count FROM inventories WHERE expiry_date <= date('now', '+7 days') AND expiry_date > date('now') AND status != 'disposed'`).get() as any).count
  res.json({ supplier_count: supplierCount, procurement_count: procurementCount, anomaly_count: anomalyCount, sample_count: sampleCount, near_expiry_count: nearExpiryCount })
})

export default router
