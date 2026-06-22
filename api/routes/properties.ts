import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.get('/map', (req: Request, res: Response): void => {
  const { district, minPrice, maxPrice, priceMin, priceMax, layout, areaMin, areaMax } = req.query

  let sql = `SELECT p.*, b.name as buildingName, b.lat, b.lng, b.district, b.address, b.status as buildingStatus
    FROM properties p
    JOIN buildings b ON p.buildingId = b.id
    WHERE p.status = 'available'`
  const params: unknown[] = []

  if (district && typeof district === 'string') {
    sql += ' AND b.district = ?'
    params.push(district)
  }

  const effectiveMinPrice = minPrice ?? priceMin
  if (effectiveMinPrice && typeof effectiveMinPrice === 'string') {
    sql += ' AND p.price >= ?'
    params.push(Number(effectiveMinPrice))
  }

  const effectiveMaxPrice = maxPrice ?? priceMax
  if (effectiveMaxPrice && typeof effectiveMaxPrice === 'string') {
    sql += ' AND p.price <= ?'
    params.push(Number(effectiveMaxPrice))
  }

  if (layout && typeof layout === 'string') {
    sql += ' AND p.layout LIKE ?'
    params.push(`%${layout}%`)
  }

  if (areaMin && typeof areaMin === 'string') {
    sql += ' AND p.area >= ?'
    params.push(Number(areaMin))
  }

  if (areaMax && typeof areaMax === 'string') {
    sql += ' AND p.area <= ?'
    params.push(Number(areaMax))
  }

  sql += ' ORDER BY b.district, b.name, p.floor, p.unitNumber'

  const properties = db.prepare(sql).all(...params)

  const heatmap = db.prepare(`
    SELECT b.district,
      AVG(p.unitPrice) as avgUnitPrice,
      COUNT(*) as propertyCount,
      AVG(b.lat) as lat,
      AVG(b.lng) as lng
    FROM properties p
    JOIN buildings b ON p.buildingId = b.id
    WHERE p.status = 'available'
    GROUP BY b.district
  `).all()

  res.json({
    success: true,
    data: {
      properties,
      heatmap
    }
  })
})

export default router
