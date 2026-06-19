import { Router, type Request, type Response } from 'express'
import dayjs from 'dayjs'

const router = Router()

const mockPricingRules = [
  {
    id: 1,
    name: '手机-苹果品牌基础定价',
    category: '手机',
    brand: '苹果',
    basePrice: 3000,
    conditionMultipliers: {
      '全新': 1.0,
      '99新': 0.95,
      '95新': 0.85,
      '9成新': 0.75,
      '8成新': 0.6,
      '破损': 0.3,
    },
    weightMultiplier: 1.2,
    status: 'active',
    createdAt: dayjs().subtract(30, 'day').format('YYYY-MM-DD HH:mm:ss'),
    updatedAt: dayjs().subtract(10, 'day').format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    id: 2,
    name: '手机-华为品牌基础定价',
    category: '手机',
    brand: '华为',
    basePrice: 2500,
    conditionMultipliers: {
      '全新': 1.0,
      '99新': 0.93,
      '95新': 0.82,
      '9成新': 0.72,
      '8成新': 0.58,
      '破损': 0.28,
    },
    weightMultiplier: 1.15,
    status: 'active',
    createdAt: dayjs().subtract(25, 'day').format('YYYY-MM-DD HH:mm:ss'),
    updatedAt: dayjs().subtract(8, 'day').format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    id: 3,
    name: '电脑-联想品牌基础定价',
    category: '电脑',
    brand: '联想',
    basePrice: 4000,
    conditionMultipliers: {
      '全新': 1.0,
      '99新': 0.94,
      '95新': 0.84,
      '9成新': 0.74,
      '8成新': 0.55,
      '破损': 0.25,
    },
    weightMultiplier: 1.05,
    status: 'inactive',
    createdAt: dayjs().subtract(20, 'day').format('YYYY-MM-DD HH:mm:ss'),
    updatedAt: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'),
  },
]

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { category, brand, status } = req.query

  let filtered = mockPricingRules
  if (category) filtered = filtered.filter((r) => r.category === category)
  if (brand) filtered = filtered.filter((r) => r.brand === brand)
  if (status) filtered = filtered.filter((r) => r.status === status)

  res.json({
    success: true,
    data: filtered,
  })
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { name, category, brand, basePrice, conditionMultipliers, weightMultiplier } = req.body

  const newId = mockPricingRules.length + 1

  res.json({
    success: true,
    data: {
      id: newId,
      name,
      category,
      brand,
      basePrice,
      conditionMultipliers,
      weightMultiplier,
      status: 'active',
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    },
  })
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const { name, basePrice, conditionMultipliers, weightMultiplier, status } = req.body

  res.json({
    success: true,
    data: {
      id: Number(id),
      name,
      basePrice,
      conditionMultipliers,
      weightMultiplier,
      status,
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    },
  })
})

router.post('/simulate', async (req: Request, res: Response): Promise<void> => {
  const { category, brand, model, condition, weight } = req.body

  const basePrice = 3000
  const conditionFactor: Record<string, number> = {
    '全新': 1.0,
    '99新': 0.95,
    '95新': 0.85,
    '9成新': 0.75,
    '8成新': 0.6,
    '破损': 0.3,
  }
  const brandFactor: Record<string, number> = {
    '苹果': 1.5,
    '华为': 1.3,
    '小米': 1.1,
  }

  const simulatedPrice = Math.round(
    basePrice *
      (brandFactor[brand] || 1) *
      (conditionFactor[condition] || 0.5) *
      (weight ? weight / 100 : 1),
  )

  res.json({
    success: true,
    data: {
      category,
      brand,
      model,
      condition,
      weight,
      basePrice,
      brandMultiplier: brandFactor[brand] || 1,
      conditionMultiplier: conditionFactor[condition] || 0.5,
      weightMultiplier: weight ? weight / 100 : 1,
      simulatedPrice,
      simulatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    },
  })
})

export default router
