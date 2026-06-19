import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const {
    category,
    province,
    city,
    district,
    page = '1',
    limit = '20',
    status,
    is_top,
  } = req.query

  const conditions: string[] = []
  const params: unknown[] = []

  if (category) {
    conditions.push('category = ?')
    params.push(category)
  }
  if (province) {
    conditions.push('province = ?')
    params.push(province)
  }
  if (city) {
    conditions.push('city = ?')
    params.push(city)
  }
  if (district) {
    conditions.push('district = ?')
    params.push(district)
  }
  if (status) {
    conditions.push('status = ?')
    params.push(status)
  }
  if (is_top !== undefined) {
    conditions.push('is_top = ?')
    params.push(Number(is_top))
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
  const pageNum = Math.max(1, Number(page))
  const limitNum = Math.max(1, Math.min(100, Number(limit)))
  const offset = (pageNum - 1) * limitNum

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM posts ${where}`).get(...params) as { total: number }
  const rows = db.prepare(
    `SELECT * FROM posts ${where} ORDER BY is_top DESC, created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limitNum, offset) as Record<string, unknown>[]

  res.json({
    success: true,
    data: {
      items: rows,
      total: countRow.total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(countRow.total / limitNum),
    },
  })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined

  if (!post) {
    res.status(404).json({ success: false, error: 'Post not found' })
    return
  }

  const images = db.prepare('SELECT * FROM post_images WHERE post_id = ?').all(req.params.id)
  const attributes = db.prepare('SELECT * FROM post_attributes WHERE post_id = ?').all(req.params.id)

  res.json({
    success: true,
    data: { ...post, images, attributes },
  })
})

router.post('/', (req: Request, res: Response): void => {
  const db = getDb()
  const {
    category,
    title,
    description,
    price = 0,
    province,
    city,
    district,
    author_id,
    status = 'pending',
    is_top = 0,
  } = req.body

  if (!category || !title || !description || !author_id) {
    res.status(400).json({ success: false, error: 'Missing required fields: category, title, description, author_id' })
    return
  }

  const result = db.prepare(
    `INSERT INTO posts (category, title, description, price, province, city, district, author_id, status, risk_score, is_top, views, leads, conversions)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 0, 0, 0)`
  ).run(category, title, description, price, province, city, district, author_id, status, is_top)

  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: post })
})

router.put('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined

  if (!existing) {
    res.status(404).json({ success: false, error: 'Post not found' })
    return
  }

  const {
    category,
    title,
    description,
    price,
    province,
    city,
    district,
    status,
    risk_score,
    is_top,
    views,
    leads,
    conversions,
  } = req.body

  db.prepare(
    `UPDATE posts SET
      category = COALESCE(?, category),
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      price = COALESCE(?, price),
      province = COALESCE(?, province),
      city = COALESCE(?, city),
      district = COALESCE(?, district),
      status = COALESCE(?, status),
      risk_score = COALESCE(?, risk_score),
      is_top = COALESCE(?, is_top),
      views = COALESCE(?, views),
      leads = COALESCE(?, leads),
      conversions = COALESCE(?, conversions)
    WHERE id = ?`
  ).run(
    category ?? null, title ?? null, description ?? null, price ?? null,
    province ?? null, city ?? null, district ?? null, status ?? null,
    risk_score ?? null, is_top ?? null, views ?? null, leads ?? null,
    conversions ?? null, req.params.id
  )

  const updated = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: updated })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id)

  if (!existing) {
    res.status(404).json({ success: false, error: 'Post not found' })
    return
  }

  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id)
  res.json({ success: true, data: { id: Number(req.params.id) } })
})

export default router
