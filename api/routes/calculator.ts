import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.post('/', (req: Request, res: Response): void => {
  const { city, area, house_type, style, quality } = req.body

  if (!city || !area) {
    res.status(400).json({ success: false, error: '缺少城市或面积信息' })
    return
  }

  const areaNum = Number(area)
  const prices = db.prepare('SELECT category, price, unit FROM city_prices WHERE city = ?').all(city) as { category: string; price: number; unit: string }[]

  if (prices.length === 0) {
    res.status(404).json({ success: false, error: '该城市暂无价格数据' })
    return
  }

  const styleMultiplier: Record<string, number> = {
    '现代简约': 1.0,
    '北欧': 1.05,
    '新中式': 1.2,
    '日式侘寂': 1.1,
    '轻奢': 1.3,
    '工业风': 1.05,
  }

  const qualityMultiplier: Record<string, number> = {
    '经济': 0.7,
    '标准': 1.0,
    '品质': 1.3,
    '豪华': 1.8,
    'economy': 0.7,
    'standard': 1.0,
    'premium': 1.3,
    'luxury': 1.8,
  }

  const sMul = styleMultiplier[style] || 1.0
  const qMul = qualityMultiplier[quality] || 1.0

  const breakdown: Record<string, { unit_price: number; total: number; unit: string }> = {}
  let total = 0

  for (const p of prices) {
    const unitPrice = Math.round(p.price * sMul * qMul)
    const lineTotal = Math.round(unitPrice * areaNum)
    breakdown[p.category] = { unit_price: unitPrice, total: lineTotal, unit: p.unit }
    total += lineTotal
  }

  const nodes = db.prepare('SELECT name, phase, duration_days, description, order_num FROM construction_nodes ORDER BY order_num').all()

  const materials = db.prepare('SELECT name, category, brand, unit, price FROM materials LIMIT 6').all()

  res.json({
    success: true,
    data: {
      city,
      area: areaNum,
      houseType: house_type || '三室两厅',
      style: style || '现代简约',
      quality: quality || '标准',
      breakdown,
      total,
      constructionTimeline: nodes,
      recommendedMaterials: materials,
    },
  })
})

router.get('/cities', (_req: Request, res: Response): void => {
  const cities = db.prepare('SELECT DISTINCT city FROM city_prices ORDER BY city').all() as { city: string }[]
  res.json({ success: true, data: cities.map(c => c.city) })
})

router.get('/prices', (req: Request, res: Response): void => {
  const { city } = req.query

  if (!city) {
    res.status(400).json({ success: false, error: '缺少城市参数' })
    return
  }

  const prices = db.prepare('SELECT category, price, unit FROM city_prices WHERE city = ? ORDER BY category').all(city as string)
  res.json({ success: true, data: prices })
})

export default router
