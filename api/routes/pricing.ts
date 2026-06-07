import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/routes', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { from, to, cargoType, page = '1', pageSize = '20' } = req.query
    let sql = 'SELECT * FROM route_prices WHERE 1=1'
    const params: any[] = []
    if (from) { sql += ' AND from_city LIKE ?'; params.push(`%${from}%`) }
    if (to) { sql += ' AND to_city LIKE ?'; params.push(`%${to}%`) }
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count')
    const total = (db.prepare(countSql).get(...params) as any).count
    sql += ' ORDER BY current_price DESC LIMIT ? OFFSET ?'
    const p = parseInt(page as string)
    const ps = parseInt(pageSize as string)
    params.push(ps, (p - 1) * ps)
    const routes = db.prepare(sql).all(...params)
    res.json({ success: true, routes, total })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/routes/:routeId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const route = db.prepare('SELECT * FROM route_prices WHERE id = ?').get(req.params.routeId) as any
    if (!route) {
      res.status(404).json({ success: false, error: '线路不存在' })
      return
    }
    res.json({ success: true, route })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/trend', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { routeId, months = '6' } = req.query
    const route = routeId ? db.prepare('SELECT * FROM route_prices WHERE id = ?').get(routeId as string) as any : null
    const basePrice = route ? route.base_price : 200
    const trend = []
    for (let i = parseInt(months as string) - 1; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const seasonalFactor = 0.8 + Math.sin((date.getMonth() / 12) * Math.PI * 2) * 0.3
      const price = Math.round(basePrice * seasonalFactor * (0.9 + Math.random() * 0.2))
      trend.push({ month: monthStr, price, volume: Math.round(100 + Math.random() * 200) })
    }
    const seasonalFactors = [
      { month: '1月', factor: 0.85, label: '春节淡季' },
      { month: '4月', factor: 1.1, label: '春季旺季' },
      { month: '7月', factor: 1.2, label: '暑期高峰' },
      { month: '10月', factor: 1.15, label: '金九银十' },
    ]
    const weatherImpact = {
      rain: 1.05,
      snow: 1.15,
      fog: 1.08,
      clear: 1.0,
    }
    res.json({ success: true, trend, seasonalFactors, weatherImpact })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/heatmap', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const routes = db.prepare('SELECT from_city, to_city, current_price, base_price FROM route_prices').all() as any[]
    const cityMap: Record<string, { total: number; count: number; lat: number; lng: number }> = {}
    const cityCoords: Record<string, { lat: number; lng: number }> = {
      '北京': { lat: 39.90, lng: 116.40 }, '上海': { lat: 31.23, lng: 121.47 },
      '广州': { lat: 23.13, lng: 113.26 }, '深圳': { lat: 22.54, lng: 114.06 },
      '成都': { lat: 30.57, lng: 104.07 }, '武汉': { lat: 30.59, lng: 114.31 },
      '杭州': { lat: 30.27, lng: 120.15 }, '南京': { lat: 32.06, lng: 118.80 },
      '重庆': { lat: 29.56, lng: 106.55 }, '西安': { lat: 34.26, lng: 108.94 },
      '长沙': { lat: 28.23, lng: 112.94 }, '郑州': { lat: 34.75, lng: 113.65 },
    }
    for (const r of routes) {
      for (const city of [r.from_city, r.to_city]) {
        if (!cityMap[city]) {
          const coords = cityCoords[city] || { lat: 30, lng: 110 }
          cityMap[city] = { total: 0, count: 0, lat: coords.lat, lng: coords.lng }
        }
        cityMap[city].total += r.current_price
        cityMap[city].count++
      }
    }
    const regions = Object.entries(cityMap).map(([city, data]) => ({
      city,
      avgPrice: Math.round(data.total / data.count),
      routeCount: data.count,
      lat: data.lat,
      lng: data.lng,
    }))
    res.json({ success: true, regions })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
