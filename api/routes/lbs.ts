import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'
import { pointInPolygon, SONGJIANG_BOUNDARY } from '../middleware/geofence.js'

const router = Router()

router.get('/geofence-check', (req: Request, res: Response): void => {
  const lng = parseFloat(req.query.lng as string)
  const lat = parseFloat(req.query.lat as string)

  if (isNaN(lng) || isNaN(lat)) {
    res.json({ code: 200, message: 'ok', data: { inside: false, lng: 0, lat: 0 } })
    return
  }

  const inside = pointInPolygon(lng, lat, SONGJIANG_BOUNDARY)
  res.json({ code: 200, message: 'ok', data: { inside, lng, lat } })
})

router.get('/nearby', (req: Request, res: Response): void => {
  const db = getDb()
  const lng = parseFloat(req.query.lng as string)
  const lat = parseFloat(req.query.lat as string)
  const radius = parseFloat(req.query.radius as string) || 5
  const category = req.query.category as string
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20))

  if (isNaN(lng) || isNaN(lat)) {
    res.status(400).json({ code: 400, message: '缺少经纬度参数', data: null })
    return
  }

  let where = "WHERE status = 'approved'"
  const params: unknown[] = []

  if (category) {
    where += ' AND category = ?'
    params.push(category)
  }

  const merchants = db.prepare(`
    SELECT *, ((lng - ?) * (lng - ?) + (lat - ?) * (lat - ?)) * 111 * 111 as distance_sq
    FROM merchants ${where}
    ORDER BY distance_sq ASC
    LIMIT ?
  `).all(lng, lng, lat, lat, ...params, limit * 3) as Array<Record<string, unknown>>

  const nearbyMerchants = merchants.map(m => {
    const dlng = (m.lng as number) - lng
    const dlat = (m.lat as number) - lat
    m.distance = Math.sqrt(dlng * dlng + dlat * dlat) * 111
    return m
  }).filter(m => (m.distance as number) <= radius).slice(0, limit)

  const enrichedMerchants = nearbyMerchants.map(m => {
    const tags = db.prepare('SELECT tag FROM merchant_tags WHERE merchant_id = ?').all(m.id) as Array<{ tag: string }>
    return { ...m, tags: tags.map(t => t.tag) }
  })

  res.json({ code: 200, message: 'ok', data: enrichedMerchants })
})

router.get('/heatmap', (req: Request, res: Response): void => {
  const db = getDb()

  const streets = db.prepare(`
    SELECT 
      m.street as name,
      COUNT(*) as merchantCount,
      SUM(m.popularity) as totalPopularity,
      AVG(m.popularity) as avgPopularity,
      SUM(m.rating * m.popularity) / SUM(m.popularity) as weightedRating,
      AVG(m.lng) as lng,
      AVG(m.lat) as lat
    FROM merchants m
    WHERE m.status = 'approved'
    GROUP BY m.street
    ORDER BY totalPopularity DESC
  `).all() as Array<Record<string, unknown>>

  const maxPopularity = Math.max(...streets.map(s => s.totalPopularity as number), 1)

  const areas = streets.map((s, idx) => {
    const intensity = Math.round(((s.totalPopularity as number) / maxPopularity) * 50 + 40)
    const topCats = db.prepare(`
      SELECT category, COUNT(*) as cnt
      FROM merchants
      WHERE street = ? AND status = 'approved'
      GROUP BY category
      ORDER BY cnt DESC
      LIMIT 3
    `).all(s.name) as Array<{ category: string; cnt: number }>

    return {
      name: s.name,
      center: { lng: s.lng, lat: s.lat },
      radius: Math.max(30, Math.min(60, 30 + (intensity - 40) / 60 * 30)),
      intensity,
      rank: idx + 1,
      topCategories: topCats.map(c => c.category),
      merchantCount: s.merchantCount,
      totalPopularity: s.totalPopularity,
      avgPopularity: Math.round(s.avgPopularity as number),
      weightedRating: (s.weightedRating as number) || 0,
    }
  })

  const categoryStats = db.prepare(`
    SELECT 
      m.street,
      m.category,
      COUNT(*) as count
    FROM merchants m
    WHERE m.status = 'approved'
    GROUP BY m.street, m.category
  `).all() as Array<{ street: string; category: string; count: number }>

  res.json({ 
    code: 200, 
    message: 'ok', 
    data: { 
      areas,
      categoryStats,
      totalMerchants: streets.reduce((acc, s) => acc + (s.merchantCount as number), 0),
      topStreets: areas.slice(0, 5).map(a => ({ name: a.name, merchantCount: a.merchantCount, intensity: a.intensity })),
    } 
  })
})

export default router
