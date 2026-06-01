import { Router, Request, Response } from 'express'
import db from '../db'

const router = Router()

interface Warehouse {
  id: number
  name: string
  code: string
  area: number
  height: number
  capacity: number
  fire_rating: string
  temperature_control: string
  monthly_rent: number
  available_date: string
  status: string
  location: string
  description: string
  created_at: string
  updated_at: string
}

router.get('/', (req: Request, res: Response) => {
  const { status } = req.query
  let sql = 'SELECT * FROM warehouses ORDER BY created_at DESC'
  const params: any[] = []
  
  if (status) {
    sql = 'SELECT * FROM warehouses WHERE status = ? ORDER BY created_at DESC'
    params.push(status)
  }
  
  const warehouses = db.prepare(sql).all(...params)
  res.json(warehouses)
})

router.get('/:id', (req: Request, res: Response) => {
  const warehouse = db.prepare('SELECT * FROM warehouses WHERE id = ?').get(req.params.id)
  if (!warehouse) {
    return res.status(404).json({ error: '仓库不存在' })
  }
  res.json(warehouse)
})

router.get('/:id/history', (req: Request, res: Response) => {
  const history = db.prepare(`
    SELECT h.*, w.name as warehouse_name 
    FROM warehouse_status_history h
    LEFT JOIN warehouses w ON h.warehouse_id = w.id
    WHERE h.warehouse_id = ?
    ORDER BY h.created_at DESC
  `).all(req.params.id)
  res.json(history)
})

router.post('/', (req: Request, res: Response) => {
  const { name, code, area, height, capacity, fire_rating, temperature_control, monthly_rent, available_date, location, description } = req.body
  
  try {
    const result = db.prepare(`
      INSERT INTO warehouses (name, code, area, height, capacity, fire_rating, temperature_control, monthly_rent, available_date, status, location, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', ?, ?)
    `).run(name, code, area, height, capacity, fire_rating, temperature_control, monthly_rent, available_date, location, description)
    
    res.status(201).json({ id: result.lastInsertRowid, message: '仓库创建成功' })
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: '仓库编码已存在' })
    }
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', (req: Request, res: Response) => {
  const { name, code, area, height, capacity, fire_rating, temperature_control, monthly_rent, available_date, location, description, status } = req.body
  const warehouseId = req.params.id
  
  const existing = db.prepare('SELECT * FROM warehouses WHERE id = ?').get(warehouseId) as Warehouse
  if (!existing) {
    return res.status(404).json({ error: '仓库不存在' })
  }
  
  try {
    db.prepare(`
      UPDATE warehouses 
      SET name = ?, code = ?, area = ?, height = ?, capacity = ?, fire_rating = ?, temperature_control = ?, 
          monthly_rent = ?, available_date = ?, location = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, code, area, height, capacity, fire_rating, temperature_control, monthly_rent, available_date, location, description, warehouseId)
    
    if (status && status !== existing.status) {
      db.prepare(`
        INSERT INTO warehouse_status_history (warehouse_id, old_status, new_status, reason, operator)
        VALUES (?, ?, ?, ?, 'system')
      `).run(warehouseId, existing.status, status, '更新仓库信息')
      
      db.prepare('UPDATE warehouses SET status = ? WHERE id = ?').run(status, warehouseId)
    }
    
    res.json({ message: '仓库更新成功' })
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: '仓库编码已存在' })
    }
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/status', (req: Request, res: Response) => {
  const { status, reason, operator } = req.body
  const warehouseId = req.params.id
  
  const existing = db.prepare('SELECT * FROM warehouses WHERE id = ?').get(warehouseId) as Warehouse
  if (!existing) {
    return res.status(404).json({ error: '仓库不存在' })
  }
  
  db.prepare(`
    INSERT INTO warehouse_status_history (warehouse_id, old_status, new_status, reason, operator)
    VALUES (?, ?, ?, ?, ?)
  `).run(warehouseId, existing.status, status, reason || '状态变更', operator || 'system')
  
  db.prepare('UPDATE warehouses SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, warehouseId)
  
  res.json({ message: '状态更新成功' })
})

router.delete('/:id', (req: Request, res: Response) => {
  const result = db.prepare('DELETE FROM warehouses WHERE id = ?').run(req.params.id)
  if (result.changes === 0) {
    return res.status(404).json({ error: '仓库不存在' })
  }
  res.json({ message: '仓库删除成功' })
})

export default router
