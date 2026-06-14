import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 10))
  const offset = (page - 1) * pageSize

  const conditions: string[] = []
  const params: any[] = []

  if (req.query.content_type) {
    conditions.push('content_type = ?')
    params.push(req.query.content_type)
  }
  if (req.query.result) {
    conditions.push('result = ?')
    params.push(req.query.result)
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  const total = (db.prepare(`SELECT COUNT(*) as count FROM content_reviews ${where}`).get(...params) as any).count
  const list = db.prepare(`SELECT * FROM content_reviews ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset)

  res.json({ success: true, data: { list, total, page, pageSize } })
})

router.post('/', (req: Request, res: Response): void => {
  const { content_type, content_id, reviewer_id } = req.body
  if (!content_type || !content_id || !reviewer_id) {
    res.status(400).json({ success: false, error: 'content_type, content_id and reviewer_id are required' })
    return
  }

  const result = db.prepare(
    `INSERT INTO content_reviews (content_type, content_id, reviewer_id, result) VALUES (?, ?, ?, 'pending')`
  ).run(content_type, content_id, reviewer_id)

  const review = db.prepare('SELECT * FROM content_reviews WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: review })
})

router.put('/:id', (req: Request, res: Response): void => {
  const { result, risk_type, details } = req.body
  if (!result) {
    res.status(400).json({ success: false, error: 'result is required' })
    return
  }

  const existing = db.prepare('SELECT * FROM content_reviews WHERE id = ?').get(req.params.id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: 'Review not found' })
    return
  }

  db.prepare('UPDATE content_reviews SET result = ?, risk_type = ?, details = ? WHERE id = ?').run(
    result, risk_type || null, details || null, req.params.id
  )
  const review = db.prepare('SELECT * FROM content_reviews WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: review })
})

export default router
