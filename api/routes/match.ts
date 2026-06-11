import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'

const router = Router()

interface SupplierRow {
  id: string
  name: string
  type: string
  location: string
  credit_score: number
  fulfillment_rate: number
  complaint_rate: number
  qc_pass_rate: number
  crafts: string
  capacity_current: number
  capacity_max: number
  certifications: string
  description: string
  is_online: number
}

interface MatchRequest {
  type: 'procurement' | 'processing' | 'accessory'
  requirements: {
    location?: string
    craftType?: string[]
    quantity?: number
    deliveryDate?: string
    budget?: { min: number; max: number }
  }
  weights?: {
    location?: number
    capacity?: number
    craft?: number
    price?: number
  }
}

const DEFAULT_WEIGHTS = { location: 0.3, capacity: 0.25, craft: 0.25, price: 0.2 }

const REGION_MAP: Record<string, string[]> = {
  '嘉兴濮院': ['嘉兴', '濮院', '桐乡', '海宁'],
  '东莞大朗': ['东莞', '大朗', '深圳', '广州'],
  '汕头': ['汕头', '潮州', '揭阳'],
  '苏州': ['苏州', '吴江', '常熟'],
  '杭州': ['杭州', '萧山', '余杭'],
  '宁波': ['宁波', '慈溪', '余姚'],
  '绍兴': ['绍兴', '柯桥', '诸暨'],
}

function calcLocationScore(supplierLocation: string, targetLocation: string): number {
  if (!targetLocation) return 50
  if (supplierLocation === targetLocation) return 100
  for (const [region, cities] of Object.entries(REGION_MAP)) {
    const regionMatch = cities.some(c => targetLocation.includes(c) || c.includes(targetLocation))
    if (regionMatch && cities.some(c => supplierLocation.includes(c) || c.includes(supplierLocation))) {
      if (region === targetLocation || region.includes(targetLocation) || targetLocation.includes(region)) return 90
      return 60
    }
  }
  return 30
}

function calcCapacityScore(capacityCurrent: number, capacityMax: number, requiredQuantity: number): number {
  if (!requiredQuantity || capacityMax === 0) return 50
  const available = capacityMax - capacityCurrent
  if (available >= requiredQuantity) {
    const utilization = capacityCurrent / capacityMax
    return Math.round(100 - utilization * 40)
  }
  return Math.round((available / requiredQuantity) * 60)
}

function calcCraftScore(supplierCrafts: string[], requiredCrafts: string[]): number {
  if (!requiredCrafts || requiredCrafts.length === 0) return 50
  if (!supplierCrafts || supplierCrafts.length === 0) return 0
  const matched = requiredCrafts.filter(rc => supplierCrafts.some(sc => sc === rc || sc.includes(rc) || rc.includes(sc)))
  return Math.round((matched.length / requiredCrafts.length) * 100)
}

function calcPriceScore(supplierCreditScore: number, budgetMin?: number, budgetMax?: number): number {
  if (!budgetMin && !budgetMax) return 50
  return Math.min(100, Math.round(supplierCreditScore * 0.8 + 20))
}

router.post('/', (req: Request, res: Response): void => {
  try {
    const { type, requirements, weights: customWeights }: MatchRequest = req.body

    if (!type || !requirements) {
      res.status(400).json({ success: false, error: '缺少匹配类型或需求参数' })
      return
    }

    const weights = {
      location: customWeights?.location ?? DEFAULT_WEIGHTS.location,
      capacity: customWeights?.capacity ?? DEFAULT_WEIGHTS.capacity,
      craft: customWeights?.craft ?? DEFAULT_WEIGHTS.craft,
      price: customWeights?.price ?? DEFAULT_WEIGHTS.price,
    }

    const totalWeight = weights.location + weights.capacity + weights.craft + weights.price
    if (totalWeight > 0) {
      weights.location /= totalWeight
      weights.capacity /= totalWeight
      weights.craft /= totalWeight
      weights.price /= totalWeight
    }

    let supplierType: string
    if (type === 'procurement' || type === 'processing') {
      supplierType = 'factory'
    } else {
      supplierType = 'accessory_supplier'
    }

    const suppliers = db.prepare('SELECT * FROM suppliers WHERE type = ?').all(supplierType) as SupplierRow[]

    const results = suppliers.map(supplier => {
      const locationScore = calcLocationScore(supplier.location, requirements.location || '')
      const capacityScore = calcCapacityScore(supplier.capacity_current, supplier.capacity_max, requirements.quantity || 0)
      const supplierCrafts: string[] = JSON.parse(supplier.crafts || '[]')
      const craftScore = calcCraftScore(supplierCrafts, requirements.craftType || [])
      const priceScore = calcPriceScore(supplier.credit_score, requirements.budget?.min, requirements.budget?.max)

      const totalScore = Math.round(
        locationScore * weights.location +
        capacityScore * weights.capacity +
        craftScore * weights.craft +
        priceScore * weights.price
      )

      return {
        supplierId: supplier.id,
        supplierName: supplier.name,
        location: supplier.location,
        type: supplier.type,
        creditScore: supplier.credit_score,
        isOnline: supplier.is_online === 1,
        score: totalScore,
        dimensions: {
          locationScore,
          capacityScore,
          craftScore,
          priceScore,
        },
      }
    })

    results.sort((a, b) => b.score - a.score)

    res.json({ success: true, data: results.slice(0, 20) })
  } catch (error) {
    res.status(500).json({ success: false, error: '智能匹配失败' })
  }
})

interface BomItem {
  name: string
  category: string
  quantity: number
  unit: string
}

router.post('/bom', (req: Request, res: Response): void => {
  try {
    const { items }: { items: BomItem[] } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: '请提供BOM清单物料列表' })
      return
    }

    const suppliers = db.prepare("SELECT * FROM suppliers WHERE type = 'accessory_supplier'").all() as SupplierRow[]
    const allAccessories = db.prepare('SELECT * FROM accessory_supplies').all() as {
      id: string
      supplier_id: string
      name: string
      category: string
      material: string
      specs: string
      price: number
      unit: string
      min_order: number
      stock: number
    }[]

    const bomResults = items.map(item => {
      const matched = allAccessories
        .filter(a => a.category === item.category || a.name.includes(item.name) || item.name.includes(a.name))
        .map(a => {
          const supplier = suppliers.find(s => s.id === a.supplier_id)
          const priceMultiplier = item.quantity < a.min_order ? 1.15 : 1.0
          const totalPrice = a.price * item.quantity * priceMultiplier
          return {
            accessoryId: a.id,
            name: a.name,
            category: a.category,
            specs: a.specs,
            unitPrice: a.price,
            totalPrice: Math.round(totalPrice * 100) / 100,
            minOrder: a.min_order,
            stock: a.stock,
            supplierId: a.supplier_id,
            supplierName: supplier?.name || '未知供应商',
            supplierCreditScore: supplier?.credit_score || 0,
            canFulfill: a.stock >= item.quantity,
          }
        })

      matched.sort((a, b) => a.totalPrice - b.totalPrice)

      return {
        item: item.name,
        category: item.category,
        quantity: item.quantity,
        matches: matched.slice(0, 5),
      }
    })

    const supplierQuotes = new Map<string, { supplierId: string; supplierName: string; creditScore: number; totalAmount: number; items: { name: string; unitPrice: number; totalPrice: number; canFulfill: boolean }[] }>()

    for (const bomItem of bomResults) {
      for (const match of bomItem.matches) {
        const existing = supplierQuotes.get(match.supplierId)
        const entry = { name: bomItem.item, unitPrice: match.unitPrice, totalPrice: match.totalPrice, canFulfill: match.canFulfill }
        if (existing) {
          existing.items.push(entry)
          existing.totalAmount += match.totalPrice
        } else {
          supplierQuotes.set(match.supplierId, {
            supplierId: match.supplierId,
            supplierName: match.supplierName,
            creditScore: match.supplierCreditScore,
            totalAmount: match.totalPrice,
            items: [entry],
          })
        }
      }
    }

    const comparison = Array.from(supplierQuotes.values())
      .map(sq => ({ ...sq, totalAmount: Math.round(sq.totalAmount * 100) / 100 }))
      .sort((a, b) => a.totalAmount - b.totalAmount)

    res.json({
      success: true,
      data: {
        bomItems: bomResults,
        supplierComparison: comparison,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'BOM比价失败' })
  }
})

export default router
