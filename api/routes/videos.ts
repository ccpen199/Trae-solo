import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'
import { adminMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const page = Number(req.query.page) || 1
  const pageSize = Number(req.query.pageSize) || 10
  const { category_id } = req.query
  const offset = (page - 1) * pageSize

  let countSql = 'SELECT COUNT(*) as total FROM videos WHERE is_published = 1'
  let dataSql = 'SELECT * FROM videos WHERE is_published = 1'
  const params: any[] = []
  const countParams: any[] = []

  if (category_id) {
    countSql += ' AND category_id = ?'
    dataSql += ' AND category_id = ?'
    params.push(category_id)
    countParams.push(category_id)
  }

  dataSql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(pageSize, offset)

  const { total } = db.prepare(countSql).get(...countParams) as { total: number }
  const rows = db.prepare(dataSql).all(...params)

  res.json({ success: true, data: { list: rows, total, page, pageSize } })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  db.prepare('UPDATE videos SET view_count = view_count + 1 WHERE id = ?').run(req.params.id)
  const row = db.prepare('SELECT * FROM videos WHERE id = ?').get(req.params.id)
  if (!row) {
    res.status(404).json({ success: false, error: '视频不存在' })
    return
  }
  res.json({ success: true, data: row })
})

router.post('/', adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { title, url, cover_image, duration, category_id, description, author } = req.body
  const result = db.prepare('INSERT INTO videos (title, url, cover_image, duration, category_id, description, author) VALUES (?, ?, ?, ?, ?, ?, ?)').run(title, url || null, cover_image || null, duration || 0, category_id || null, description || null, author || null)
  res.json({ success: true, data: { id: result.lastInsertRowid } })
})

router.put('/:id', adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { title, url, cover_image, duration, category_id, description, author } = req.body
  const result = db.prepare('UPDATE videos SET title = ?, url = ?, cover_image = ?, duration = ?, category_id = ?, description = ?, author = ? WHERE id = ?').run(title, url || null, cover_image || null, duration || 0, category_id || null, description || null, author || null, req.params.id)
  if (result.changes === 0) {
    res.status(404).json({ success: false, error: '视频不存在' })
    return
  }
  res.json({ success: true })
})

router.delete('/:id', adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const result = db.prepare('DELETE FROM videos WHERE id = ?').run(req.params.id)
  if (result.changes === 0) {
    res.status(404).json({ success: false, error: '视频不存在' })
    return
  }
  res.json({ success: true })
})

export default router
