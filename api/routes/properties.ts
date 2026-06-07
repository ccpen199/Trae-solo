import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  console.log(`[properties] GET /api/properties query:`, JSON.stringify(req.query));
  const db = getDb()
  const { type, community_id, min_price, max_price, rooms, keyword, sort_by = 'latest', page = '1', pageSize = '20' } = req.query
  const p = Number(page)
  const ps = Number(pageSize)
  const offset = (p - 1) * ps

  const joins = `
    LEFT JOIN communities c ON p.community_id = c.id
    LEFT JOIN agents a ON p.agent_id = a.id
    LEFT JOIN stores s ON a.store_id = s.id
  `
  let where = "WHERE p.status = 'active'"
  const params: any[] = []

  if (type) { where += ' AND p.type = ?'; params.push(type) }
  if (community_id) { where += ' AND p.community_id = ?'; params.push(community_id) }
  if (min_price) { where += ' AND p.price >= ?'; params.push(Number(min_price)) }
  if (max_price) { where += ' AND p.price <= ?'; params.push(Number(max_price)) }
  if (rooms) { where += ' AND p.rooms = ?'; params.push(Number(rooms)) }
  if (keyword) {
    where += ' AND (p.title LIKE ? OR p.description LIKE ? OR c.name LIKE ? OR c.district LIKE ? OR c.school_district LIKE ? OR a.name LIKE ?)'
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
  }

  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM properties p ${joins} ${where}`).get(...params) as any).cnt
  const orderBy = (() => {
    switch (String(sort_by)) {
      case 'price_asc':
        return 'p.price ASC, p.created_at DESC'
      case 'price_desc':
        return 'p.price DESC, p.created_at DESC'
      case 'area_desc':
        return 'p.area DESC, p.created_at DESC'
      default:
        return 'p.is_featured DESC, p.created_at DESC'
    }
  })()

  const rows = db.prepare(
    `SELECT p.*, c.name as community_name, c.district, c.avg_price as community_avg_price,
      a.name as agent_name, a.certified as agent_certified, a.rating as agent_rating,
      s.name as store_name
    FROM properties p
    ${joins}
    ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
  ).all(...params, ps, offset).map((row: any) => ({
    ...row,
    priceTrends: db.prepare(
      'SELECT price, trend_date FROM price_trends WHERE property_id = ? ORDER BY trend_date DESC LIMIT 12'
    ).all(row.id),
  }))

  res.json({ success: true, data: { list: rows, total, page: p, pageSize: ps } })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const property = db.prepare(
    `SELECT p.*, c.name as community_name, c.district, c.address as community_address,
      c.school_district, c.property_company, c.year_built, c.avg_price as community_avg_price,
      c.green_rate, c.total_buildings, c.total_units,
      a.name as agent_name, a.certified as agent_certified, a.rating as agent_rating, a.id as agent_id,
      s.name as store_name, s.phone as store_phone
    FROM properties p
    LEFT JOIN communities c ON p.community_id = c.id
    LEFT JOIN agents a ON p.agent_id = a.id
    LEFT JOIN stores s ON a.store_id = s.id
    WHERE p.id = ?`
  ).get(req.params.id) as Record<string, unknown> | undefined

  if (!property) {
    res.status(404).json({ success: false, error: '房源不存在' })
    return
  }

  const images = db.prepare('SELECT * FROM property_images WHERE property_id = ? ORDER BY sort_order').all(req.params.id)
  const priceTrends = db.prepare('SELECT * FROM price_trends WHERE property_id = ? ORDER BY trend_date').all(req.params.id)
  const viewings = db.prepare(
    `SELECT v.*, a.name as agent_name FROM viewings v LEFT JOIN agents a ON v.agent_id = a.id WHERE v.property_id = ? ORDER BY v.viewed_at DESC LIMIT 10`
  ).all(req.params.id)

  res.json({ success: true, data: { ...property, images, priceTrends, viewings } })
})

router.post('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { community_id, title, type, price, area, rooms, halls, bathrooms, floor, total_floors, orientation, decoration, description, owner_id, agent_id } = req.body
  const r = db.prepare(
    `INSERT INTO properties (community_id, title, type, price, area, rooms, halls, bathrooms, floor, total_floors, orientation, decoration, description, owner_id, agent_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(community_id, title, type, price, area, rooms, halls, bathrooms, floor, total_floors, orientation, decoration, description, owner_id, agent_id)
  res.json({ success: true, data: { id: r.lastInsertRowid } })
})

router.put('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const fields = Object.keys(req.body).filter(k => ['title', 'price', 'area', 'rooms', 'halls', 'bathrooms', 'floor', 'total_floors', 'orientation', 'decoration', 'description', 'status', 'is_featured'].includes(k))
  if (fields.length === 0) {
    res.json({ success: true })
    return
  }
  const sets = fields.map(f => `${f} = ?`).join(', ')
  const vals = fields.map(f => req.body[f])
  vals.push(req.params.id)
  db.prepare(`UPDATE properties SET ${sets}, updated_at = datetime('now','localtime') WHERE id = ?`).run(...vals)
  res.json({ success: true })
})

export default router
