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
    conditions.push('p.category = ?')
    params.push(category)
  }
  if (province) {
    conditions.push('p.province = ?')
    params.push(province)
  }
  if (city) {
    conditions.push('p.city = ?')
    params.push(city)
  }
  if (district) {
    conditions.push('p.district = ?')
    params.push(district)
  }
  if (status) {
    conditions.push('p.status = ?')
    params.push(status)
  } else {
    conditions.push('p.status = ?')
    params.push('approved')
  }
  if (is_top !== undefined) {
    conditions.push('p.is_top = ?')
    params.push(Number(is_top))
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
  const pageNum = Math.max(1, Number(page))
  const limitNum = Math.max(1, Math.min(100, Number(limit)))
  const offset = (pageNum - 1) * limitNum

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM posts p ${where}`).get(...params) as { total: number }
  const rows = db.prepare(
    `SELECT p.*, u.name as author_name, u.role as author_type, u.phone as author_phone,
            m.name as merchant_name, m.license_no as merchant_license_no,
            m.license_verified as merchant_verified, m.rating as merchant_rating, m.review_count as merchant_review_count,
            m.deposit_amount as merchant_deposit_amount, m.deposit_status as merchant_deposit_status
     FROM posts p
     LEFT JOIN users u ON p.author_id = u.id
     LEFT JOIN merchants m ON u.id = m.user_id
     ${where}
     ORDER BY p.is_top DESC, p.created_at DESC
     LIMIT ? OFFSET ?`
  ).all(...params, limitNum, offset) as Record<string, unknown>[]

  const postIds = rows.map(r => r.id)
  const imagesByPost = new Map<string, Record<string, unknown>[]>()
  const attrsByPost = new Map<string, Record<string, unknown>[]>()
  if (postIds.length > 0) {
    const placeholders = postIds.map(() => '?').join(',')
    const allImages = db.prepare(`SELECT * FROM post_images WHERE post_id IN (${placeholders})`).all(...postIds) as Record<string, unknown>[]
    const allAttrs = db.prepare(`SELECT * FROM post_attributes WHERE post_id IN (${placeholders})`).all(...postIds) as Record<string, unknown>[]
    for (const img of allImages) {
      const pid = String(img.post_id)
      if (!imagesByPost.has(pid)) imagesByPost.set(pid, [])
      imagesByPost.get(pid)!.push(img)
    }
    for (const attr of allAttrs) {
      const pid = String(attr.post_id)
      if (!attrsByPost.has(pid)) attrsByPost.set(pid, [])
      attrsByPost.get(pid)!.push(attr)
    }
  }

  const posts = rows.map(r => {
    const id = String(r.id)
    return {
      id,
      category: r.category,
      title: r.title,
      description: r.description,
      price: r.price,
      province: r.province,
      city: r.city,
      district: r.district,
      authorId: String(r.author_id),
      authorName: r.author_name,
      authorType: r.author_type === 'merchant' ? 'merchant' : 'user',
      authorPhone: r.author_phone,
      merchantName: r.merchant_name,
      merchantLicenseNo: r.merchant_license_no,
      merchantVerified: Number(r.merchant_verified) === 1,
      merchantRating: r.merchant_rating ? Number(r.merchant_rating) : undefined,
      merchantReviewCount: r.merchant_review_count ? Number(r.merchant_review_count) : undefined,
      merchantDepositAmount: r.merchant_deposit_amount ? Number(r.merchant_deposit_amount) : undefined,
      merchantDepositStatus: r.merchant_deposit_status as ('paid' | 'pending' | 'refunded' | 'none') | undefined,
      status: r.status,
      riskScore: Number(r.risk_score),
      isTop: Number(r.is_top) === 1,
      views: Number(r.views),
      leads: Number(r.leads),
      conversions: Number(r.conversions),
      images: imagesByPost.get(id)?.map(img => ({
        id: String(img.id),
        postId: String(img.post_id),
        url: img.url,
        ocrText: img.ocr_text,
        isPrimary: Number(img.is_primary) === 1,
      })),
      attributes: attrsByPost.get(id)?.map(a => ({
        id: String(a.id),
        postId: String(a.post_id),
        key: a.key,
        value: a.value,
      })),
      createdAt: r.created_at,
    }
  })

  res.json({
    success: true,
    data: {
      posts,
      total: countRow.total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(countRow.total / limitNum),
    },
  })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const post = db.prepare(
    `SELECT p.*, u.name as author_name, u.role as author_type, u.phone as author_phone,
            m.name as merchant_name, m.license_no as merchant_license_no,
            m.license_verified as merchant_verified, m.rating as merchant_rating, m.review_count as merchant_review_count,
            m.deposit_amount as merchant_deposit_amount, m.deposit_status as merchant_deposit_status
     FROM posts p
     LEFT JOIN users u ON p.author_id = u.id
     LEFT JOIN merchants m ON u.id = m.user_id
     WHERE p.id = ?`
  ).get(req.params.id) as Record<string, unknown> | undefined

  if (!post) {
    res.status(404).json({ success: false, error: 'Post not found' })
    return
  }

  const images = db.prepare('SELECT * FROM post_images WHERE post_id = ?').all(req.params.id) as Record<string, unknown>[]
  const attributes = db.prepare('SELECT * FROM post_attributes WHERE post_id = ?').all(req.params.id) as Record<string, unknown>[]

  res.json({
    success: true,
    data: {
      id: String(post.id),
      category: post.category,
      title: post.title,
      description: post.description,
      price: post.price,
      province: post.province,
      city: post.city,
      district: post.district,
      authorId: String(post.author_id),
      authorName: post.author_name,
      authorType: post.author_type === 'merchant' ? 'merchant' : 'user',
      authorPhone: post.author_phone,
      merchantName: post.merchant_name,
      merchantLicenseNo: post.merchant_license_no,
      merchantVerified: Number(post.merchant_verified) === 1,
      merchantRating: post.merchant_rating ? Number(post.merchant_rating) : undefined,
      merchantReviewCount: post.merchant_review_count ? Number(post.merchant_review_count) : undefined,
      merchantDepositAmount: post.merchant_deposit_amount ? Number(post.merchant_deposit_amount) : undefined,
      merchantDepositStatus: post.merchant_deposit_status as ('paid' | 'pending' | 'refunded' | 'none') | undefined,
      status: post.status,
      riskScore: Number(post.risk_score),
      isTop: Number(post.is_top) === 1,
      views: Number(post.views),
      leads: Number(post.leads),
      conversions: Number(post.conversions),
      images: images.map(img => ({
        id: String(img.id),
        postId: String(img.post_id),
        url: img.url,
        ocrText: img.ocr_text,
        isPrimary: Number(img.is_primary) === 1,
      })),
      attributes: attributes.map(a => ({
        id: String(a.id),
        postId: String(a.post_id),
        key: a.key,
        value: a.value,
      })),
      createdAt: post.created_at,
    },
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
