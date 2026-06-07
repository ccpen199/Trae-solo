import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'
import { adminMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { status } = req.query
  let rows: any[]
  if (status) {
    rows = db.prepare('SELECT * FROM live_streams WHERE status = ? ORDER BY created_at DESC').all(status as string)
  } else {
    rows = db.prepare('SELECT * FROM live_streams ORDER BY created_at DESC').all()
  }
  res.json({ success: true, data: rows })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const row = db.prepare('SELECT * FROM live_streams WHERE id = ?').get(req.params.id)
  if (!row) {
    res.status(404).json({ success: false, error: '直播间不存在' })
    return
  }
  res.json({ success: true, data: row })
})

router.post('/', adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { title, stream_url, cover_image, description, status } = req.body
  const result = db.prepare('INSERT INTO live_streams (title, stream_url, cover_image, description, status) VALUES (?, ?, ?, ?, ?)').run(title, stream_url || null, cover_image || null, description || null, status || 'live')
  res.json({ success: true, data: { id: result.lastInsertRowid } })
})

router.put('/:id', adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { title, stream_url, cover_image, description, status } = req.body
  const result = db.prepare('UPDATE live_streams SET title = ?, stream_url = ?, cover_image = ?, description = ?, status = ? WHERE id = ?').run(title, stream_url || null, cover_image || null, description || null, status, req.params.id)
  if (result.changes === 0) {
    res.status(404).json({ success: false, error: '直播间不存在' })
    return
  }
  res.json({ success: true })
})

router.delete('/:id', adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const result = db.prepare('DELETE FROM live_streams WHERE id = ?').run(req.params.id)
  if (result.changes === 0) {
    res.status(404).json({ success: false, error: '直播间不存在' })
    return
  }
  res.json({ success: true })
})

export default router
