import { Router, type Request, type Response } from 'express'
import { getDb } from '../db/init.js'

const router = Router()

const priceConfig: Record<string, {
  basePerKg: number
  brandMultiplier: Record<string, number>
  conditionMultiplier: Record<string, number>
  models: Record<string, { min: number; max: number }>
}> = {
  clothing: {
    basePerKg: 3.0,
    brandMultiplier: {
      'Nike': 1.8, 'Adidas': 1.7, '优衣库': 1.3, 'ZARA': 1.2, 'H&M': 1.1,
      '波司登': 2.0, '李宁': 1.5, '安踏': 1.4,
    },
    conditionMultiplier: { '全新': 1.5, '九成新': 1.2, '八成新': 1.0, '七成新': 0.7, '六成新': 0.5 },
    models: {},
  },
  book: {
    basePerKg: 2.0,
    brandMultiplier: {
      '人民文学出版社': 1.3, '中信出版社': 1.4, '机械工业出版社': 1.2,
      '清华大学出版社': 1.3, '电子工业出版社': 1.2,
    },
    conditionMultiplier: { '全新': 1.6, '九成新': 1.3, '八成新': 1.0, '七成新': 0.6, '六成新': 0.4 },
    models: {
      'Python编程': { min: 15, max: 40 },
      '经济学原理': { min: 20, max: 50 },
      '人类简史': { min: 10, max: 35 },
      '三体': { min: 15, max: 45 },
      '深度学习': { min: 25, max: 60 },
    },
  },
  phone: {
    basePerKg: 0,
    brandMultiplier: {
      'Apple': 2.5, 'Huawei': 2.0, 'Xiaomi': 1.4, 'OPPO': 1.2, 'vivo': 1.2, 'Samsung': 1.6,
    },
    conditionMultiplier: { '全新': 1.8, '九成新': 1.4, '八成新': 1.0, '七成新': 0.6, '六成新': 0.35 },
    models: {
      'iPhone 13': { min: 1500, max: 2800 },
      'iPhone 14': { min: 2200, max: 3800 },
      'iPhone 15': { min: 3000, max: 5000 },
      'Mate 60': { min: 1800, max: 3500 },
      'P60': { min: 1200, max: 2500 },
      'Redmi Note 12': { min: 300, max: 600 },
      'Reno 10': { min: 500, max: 900 },
      'X100': { min: 800, max: 1500 },
      'Galaxy S23': { min: 1200, max: 2200 },
    },
  },
}

router.post('/', (req: Request, res: Response): void => {
  try {
    const { category, brand, model, condition, weight } = req.body

    if (!category) {
      res.status(400).json({ success: false, error: '缺少品类信息' })
      return
    }

    const config = priceConfig[category]
    if (!config) {
      res.status(400).json({ success: false, error: '不支持的品类' })
      return
    }

    let estimatedPrice = 0
    let breakdown: { label: string; value: number }[] = []

    if (category === 'phone' && model && config.models[model]) {
      const modelRange = config.models[model]
      const basePrice = (modelRange.min + modelRange.max) / 2
      const condMult = condition ? (config.conditionMultiplier[condition] || 1.0) : 1.0
      estimatedPrice = Math.round(basePrice * condMult * 100) / 100
      breakdown = [
        { label: '机型基准价', value: Math.round(basePrice * 100) / 100 },
        { label: `成色系数(${condition || '八成新'})`, value: condMult },
      ]
    } else if (category === 'book' && model && config.models[model]) {
      const modelRange = config.models[model]
      const basePrice = (modelRange.min + modelRange.max) / 2
      const condMult = condition ? (config.conditionMultiplier[condition] || 1.0) : 1.0
      const w = weight || 0.5
      estimatedPrice = Math.round(basePrice * condMult * w * 100) / 100
      breakdown = [
        { label: '书籍基准价', value: Math.round(basePrice * 100) / 100 },
        { label: `成色系数(${condition || '八成新'})`, value: condMult },
        { label: '重量(kg)', value: w },
      ]
    } else if (category === 'clothing' || category === 'book') {
      const w = weight || 1
      const basePrice = config.basePerKg * w
      const brandMult = brand ? (config.brandMultiplier[brand] || 1.0) : 1.0
      const condMult = condition ? (config.conditionMultiplier[condition] || 1.0) : 1.0
      estimatedPrice = Math.round(basePrice * brandMult * condMult * 100) / 100
      breakdown = [
        { label: '基础单价(元/kg)', value: config.basePerKg },
        { label: '重量(kg)', value: w },
        { label: `品牌系数(${brand || '通用'})`, value: brandMult },
        { label: `成色系数(${condition || '八成新'})`, value: condMult },
      ]
    }

    const fluctuation = 0.9 + Math.random() * 0.2
    estimatedPrice = Math.round(estimatedPrice * fluctuation * 100) / 100
    estimatedPrice = Math.max(estimatedPrice, 1)

    const db = getDb()
    const rules = db.prepare(`SELECT * FROM pricing_rules WHERE category = ? AND enabled = 1 ORDER BY priority DESC`).all(category)
    const matchedRules = rules.map((r: Record<string, unknown>) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      modifier: r.price_modifier,
    }))

    res.json({
      success: true,
      data: {
        estimated_price: estimatedPrice,
        currency: 'CNY',
        breakdown,
        matched_rules: matchedRules,
        confidence: Math.round((0.75 + Math.random() * 0.2) * 100) / 100,
        price_range: {
          min: Math.round(estimatedPrice * 0.7 * 100) / 100,
          max: Math.round(estimatedPrice * 1.3 * 100) / 100,
        },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '估价失败' })
  }
})

export default router
