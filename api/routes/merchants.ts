import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../database.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 10))
  const street = req.query.street as string
  const category = req.query.category as string
  const sortBy = req.query.sortBy as string
  const keyword = req.query.keyword as string
  const lng = parseFloat(req.query.lng as string)
  const lat = parseFloat(req.query.lat as string)

  const status = req.query.status as string
  let where = 'WHERE 1=1'
  const params: unknown[] = []

  if (status) {
    where += ' AND status = ?'
    params.push(status)
  }

  if (street) {
    where += ' AND street = ?'
    params.push(street)
  }
  if (category) {
    const catMap: Record<string, string> = { '餐饮': 'food', '娱乐': 'entertainment', '休闲': 'leisure', '商超': 'shopping', food: 'food', entertainment: 'entertainment', leisure: 'leisure', shopping: 'shopping' }
    const catVal = catMap[category] || category
    where += ' AND category = ?'
    params.push(catVal)
  }
  if (keyword) {
    where += ' AND (name LIKE ? OR description LIKE ?)'
    params.push(`%${keyword}%`, `%${keyword}%`)
  }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM merchants ${where}`).get(...params) as { count: number }).count

  let orderBy = 'ORDER BY created_at DESC'
  if (sortBy === 'popularity') orderBy = 'ORDER BY popularity DESC'
  else if (sortBy === 'rating') orderBy = 'ORDER BY rating DESC'
  else if (sortBy === 'distance' && !isNaN(lng) && !isNaN(lat)) {
    orderBy = `ORDER BY ((lng - ${lng}) * (lng - ${lng}) + (lat - ${lat}) * (lat - ${lat})) ASC`
  }

  const offset = (page - 1) * pageSize
  const items = db.prepare(`SELECT * FROM merchants ${where} ${orderBy} LIMIT ? OFFSET ?`).all(...params, pageSize, offset) as Array<Record<string, unknown>>

  if (!isNaN(lng) && !isNaN(lat)) {
    for (const item of items) {
      const dlng = (item.lng as number) - lng
      const dlat = (item.lat as number) - lat
      item.distance = Math.sqrt(dlng * dlng + dlat * dlat) * 111
    }
  }

  const enrichedItems = items.map(m => {
    const tags = db.prepare('SELECT tag FROM merchant_tags WHERE merchant_id = ?').all(m.id) as Array<{ tag: string }>
    const hours = db.prepare('SELECT day_of_week, open_time, close_time FROM business_hours WHERE merchant_id = ? ORDER BY day_of_week').all(m.id)
    return { ...m, tags: tags.map(t => t.tag), business_hours: hours }
  })

  res.json({
    code: 200,
    message: 'ok',
    data: { items: enrichedItems, total, page, pageSize },
  })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined

  if (!merchant) {
    res.status(404).json({ code: 404, message: '商户不存在', data: null })
    return
  }

  const tags = db.prepare('SELECT tag FROM merchant_tags WHERE merchant_id = ?').all(merchant.id) as Array<{ tag: string }>
  const hours = db.prepare('SELECT day_of_week, open_time, close_time FROM business_hours WHERE merchant_id = ? ORDER BY day_of_week').all(merchant.id)
  const packages = db.prepare('SELECT * FROM packages WHERE merchant_id = ? AND status = ?').all(merchant.id, 'active')

  res.json({
    code: 200,
    message: 'ok',
    data: { ...merchant, tags: tags.map(t => t.tag), business_hours: hours, packages },
  })
})

router.post('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { name, category, street, address, lng, lat, phone, description, cover_image, business_hours, tags } = req.body

  if (!name || !category || !street || !address || isNaN(lng) || isNaN(lat)) {
    res.status(400).json({ code: 400, message: '缺少必要字段', data: null })
    return
  }

  const id = uuidv4()
  db.prepare(`
    INSERT INTO merchants (id, name, category, street, address, lng, lat, phone, description, cover_image, rating, popularity, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'pending')
  `).run(id, name, category, street, address, lng, lat, phone || '', description || '', cover_image || '')

  if (business_hours) {
    try {
      const hours = typeof business_hours === 'string' ? JSON.parse(business_hours) : business_hours
      const insertHour = db.prepare('INSERT INTO business_hours (merchant_id, day_of_week, open_time, close_time) VALUES (?, ?, ?, ?)')
      for (const h of hours) {
        if (!h.closed && h.open_time && h.close_time) {
          insertHour.run(id, h.day_of_week, h.open_time, h.close_time)
        }
      }
    } catch {}
  }

  if (tags) {
    try {
      const tagList = typeof tags === 'string' ? JSON.parse(tags) : tags
      const insertTag = db.prepare('INSERT INTO merchant_tags (merchant_id, tag) VALUES (?, ?)')
      for (const tag of tagList) {
        if (tag && typeof tag === 'string') insertTag.run(id, tag)
      }
    } catch {}
  }

  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(id)
  res.status(201).json({ code: 201, message: '入驻申请已提交，等待审核', data: merchant })
})

router.post('/apply', (req: Request, res: Response): void => {
  const db = getDb()
  const { name, category, street, address, lng, lat, phone, description, business_hours, tags } = req.body

  if (!name || !category || !street || !address) {
    res.status(400).json({ code: 400, message: '缺少必要字段：名称、分类、街道、地址', data: null })
    return
  }

  const parsedLng = parseFloat(lng) || 121.22
  const parsedLat = parseFloat(lat) || 31.03

  const id = uuidv4()
  db.prepare(`
    INSERT INTO merchants (id, name, category, street, address, lng, lat, phone, description, cover_image, rating, popularity, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '', 0, 0, 'pending')
  `).run(id, name, category, street, address, parsedLng, parsedLat, phone || '', description || '')

  if (business_hours) {
    try {
      const hours = typeof business_hours === 'string' ? JSON.parse(business_hours) : business_hours
      const insertHour = db.prepare('INSERT INTO business_hours (merchant_id, day_of_week, open_time, close_time) VALUES (?, ?, ?, ?)')
      for (const h of hours) {
        if (!h.closed && h.open_time && h.close_time) {
          insertHour.run(id, h.day_of_week, h.open_time, h.close_time)
        }
      }
    } catch {}
  }

  if (tags) {
    try {
      const tagList = typeof tags === 'string' ? JSON.parse(tags) : tags
      const insertTag = db.prepare('INSERT INTO merchant_tags (merchant_id, tag) VALUES (?, ?)')
      for (const tag of tagList) {
        if (tag && typeof tag === 'string') insertTag.run(id, tag)
      }
    } catch {}
  }

  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(id)
  const mTags = db.prepare('SELECT tag FROM merchant_tags WHERE merchant_id = ?').all(id) as Array<{ tag: string }>
  const mHours = db.prepare('SELECT day_of_week, open_time, close_time FROM business_hours WHERE merchant_id = ? ORDER BY day_of_week').all(id)

  res.status(201).json({
    code: 201,
    message: '入驻申请已提交，等待审核',
    data: { ...(merchant as Record<string, unknown>), tags: mTags.map(t => t.tag), business_hours: mHours },
  })
})

router.put('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(req.params.id)
  if (!merchant) {
    res.status(404).json({ code: 404, message: '商户不存在', data: null })
    return
  }

  const { name, category, street, address, lng, lat, phone, description, cover_image, rating, popularity } = req.body
  db.prepare(`
    UPDATE merchants SET name = COALESCE(?, name), category = COALESCE(?, category), street = COALESCE(?, street),
    address = COALESCE(?, address), lng = COALESCE(?, lng), lat = COALESCE(?, lat), phone = COALESCE(?, phone),
    description = COALESCE(?, description), cover_image = COALESCE(?, cover_image), rating = COALESCE(?, rating),
    popularity = COALESCE(?, popularity) WHERE id = ?
  `).run(name, category, street, address, lng, lat, phone, description, cover_image, rating, popularity, req.params.id)

  const updated = db.prepare('SELECT * FROM merchants WHERE id = ?').get(req.params.id)
  res.json({ code: 200, message: 'ok', data: updated })
})

router.put('/:id/audit', (req: Request, res: Response): void => {
  const db = getDb()
  const { status } = req.body
  if (!['approved', 'rejected'].includes(status)) {
    res.status(400).json({ code: 400, message: '无效的审核状态', data: null })
    return
  }

  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(req.params.id)
  if (!merchant) {
    res.status(404).json({ code: 404, message: '商户不存在', data: null })
    return
  }

  db.prepare('UPDATE merchants SET status = ? WHERE id = ?').run(status, req.params.id)
  const updated = db.prepare('SELECT * FROM merchants WHERE id = ?').get(req.params.id)
  res.json({ code: 200, message: status === 'approved' ? '审核通过' : '审核拒绝', data: updated })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(req.params.id)
  if (!merchant) {
    res.status(404).json({ code: 404, message: '商户不存在', data: null })
    return
  }

  db.prepare('DELETE FROM merchant_tags WHERE merchant_id = ?').run(req.params.id)
  db.prepare('DELETE FROM business_hours WHERE merchant_id = ?').run(req.params.id)
  db.prepare('DELETE FROM merchants WHERE id = ?').run(req.params.id)
  res.json({ code: 200, message: 'ok', data: null })
})

export default router
