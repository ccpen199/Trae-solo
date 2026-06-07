import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 10))
    const offset = (page - 1) * pageSize

    let where = "WHERE p.status = 'active'"
    const params: any[] = []

    if (req.query.category_id) {
      where += ' AND p.category_id = ?'
      params.push(req.query.category_id)
    }
    if (req.query.merchant_id) {
      where += ' AND p.merchant_id = ?'
      params.push(req.query.merchant_id)
    }
    if (req.query.keyword) {
      where += ' AND p.name LIKE ?'
      params.push(`%${req.query.keyword}%`)
    }
    if (req.query.is_featured) {
      where += ' AND p.is_featured = ?'
      params.push(req.query.is_featured)
    }

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM products p ${where}`).get(...params) as { total: number }
    const rows = db.prepare(
      `SELECT p.*, m.name as merchant_name FROM products p LEFT JOIN merchants m ON p.merchant_id = m.id ${where} ORDER BY p.is_featured DESC, p.sales DESC, p.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, pageSize, offset) as any[]

    res.json({
      success: true,
      data: {
        list: rows,
        total: countRow.total,
        page,
        pageSize
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const row = db.prepare(
      `SELECT p.*, m.name as merchant_name, m.logo as merchant_logo, m.address as merchant_address FROM products p LEFT JOIN merchants m ON p.merchant_id = m.id WHERE p.id = ?`
    ).get(req.params.id) as any

    if (!row) {
      res.status(404).json({ success: false, error: '商品不存在' })
      return
    }

    if (row.images) {
      try {
        row.images = JSON.parse(row.images)
      } catch {
        row.images = []
      }
    } else {
      row.images = []
    }

    res.json({ success: true, data: row })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user
    if (user.role !== 'admin' && user.role !== 'merchant') {
      res.status(403).json({ success: false, error: '无权限操作' })
      return
    }

    const { name, description, price, original_price, cover_image, images, category_id, merchant_id, stock, traceability_info, traceability_code } = req.body

    const result = db.prepare(
      `INSERT INTO products (name, description, price, original_price, cover_image, images, category_id, merchant_id, stock, traceability_info, traceability_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(name, description, price, original_price, cover_image, images, category_id, merchant_id, stock, traceability_info, traceability_code)

    res.json({ success: true, data: { id: result.lastInsertRowid } })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id) as any

    if (!product) {
      res.status(404).json({ success: false, error: '商品不存在' })
      return
    }

    if (user.role !== 'admin' && (user.role !== 'merchant' || product.merchant_id !== (req as any).merchantId)) {
      res.status(403).json({ success: false, error: '无权限操作' })
      return
    }

    const { name, description, price, original_price, cover_image, images, category_id, merchant_id, stock, traceability_info, traceability_code, status, is_featured } = req.body

    db.prepare(
      `UPDATE products SET name = COALESCE(?, name), description = COALESCE(?, description), price = COALESCE(?, price), original_price = COALESCE(?, original_price), cover_image = COALESCE(?, cover_image), images = COALESCE(?, images), category_id = COALESCE(?, category_id), merchant_id = COALESCE(?, merchant_id), stock = COALESCE(?, stock), traceability_info = COALESCE(?, traceability_info), traceability_code = COALESCE(?, traceability_code), status = COALESCE(?, status), is_featured = COALESCE(?, is_featured), updated_at = datetime('now') WHERE id = ?`
    ).run(name, description, price, original_price, cover_image, images, category_id, merchant_id, stock, traceability_info, traceability_code, status, is_featured, req.params.id)

    res.json({ success: true, data: { id: req.params.id } })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.delete('/:id', adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id)

    if (result.changes === 0) {
      res.status(404).json({ success: false, error: '商品不存在' })
      return
    }

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

export default router
