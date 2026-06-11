import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

interface ProcurementRow {
  id: string
  publisher_id: string
  title: string
  category: string
  craft_type: string
  quantity: number
  unit: string
  delivery_date: string
  budget_min: number | null
  budget_max: number | null
  location: string
  description: string
  status: string
  created_at: string
}

function formatRow(row: ProcurementRow) {
  return {
    id: row.id,
    publisherId: row.publisher_id,
    title: row.title,
    category: row.category,
    craftType: JSON.parse(row.craft_type || '[]'),
    quantity: row.quantity,
    unit: row.unit,
    deliveryDate: row.delivery_date,
    budget: { min: row.budget_min, max: row.budget_max },
    location: row.location,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
  }
}

router.get('/', (req: Request, res: Response): void => {
  try {
    const { category, craftType, location, status } = req.query
    let sql = 'SELECT * FROM procurement_requests WHERE 1=1'
    const params: unknown[] = []

    if (category) {
      sql += ' AND category = ?'
      params.push(category)
    }
    if (craftType) {
      sql += ' AND craft_type LIKE ?'
      params.push(`%${craftType}%`)
    }
    if (location) {
      sql += ' AND location LIKE ?'
      params.push(`%${location}%`)
    }
    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }

    sql += ' ORDER BY created_at DESC'

    const rows = db.prepare(sql).all(...params) as ProcurementRow[]
    res.json({ success: true, data: rows.map(formatRow) })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取采购需求列表失败' })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { publisherId, title, category, craftType, quantity, unit, deliveryDate, budgetMin, budgetMax, location, description } = req.body

    if (!publisherId || !title || !category || !quantity || !deliveryDate) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const id = uuidv4()
    db.prepare(
      `INSERT INTO procurement_requests (id, publisher_id, title, category, craft_type, quantity, unit, delivery_date, budget_min, budget_max, location, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')`
    ).run(id, publisherId, title, category, JSON.stringify(craftType || []), quantity, unit || '件', deliveryDate, budgetMin ?? null, budgetMax ?? null, location || '', description || '')

    const row = db.prepare('SELECT * FROM procurement_requests WHERE id = ?').get(id) as ProcurementRow
    res.status(201).json({ success: true, data: formatRow(row) })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建采购需求失败' })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const row = db.prepare('SELECT * FROM procurement_requests WHERE id = ?').get(req.params.id) as ProcurementRow | undefined
    if (!row) {
      res.status(404).json({ success: false, error: '采购需求不存在' })
      return
    }
    res.json({ success: true, data: formatRow(row) })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取采购需求详情失败' })
  }
})

export default router
