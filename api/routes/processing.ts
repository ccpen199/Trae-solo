import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

interface ProcessingRow {
  id: string
  publisher_id: string
  title: string
  craft_type: string
  quantity: number
  deadline: string
  factory_type: string
  location: string
  budget_min: number | null
  budget_max: number | null
  status: string
  created_at: string
}

function formatRow(row: ProcessingRow) {
  return {
    id: row.id,
    publisherId: row.publisher_id,
    title: row.title,
    craftType: JSON.parse(row.craft_type || '[]'),
    quantity: row.quantity,
    deadline: row.deadline,
    factoryType: row.factory_type,
    location: row.location,
    budget: { min: row.budget_min, max: row.budget_max },
    status: row.status,
    createdAt: row.created_at,
  }
}

router.get('/', (req: Request, res: Response): void => {
  try {
    const { craftType, location, status, factoryType } = req.query
    let sql = 'SELECT * FROM processing_orders WHERE 1=1'
    const params: unknown[] = []

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
    if (factoryType) {
      sql += ' AND factory_type LIKE ?'
      params.push(`%${factoryType}%`)
    }

    sql += ' ORDER BY created_at DESC'

    const rows = db.prepare(sql).all(...params) as ProcessingRow[]
    res.json({ success: true, data: rows.map(formatRow) })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取加工订单列表失败' })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { publisherId, title, craftType, quantity, deadline, factoryType, location, budgetMin, budgetMax } = req.body

    if (!publisherId || !title || !quantity || !deadline) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const id = uuidv4()
    db.prepare(
      `INSERT INTO processing_orders (id, publisher_id, title, craft_type, quantity, deadline, factory_type, location, budget_min, budget_max, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')`
    ).run(id, publisherId, title, JSON.stringify(craftType || []), quantity, deadline, factoryType || '', location || '', budgetMin ?? null, budgetMax ?? null)

    const row = db.prepare('SELECT * FROM processing_orders WHERE id = ?').get(id) as ProcessingRow
    res.status(201).json({ success: true, data: formatRow(row) })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建加工订单失败' })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const row = db.prepare('SELECT * FROM processing_orders WHERE id = ?').get(req.params.id) as ProcessingRow | undefined
    if (!row) {
      res.status(404).json({ success: false, error: '加工订单不存在' })
      return
    }
    res.json({ success: true, data: formatRow(row) })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取加工订单详情失败' })
  }
})

export default router
