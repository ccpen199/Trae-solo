import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

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
  if (req.query.keyword) {
    conditions.push('(name LIKE ? OR address LIKE ?)')
    params.push(`%${req.query.keyword}%`, `%${req.query.keyword}%`)
  }
  if (req.query.verified !== undefined) {
    const v = req.query.verified === '1' || req.query.verified === 'true' ? 1 : 0
    conditions.push('business_verified = ?')
    params.push(v)
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  const total = (db.prepare(`SELECT COUNT(*) as count FROM pois ${where}`).get(...params) as any).count
  const list = db.prepare(`SELECT * FROM pois ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset)

  res.json({ success: true, data: { list, total, page, pageSize } })
})

router.get('/:id', (req: Request, res: Response): void => {
  const poi = db.prepare('SELECT * FROM pois WHERE id = ?').get(req.params.id) as any
  if (!poi) {
    res.status(404).json({ success: false, error: 'POI not found' })
    return
  }

  const reviews = db.prepare('SELECT * FROM poi_reviews WHERE poi_id = ? ORDER BY created_at DESC').all(req.params.id)
  res.json({ success: true, data: { ...poi, reviews } })
})

router.post('/', (req: Request, res: Response): void => {
  const { name, category, address, lng, lat, phone, license_number } = req.body
  if (!name) {
    res.status(400).json({ success: false, error: 'name is required' })
    return
  }

  const result = db.prepare(
    `INSERT INTO pois (name, category, address, lng, lat, phone, license_number) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(name, category || null, address || null, lng || null, lat || null, phone || null, license_number || null)

  const poi = db.prepare('SELECT * FROM pois WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: poi })
})

router.put('/:id', (req: Request, res: Response): void => {
  const existing = db.prepare('SELECT * FROM pois WHERE id = ?').get(req.params.id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: 'POI not found' })
    return
  }

  const { name, category, address, lng, lat, phone, license_number } = req.body
  db.prepare(
    `UPDATE pois SET name = COALESCE(?, name), category = COALESCE(?, category), address = COALESCE(?, address),
     lng = COALESCE(?, lng), lat = COALESCE(?, lat), phone = COALESCE(?, phone),
     license_number = COALESCE(?, license_number), updated_at = datetime('now') WHERE id = ?`
  ).run(name ?? null, category ?? null, address ?? null, lng ?? null, lat ?? null, phone ?? null, license_number ?? null, req.params.id)

  const poi = db.prepare('SELECT * FROM pois WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: poi })
})

router.put('/:id/verify', (req: Request, res: Response): void => {
  const existing = db.prepare('SELECT * FROM pois WHERE id = ?').get(req.params.id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: 'POI not found' })
    return
  }

  db.prepare("UPDATE pois SET business_verified = 1, updated_at = datetime('now') WHERE id = ?").run(req.params.id)
  const poi = db.prepare('SELECT * FROM pois WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: poi })
})

router.post('/:id/reviews', (req: Request, res: Response): void => {
  const { user_id, rating, content, images } = req.body
  if (!user_id || !rating || !content) {
    res.status(400).json({ success: false, error: 'user_id, rating and content are required' })
    return
  }

  const poi = db.prepare('SELECT * FROM pois WHERE id = ?').get(req.params.id) as any
  if (!poi) {
    res.status(404).json({ success: false, error: 'POI not found' })
    return
  }

  const result = db.prepare(
    `INSERT INTO poi_reviews (poi_id, user_id, rating, content, images) VALUES (?, ?, ?, ?, ?)`
  ).run(Number(req.params.id), user_id, rating, content, images || null)

  const newAvg = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as cnt FROM poi_reviews WHERE poi_id = ?').get(req.params.id) as any
  if (newAvg) {
    db.prepare('UPDATE pois SET rating = ?, review_count = ?, updated_at = datetime(\'now\') WHERE id = ?').run(
      Math.round(newAvg.avg * 10) / 10, newAvg.cnt, req.params.id
    )
  }

  const review = db.prepare('SELECT * FROM poi_reviews WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: review })
})

router.put('/:id/reviews/:reviewId/fraud', (req: Request, res: Response): void => {
  const { is_fraud, fraud_reason } = req.body

  const review = db.prepare('SELECT * FROM poi_reviews WHERE id = ? AND poi_id = ?').get(req.params.reviewId, req.params.id) as any
  if (!review) {
    res.status(404).json({ success: false, error: 'Review not found' })
    return
  }

  db.prepare('UPDATE poi_reviews SET is_fraud = ?, fraud_reason = ? WHERE id = ?').run(
    is_fraud !== false ? 1 : 0, fraud_reason || null, req.params.reviewId
  )
  const updated = db.prepare('SELECT * FROM poi_reviews WHERE id = ?').get(req.params.reviewId)
  res.json({ success: true, data: updated })
})

export default router
