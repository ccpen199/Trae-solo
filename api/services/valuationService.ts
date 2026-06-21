import db from '../db/index.js'

export interface ValuationInput {
  category: string
  era?: string
  material?: string
  condition?: string
  dimensions?: string
  provenance?: string
  aiAuthenticity?: number
  expertRating?: number
}

export interface ValuationResult {
  estimatedValue: number
  minValue: number
  maxValue: number
  confidence: number
  factors: { name: string; weight: number; description: string }[]
  comparableSales: { title: string; category: string; era: string; price: number; date: string }[]
  currency: string
  disclaimer: string
}

const CATEGORY_BASE_PRICES: Record<string, number> = {
  '玉器': 50000,
  '陶瓷': 80000,
  '书画': 120000,
  '钱币': 10000,
  '青铜器': 150000,
  '木器': 60000,
  '杂项': 15000,
  '珠宝': 200000,
  '古籍善本': 40000,
  '织绣': 25000,
  '印章': 30000,
  '造像': 100000
}

const ERA_MULTIPLIERS: Record<string, number> = {
  '新石器时代': 2.5, '夏商': 2.8, '商周': 2.6, '西周': 2.7, '春秋战国': 2.4,
  '先秦': 2.3, '秦汉': 2.2, '南北朝': 2.0, '隋唐': 2.1, '宋元': 1.9,
  '唐宋': 1.8, '元代': 1.7, '宋版': 2.5, '元版': 2.2, '明代': 1.6,
  '明版': 1.9, '万历': 1.7, '清代': 1.4, '清版': 1.5, '清代中期': 1.45,
  '民国': 1.2, '近现代': 1.0, '当代': 0.8, '现代': 0.9, '近代': 1.0,
  '后世仿品': 0.3, '建国后': 0.4
}

const CONDITION_MULTIPLIERS: Record<string, number> = {
  '完好': 1.2, '完整': 1.15, '良好': 1.1, '有轻微磨损': 0.95,
  '有小修': 0.8, '口沿有小修': 0.85, '有冲线': 0.7, '有缺损': 0.5,
  '残损': 0.3
}

const PROVENANCE_MULTIPLIERS: Record<string, number> = {
  '博物馆旧藏': 2.0, '名家收藏': 1.8, '拍卖行购入': 1.4,
  '家族传承': 1.2, '藏家转让': 1.15, '出土': 1.1,
  '民间征集': 1.0, '来源不明': 0.7
}

export function calculateValuation(input: ValuationInput): ValuationResult {
  const basePrice = CATEGORY_BASE_PRICES[input.category] || 20000
  const factors: { name: string; weight: number; description: string }[] = []

  let adjustedValue = basePrice
  factors.push({ name: '品类基础', weight: 0.35, description: `${input.category}品类基准价 ¥${basePrice.toLocaleString()}` })

  if (input.era) {
    const eraMult = ERA_MULTIPLIERS[input.era] || 1.0
    adjustedValue *= eraMult
    factors.push({ name: '年代因素', weight: 0.25, description: `${input.era}，系数 x${eraMult}` })
  }

  if (input.condition) {
    const condMult = Object.entries(CONDITION_MULTIPLIERS).find(([k]) => input.condition?.includes(k))?.[1] || 1.0
    adjustedValue *= condMult
    factors.push({ name: '品相因素', weight: 0.2, description: `${input.condition}，系数 x${condMult}` })
  }

  if (input.provenance) {
    const provMult = Object.entries(PROVENANCE_MULTIPLIERS).find(([k]) => input.provenance?.includes(k))?.[1] || 1.0
    adjustedValue *= provMult
    factors.push({ name: '传承有序', weight: 0.1, description: `${input.provenance}，系数 x${provMult}` })
  }

  if (input.material) {
    const premiumMaterials = ['和田白玉', '和田羊脂玉', '黄花梨', '紫檀木', '翡翠冰种', '祖母绿', '红宝石', '钻石']
    const hasPremium = premiumMaterials.some(m => input.material?.includes(m))
    const matMult = hasPremium ? 1.3 : 1.0
    adjustedValue *= matMult
    factors.push({ name: '材质因素', weight: 0.1, description: hasPremium ? `${input.material}优质材料，系数 x${matMult}` : `${input.material}普通材质` })
  }

  if (input.aiAuthenticity !== undefined) {
    const authMult = 0.5 + input.aiAuthenticity * 0.5
    adjustedValue *= authMult
    factors.push({ name: 'AI真伪评估', weight: 0.1, description: `可信度 ${(input.aiAuthenticity * 100).toFixed(0)}%，系数 x${authMult.toFixed(2)}` })
  }

  let confidence = 0.6
  confidence += factors.filter(f => f.weight > 0).length * 0.05
  if (input.aiAuthenticity !== undefined && input.aiAuthenticity > 0.8) confidence += 0.05
  confidence = Math.min(confidence, 0.95)

  const minValue = Math.round(adjustedValue * (0.7 + (1 - confidence) * 0.3))
  const maxValue = Math.round(adjustedValue * (1.3 - (1 - confidence) * 0.3))
  const estimatedValue = Math.round(adjustedValue)

  const comparableSales = generateComparableSales(input.category, input.era, estimatedValue)

  return {
    estimatedValue,
    minValue,
    maxValue,
    confidence: Number(confidence.toFixed(2)),
    factors,
    comparableSales,
    currency: 'CNY',
    disclaimer: '本评估结果由算法模型生成，仅供参考，不构成交易依据。实际价值请以专家实物鉴定和市场行情为准。'
  }
}

function generateComparableSales(category: string, era?: string, estimatedValue?: number): { title: string; category: string; era: string; price: number; date: string }[] {
  const samples: Record<string, { titles: string[]; eras: string[] }> = {
    '玉器': { titles: ['和田白玉观音摆件', '翡翠冰种手镯', '古玉璧', '青玉瑞兽'], eras: ['清代', '明代', '汉代', '近现代'] },
    '陶瓷': { titles: ['青花缠枝莲纹瓶', '粉彩花卉纹盘', '青瓷刻花梅瓶', '釉里红罐'], eras: ['清代康熙', '明代万历', '宋代', '元代'] },
    '书画': { titles: ['山水立轴', '花鸟册页', '行书对联', '墨竹图'], eras: ['清代', '明代', '近现代', '当代'] },
    '钱币': { titles: ['咸丰元宝当百', '大观通宝折十', '袁大头三年', '光绪元宝'], eras: ['清代', '宋代', '民国', '清代'] },
    '杂项': { titles: ['紫砂紫砂壶', '紫檀笔筒', '田黄印章', '沉香手串'], eras: ['清代', '明代', '近现代', '当代'] }
  }
  const data = samples[category] || samples['杂项']
  const basePrice = estimatedValue || 50000
  const result: { title: string; category: string; era: string; price: number; date: string }[] = []
  for (let i = 0; i < 3; i++) {
    const priceVariation = 0.7 + Math.random() * 0.6
    const daysAgo = Math.floor(Math.random() * 180) + 10
    result.push({
      title: data.titles[i % data.titles.length],
      category,
      era: era || data.eras[i % data.eras.length],
      price: Math.round(basePrice * priceVariation),
      date: new Date(Date.now() - daysAgo * 24 * 3600 * 1000).toISOString().slice(0, 10)
    })
  }
  return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getHistoricalPrices(category?: string): { date: string; avgPrice: number; volume: number }[] {
  const now = Date.now()
  const result: { date: string; avgPrice: number; volume: number }[] = []
  const base = CATEGORY_BASE_PRICES[category || '杂项'] || 30000
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now - i * 30 * 24 * 3600 * 1000)
    const monthFactor = 0.85 + Math.random() * 0.3
    result.push({
      date: date.toISOString().slice(0, 7),
      avgPrice: Math.round(base * monthFactor),
      volume: Math.floor(50 + Math.random() * 200)
    })
  }
  return result
}

export function getMarketStats(): {
  totalAppraisals: number
  totalValue: number
  avgValue: number
  topCategories: { category: string; count: number; avgValue: number }[]
  priceTrend: { date: string; index: number }[]
} {
  const totalAppraisals = (db.prepare("SELECT COUNT(*) as count FROM appraisal_orders WHERE status = 'completed'").get() as { count: number }).count
  const totalValue = (db.prepare('SELECT COALESCE(SUM(valuation), 0) as total FROM appraisal_orders WHERE valuation IS NOT NULL').get() as { total: number }).total
  const avgValue = totalAppraisals > 0 ? Math.round(totalValue / totalAppraisals) : 0

  const topCategoriesRows = db.prepare(`
    SELECT category, COUNT(*) as count, ROUND(AVG(estimated_value), 0) as avgValue
    FROM artworks
    WHERE status = 'published'
    GROUP BY category
    ORDER BY count DESC
    LIMIT 5
  `).all() as { category: string; count: number; avgValue: number }[]

  const now = Date.now()
  const priceTrend: { date: string; index: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now - i * 30 * 24 * 3600 * 1000)
    priceTrend.push({
      date: date.toISOString().slice(0, 7),
      index: Math.round(95 + Math.random() * 15)
    })
  }

  return {
    totalAppraisals,
    totalValue,
    avgValue,
    topCategories: topCategoriesRows,
    priceTrend
  }
}
