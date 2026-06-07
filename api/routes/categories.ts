import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'
import { adminMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { type } = req.query
  let rows: any[]
  if (type) {
    rows = db.prepare('SELECT * FROM categories WHERE type = ? ORDER BY sort_order').all(type as string)
  } else {
    rows = db.prepare('SELECT * FROM categories ORDER BY sort_order').all()
  }
  res.json({ success: true, data: rows })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id)
  if (!row) {
    res.status(404).json({ success: false, error: '分类不存在' })
    return
  }
  res.json({ success: true, data: row })
})

router.post('/', adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { name, type, icon, sort_order } = req.body
  const result = db.prepare('INSERT INTO categories (name, type, icon, sort_order) VALUES (?, ?, ?, ?)').run(name, type, icon || null, sort_order || 0)
  res.json({ success: true, data: { id: result.lastInsertRowid } })
})

router.put('/:id', adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { name, type, icon, sort_order } = req.body
  const result = db.prepare('UPDATE categories SET name = ?, type = ?, icon = ?, sort_order = ? WHERE id = ?').run(name, type, icon || null, sort_order || 0, req.params.id)
  if (result.changes === 0) {
    res.status(404).json({ success: false, error: '分类不存在' })
    return
  }
  res.json({ success: true })
})

router.delete('/:id', adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const result = db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id)
  if (result.changes === 0) {
    res.status(404).json({ success: false, error: '分类不存在' })
    return
  }
  res.json({ success: true })
})

export default router
