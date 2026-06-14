import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 10))
  const offset = (page - 1) * pageSize

  const conditions: string[] = []
  const params: any[] = []

  if (req.query.type) {
    conditions.push('type = ?')
    params.push(req.query.type)
  }
  if (req.query.status) {
    conditions.push('status = ?')
    params.push(req.query.status)
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  const total = (db.prepare(`SELECT COUNT(*) as count FROM media_contents ${where}`).get(...params) as any).count
  const list = db.prepare(`SELECT * FROM media_contents ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset)

  res.json({ success: true, data: { list, total, page, pageSize } })
})

router.get('/:id', (req: Request, res: Response): void => {
  const media = db.prepare('SELECT * FROM media_contents WHERE id = ?').get(req.params.id) as any
  if (!media) {
    res.status(404).json({ success: false, error: 'Media not found' })
    return
  }
  res.json({ success: true, data: media })
})

router.post('/', (req: Request, res: Response): void => {
  const { user_id, title, type, url, cover_url, duration, subtitle_url } = req.body
  if (!user_id || !title || !type) {
    res.status(400).json({ success: false, error: 'user_id, title and type are required' })
    return
  }

  const result = db.prepare(
    `INSERT INTO media_contents (user_id, title, type, url, cover_url, duration, subtitle_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')`
  ).run(user_id, title, type, url || null, cover_url || null, duration || null, subtitle_url || null)

  const media = db.prepare('SELECT * FROM media_contents WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: media })
})

router.put('/:id', (req: Request, res: Response): void => {
  const existing = db.prepare('SELECT * FROM media_contents WHERE id = ?').get(req.params.id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: 'Media not found' })
    return
  }

  const { title, type, url, cover_url, duration, subtitle_url, status } = req.body
  db.prepare(
    `UPDATE media_contents SET title = COALESCE(?, title), type = COALESCE(?, type), url = COALESCE(?, url),
     cover_url = COALESCE(?, cover_url), duration = COALESCE(?, duration),
     subtitle_url = COALESCE(?, subtitle_url), status = COALESCE(?, status), updated_at = datetime('now') WHERE id = ?`
  ).run(title ?? null, type ?? null, url ?? null, cover_url ?? null, duration ?? null, subtitle_url ?? null, status ?? null, req.params.id)

  const media = db.prepare('SELECT * FROM media_contents WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: media })
})

router.post('/:id/subtitle', (req: Request, res: Response): void => {
  const existing = db.prepare('SELECT * FROM media_contents WHERE id = ?').get(req.params.id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: 'Media not found' })
    return
  }

  db.prepare("UPDATE media_contents SET ai_subtitle_status = 'processing' WHERE id = ?").run(req.params.id)
  res.json({ success: true, data: { id: Number(req.params.id), ai_subtitle_status: 'processing' } })

  setTimeout(() => {
    db.prepare("UPDATE media_contents SET ai_subtitle_status = 'done', subtitle_url = '/subtitles/auto_' || id || '.vtt' WHERE id = ?").run(req.params.id)
  }, 1000)
})

router.delete('/:id', (req: Request, res: Response): void => {
  const existing = db.prepare('SELECT * FROM media_contents WHERE id = ?').get(req.params.id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: 'Media not found' })
    return
  }

  db.prepare('DELETE FROM media_contents WHERE id = ?').run(req.params.id)
  res.json({ success: true, data: null })
})

export default router
