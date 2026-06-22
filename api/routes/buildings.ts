import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { district, status, keyword, layout, areaMin, areaMax, priceMin, priceMax } = req.query

  let sql = 'SELECT DISTINCT b.* FROM buildings b'
  const params: unknown[] = []
  const conditions: string[] = []

  const needsPropertyJoin = layout || areaMin || areaMax
  if (needsPropertyJoin) {
    sql += ' LEFT JOIN properties p ON b.id = p.buildingId'
  }

  if (district && typeof district === 'string') {
    conditions.push('b.district = ?')
    params.push(district)
  }

  if (status && typeof status === 'string') {
    conditions.push('b.status = ?')
    params.push(status)
  }

  if (keyword && typeof keyword === 'string') {
    conditions.push('(b.name LIKE ? OR b.district LIKE ? OR b.developer LIKE ? OR b.address LIKE ?)')
    const like = `%${keyword}%`
    params.push(like, like, like, like)
  }

  if (layout && typeof layout === 'string') {
    conditions.push('p.layout LIKE ?')
    params.push(`%${layout}%`)
  }

  if (areaMin && typeof areaMin === 'string') {
    conditions.push('p.area >= ?')
    params.push(Number(areaMin))
  }

  if (areaMax && typeof areaMax === 'string') {
    conditions.push('p.area <= ?')
    params.push(Number(areaMax))
  }

  if (priceMin && typeof priceMin === 'string') {
    conditions.push('b.avgPrice >= ?')
    params.push(Number(priceMin))
  }

  if (priceMax && typeof priceMax === 'string') {
    conditions.push('b.avgPrice <= ?')
    params.push(Number(priceMax))
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ')
  }

  sql += ' ORDER BY b.createdAt DESC'

  const buildings = db.prepare(sql).all(...params) as Record<string, unknown>[]

  const result = buildings.map(b => ({
    ...b,
    tags: JSON.parse(b.tags as string || '[]'),
    images: JSON.parse(b.images as string || '[]')
  }))

  res.json({ success: true, data: result })
})

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params

  const building = db.prepare('SELECT * FROM buildings WHERE id = ?').get(id) as Record<string, unknown> | undefined

  if (!building) {
    res.status(404).json({ success: false, error: '楼盘不存在' })
    return
  }

  const certificates = db.prepare('SELECT * FROM certificates WHERE buildingId = ?').all(id)
  const priceHistory = db.prepare('SELECT month, avgPrice, volume FROM price_history WHERE buildingId = ? ORDER BY month').all(id)

  const result = {
    ...building,
    tags: JSON.parse(building.tags as string || '[]'),
    images: JSON.parse(building.images as string || '[]'),
    certificates,
    priceHistory
  }

  res.json({ success: true, data: result })
})

router.get('/:id/price-history', (req: Request, res: Response): void => {
  const { id } = req.params

  const building = db.prepare('SELECT id FROM buildings WHERE id = ?').get(id)
  if (!building) {
    res.status(404).json({ success: false, error: '楼盘不存在' })
    return
  }

  const priceHistory = db.prepare('SELECT month, avgPrice, volume FROM price_history WHERE buildingId = ? ORDER BY month').all(id)

  res.json({ success: true, data: priceHistory })
})

router.get('/:id/certificates', (req: Request, res: Response): void => {
  const { id } = req.params

  const building = db.prepare('SELECT id FROM buildings WHERE id = ?').get(id)
  if (!building) {
    res.status(404).json({ success: false, error: '楼盘不存在' })
    return
  }

  const certificates = db.prepare('SELECT * FROM certificates WHERE buildingId = ? ORDER BY CASE type WHEN "建设用地规划许可证" THEN 1 WHEN "建设工程规划许可证" THEN 2 WHEN "建筑工程施工许可证" THEN 3 WHEN "商品房预售许可证" THEN 4 WHEN "不动产权证书" THEN 5 END').all(id)

  res.json({ success: true, data: certificates })
})

router.get('/:id/properties', (req: Request, res: Response): void => {
  const { id } = req.params

  const building = db.prepare('SELECT id FROM buildings WHERE id = ?').get(id)
  if (!building) {
    res.status(404).json({ success: false, error: '楼盘不存在' })
    return
  }

  const { floor, layout, status: propStatus, minPrice, maxPrice } = req.query

  let sql = 'SELECT * FROM properties WHERE buildingId = ?'
  const params: unknown[] = [id]

  if (floor && typeof floor === 'string') {
    sql += ' AND floor = ?'
    params.push(Number(floor))
  }

  if (layout && typeof layout === 'string') {
    sql += ' AND layout = ?'
    params.push(layout)
  }

  if (propStatus && typeof propStatus === 'string') {
    sql += ' AND status = ?'
    params.push(propStatus)
  }

  if (minPrice && typeof minPrice === 'string') {
    sql += ' AND price >= ?'
    params.push(Number(minPrice))
  }

  if (maxPrice && typeof maxPrice === 'string') {
    sql += ' AND price <= ?'
    params.push(Number(maxPrice))
  }

  sql += ' ORDER BY floor, unitNumber'

  const properties = db.prepare(sql).all(...params)

  res.json({ success: true, data: properties })
})

export default router
