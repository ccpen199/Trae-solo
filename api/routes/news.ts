import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/stats/overview', (_req: Request, res: Response): void => {
  const byStatus = db.prepare("SELECT status, COUNT(*) as count FROM news GROUP BY status").all()
  const byCategory = db.prepare("SELECT category, COUNT(*) as count FROM news GROUP BY category").all()
  res.json({ success: true, data: { by_status: byStatus, by_category: byCategory } })
})

router.get('/', (req: Request, res: Response): void => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 10))
  const offset = (page - 1) * pageSize

  const conditions: string[] = []
  const params: any[] = []

  if (req.query.category) {
    conditions.push('category = ?')
    params.push(req.query.category)
  }
  if (req.query.status) {
    conditions.push('status = ?')
    params.push(req.query.status)
  }
  if (req.query.keyword) {
    conditions.push('(title LIKE ? OR content LIKE ?)')
    params.push(`%${req.query.keyword}%`, `%${req.query.keyword}%`)
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  const total = (db.prepare(`SELECT COUNT(*) as count FROM news ${where}`).get(...params) as any).count
  const list = db.prepare(`SELECT * FROM news ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset)

  res.json({ success: true, data: { list, total, page, pageSize } })
})

router.get('/:id', (req: Request, res: Response): void => {
  const news = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id) as any
  if (!news) {
    res.status(404).json({ success: false, error: 'News not found' })
    return
  }
  res.json({ success: true, data: news })
})

router.post('/', (req: Request, res: Response): void => {
  const { title, content, summary, cover_image, source, source_url, category, tags, author_id } = req.body
  if (!title || !author_id) {
    res.status(400).json({ success: false, error: 'title and author_id are required' })
    return
  }

  const result = db.prepare(
    `INSERT INTO news (title, content, summary, cover_image, source, source_url, category, tags, author_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`
  ).run(title, content || null, summary || null, cover_image || null, source || 'manual', source_url || null, category || 'general', tags || null, author_id)

  const news = db.prepare('SELECT * FROM news WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: news })
})

router.put('/:id', (req: Request, res: Response): void => {
  const existing = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: 'News not found' })
    return
  }

  const { title, content, summary, cover_image, source, source_url, category, tags } = req.body
  db.prepare(
    `UPDATE news SET title = COALESCE(?, title), content = COALESCE(?, content), summary = COALESCE(?, summary),
     cover_image = COALESCE(?, cover_image), source = COALESCE(?, source), source_url = COALESCE(?, source_url),
     category = COALESCE(?, category), tags = COALESCE(?, tags), updated_at = datetime('now') WHERE id = ?`
  ).run(title ?? null, content ?? null, summary ?? null, cover_image ?? null, source ?? null, source_url ?? null, category ?? null, tags ?? null, req.params.id)

  const news = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: news })
})

router.put('/:id/submit-review', (req: Request, res: Response): void => {
  const existing = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: 'News not found' })
    return
  }

  const submitReview = db.transaction(() => {
    db.prepare("UPDATE news SET status = 'pending', updated_at = datetime('now') WHERE id = ?").run(req.params.id)
    db.prepare(
      `INSERT INTO content_reviews (content_type, content_id, result, created_at) VALUES ('news', ?, 'pending', datetime('now'))`
    ).run(Number(req.params.id))
    db.prepare(
      `INSERT INTO news_audit_log (news_id, action, comment) VALUES (?, 'pending', '提交审核，等待处理')`
    ).run(Number(req.params.id))
  })

  submitReview()
  const news = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: news })
})

router.put('/:id/status', (req: Request, res: Response): void => {
  const { status, auditor_id, comment } = req.body
  if (!status || !auditor_id) {
    res.status(400).json({ success: false, error: 'status and auditor_id are required' })
    return
  }

  const existing = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: 'News not found' })
    return
  }

  const updateStatus = db.transaction(() => {
    const publishedAt = status === 'published' ? new Date().toISOString().replace('T', ' ').slice(0, 19) : null
    if (publishedAt) {
      db.prepare("UPDATE news SET status = ?, auditor_id = ?, published_at = ?, updated_at = datetime('now') WHERE id = ?").run(status, auditor_id, publishedAt, req.params.id)
    } else {
      db.prepare("UPDATE news SET status = ?, auditor_id = ?, updated_at = datetime('now') WHERE id = ?").run(status, auditor_id, req.params.id)
    }
    db.prepare(
      `UPDATE content_reviews SET result = ?, reviewer_id = ?, details = ? WHERE content_type = 'news' AND content_id = ? AND result = 'pending'`
    ).run(status === 'published' ? 'pass' : 'reject', auditor_id, comment || null, Number(req.params.id))
    db.prepare(
      `INSERT INTO news_audit_log (news_id, auditor_id, action, comment) VALUES (?, ?, ?, ?)`
    ).run(Number(req.params.id), auditor_id, status, comment || null)
  })

  updateStatus()
  const news = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: news })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const existing = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: 'News not found' })
    return
  }

  db.prepare('DELETE FROM news WHERE id = ?').run(req.params.id)
  res.json({ success: true, data: null })
})

export default router
