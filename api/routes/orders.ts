import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

interface OrderRow {
  id: string
  buyer_id: string
  supplier_id: string
  title: string
  type: string
  amount: number
  deposit_amount: number
  deposit_status: string
  status: string
  logistics: string
  created_at: string
  updated_at: string
}

function formatRow(row: OrderRow) {
  return {
    id: row.id,
    buyerId: row.buyer_id,
    supplierId: row.supplier_id,
    title: row.title,
    type: row.type,
    amount: row.amount,
    depositAmount: row.deposit_amount,
    depositStatus: row.deposit_status,
    status: row.status,
    logistics: JSON.parse(row.logistics || '[]'),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

router.get('/', (req: Request, res: Response): void => {
  try {
    const { status, buyerId, supplierId, type } = req.query
    let sql = 'SELECT * FROM orders WHERE 1=1'
    const params: unknown[] = []

    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }
    if (buyerId) {
      sql += ' AND buyer_id = ?'
      params.push(buyerId)
    }
    if (supplierId) {
      sql += ' AND supplier_id = ?'
      params.push(supplierId)
    }
    if (type) {
      sql += ' AND type = ?'
      params.push(type)
    }

    sql += ' ORDER BY created_at DESC'

    const rows = db.prepare(sql).all(...params) as OrderRow[]
    res.json({ success: true, data: rows.map(formatRow) })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取订单列表失败' })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as OrderRow | undefined
    if (!row) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }
    res.json({ success: true, data: formatRow(row) })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取订单详情失败' })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { buyerId, supplierId, title, type, amount, depositAmount, depositStatus, logistics } = req.body

    if (!buyerId || !supplierId || !title || !type || amount === undefined) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const id = uuidv4()
    db.prepare(
      `INSERT INTO orders (id, buyer_id, supplier_id, title, type, amount, deposit_amount, deposit_status, status, logistics) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
    ).run(id, buyerId, supplierId, title, type, amount, depositAmount ?? 0, depositStatus ?? 'unpaid', JSON.stringify(logistics || []))

    const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow
    res.status(201).json({ success: true, data: formatRow(row) })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建订单失败' })
  }
})

router.put('/:id/status', (req: Request, res: Response): void => {
  try {
    const { status } = req.body
    const validStatuses = ['pending', 'deposit_paid', 'in_production', 'quality_check', 'shipped', 'completed', 'disputed']
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: '无效的订单状态' })
      return
    }

    const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as OrderRow | undefined
    if (!existing) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }

    db.prepare('UPDATE orders SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(status, req.params.id)

    const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as OrderRow
    res.json({ success: true, data: formatRow(row) })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新订单状态失败' })
  }
})

export default router
