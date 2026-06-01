import { Router } from 'express'
import db from '../db/index.js'
import { z } from 'zod'
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth.js'

const router = Router()

const supplySchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  code: z.string().optional(),
  unit: z.string().min(1, '单位不能为空'),
  quantity: z.number().default(0),
  min_quantity: z.number().default(0),
  price: z.number().min(0, '价格不能为负'),
  category: z.string().optional()
})

router.get('/', authenticateToken, (req, res) => {
  try {
    const { low_stock, category, keyword } = req.query

    let query = 'SELECT * FROM supplies WHERE 1=1'
    const params: any[] = []

    if (low_stock === 'true') {
      query += ' AND quantity <= min_quantity'
    }
    if (category) {
      query += ' AND category = ?'
      params.push(category)
    }
    if (keyword) {
      query += ' AND (name LIKE ? OR code LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    query += ' ORDER BY created_at DESC'
    const supplies = db.prepare(query).all(...params)

    res.json(supplies)
  } catch (error) {
    res.status(500).json({ error: '获取耗材列表失败' })
  }
})

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const supply = db.prepare('SELECT * FROM supplies WHERE id = ?').get(req.params.id)
    if (!supply) {
      return res.status(404).json({ error: '耗材不存在' })
    }
    res.json(supply)
  } catch (error) {
    res.status(500).json({ error: '获取耗材失败' })
  }
})

router.post('/', authenticateToken, requireRole('admin', 'finance'), (req: AuthRequest, res) => {
  try {
    const data = supplySchema.parse(req.body)

    const result = db.prepare(`
      INSERT INTO supplies (name, code, unit, quantity, min_quantity, price, category)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.name, data.code, data.unit, data.quantity, data.min_quantity, data.price, data.category
    )

    res.json({ id: result.lastInsertRowid, ...data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message })
    }
    res.status(500).json({ error: '创建耗材失败' })
  }
})

router.put('/:id', authenticateToken, requireRole('admin', 'finance'), (req, res) => {
  try {
    const data = supplySchema.parse(req.body)

    db.prepare(`
      UPDATE supplies 
      SET name=?, code=?, unit=?, quantity=?, min_quantity=?, price=?, category=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(
      data.name, data.code, data.unit, data.quantity, data.min_quantity, data.price, data.category, req.params.id
    )

    res.json({ id: req.params.id, ...data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message })
    }
    res.status(500).json({ error: '更新耗材失败' })
  }
})

router.post('/:id/stock', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { quantity, notes } = req.body
    const supplyId = Number(req.params.id)

    const supply = db.prepare('SELECT * FROM supplies WHERE id = ?').get(supplyId) as any
    if (!supply) {
      return res.status(404).json({ error: '耗材不存在' })
    }

    db.prepare(`
      UPDATE supplies SET quantity = quantity + ?, updated_at=CURRENT_TIMESTAMP WHERE id = ?
    `).run(quantity, supplyId)

    res.json({ success: true, new_quantity: supply.quantity + quantity })
  } catch (error) {
    res.status(500).json({ error: '更新库存失败' })
  }
})

router.delete('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    db.prepare('DELETE FROM supplies WHERE id = ?').run(req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: '删除耗材失败' })
  }
})

export default router
