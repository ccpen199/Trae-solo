import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 10))
    const offset = (page - 1) * pageSize

    let where = ''
    const params: any[] = []

    if (req.query.status) {
      where = 'WHERE m.status = ?'
      params.push(req.query.status)
    }

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM merchants m ${where}`).get(...params) as { total: number }
    const rows = db.prepare(
      `SELECT m.*, (SELECT COUNT(*) FROM products p WHERE p.merchant_id = m.id) as product_count FROM merchants m ${where} ORDER BY m.created_at DESC LIMIT ? OFFSET ?`
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
    const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(req.params.id) as any

    if (!merchant) {
      res.status(404).json({ success: false, error: '商户不存在' })
      return
    }

    const products = db.prepare(
      `SELECT * FROM products WHERE merchant_id = ? AND status = 'active' ORDER BY created_at DESC`
    ).all(req.params.id) as any[]

    res.json({ success: true, data: { ...merchant, products } })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user
    const { name, description, logo, cover_image, contact_phone, address, license_no, owner_name, region_code } = req.body

    const result = db.prepare(
      `INSERT INTO merchants (name, description, logo, cover_image, contact_phone, address, license_no, owner_name, status, user_id, region_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
    ).run(name, description, logo, cover_image, contact_phone, address, license_no, owner_name, user.userId, region_code)

    res.json({ success: true, data: { id: result.lastInsertRowid } })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.put('/:id/audit', adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body

    if (status !== 'approved' && status !== 'rejected') {
      res.status(400).json({ success: false, error: '审核状态无效' })
      return
    }

    const result = db.prepare('UPDATE merchants SET status = ? WHERE id = ?').run(status, req.params.id)

    if (result.changes === 0) {
      res.status(404).json({ success: false, error: '商户不存在' })
      return
    }

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user
    const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(req.params.id) as any

    if (!merchant) {
      res.status(404).json({ success: false, error: '商户不存在' })
      return
    }

    if (user.role !== 'admin' && merchant.user_id !== user.userId) {
      res.status(403).json({ success: false, error: '无权限操作' })
      return
    }

    const { name, description, logo, cover_image, contact_phone, address, region_code } = req.body

    db.prepare(
      `UPDATE merchants SET name = COALESCE(?, name), description = COALESCE(?, description), logo = COALESCE(?, logo), cover_image = COALESCE(?, cover_image), contact_phone = COALESCE(?, contact_phone), address = COALESCE(?, address), region_code = COALESCE(?, region_code) WHERE id = ?`
    ).run(name, description, logo, cover_image, contact_phone, address, region_code, req.params.id)

    res.json({ success: true, data: { id: req.params.id } })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.delete('/:id', adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = db.prepare('DELETE FROM merchants WHERE id = ?').run(req.params.id)

    if (result.changes === 0) {
      res.status(404).json({ success: false, error: '商户不存在' })
      return
    }

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

export default router
