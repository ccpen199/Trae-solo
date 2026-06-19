import { Router, type Request, type Response } from 'express'
import dayjs from 'dayjs'

const router = Router()

const mockBrands = [
  { id: 1, name: '苹果', category: '手机', logo: '🍎' },
  { id: 2, name: '华为', category: '手机', logo: '📱' },
  { id: 3, name: '小米', category: '手机', logo: '📲' },
  { id: 4, name: '三星', category: '手机', logo: '📟' },
  { id: 5, name: 'OPPO', category: '手机', logo: '📞' },
  { id: 6, name: '联想', category: '电脑', logo: '💻' },
  { id: 7, name: '戴尔', category: '电脑', logo: '🖥️' },
  { id: 8, name: '惠普', category: '电脑', logo: '⌨️' },
]

router.post('/calculate', async (req: Request, res: Response): Promise<void> => {
  const { category, brand, model, condition, weight } = req.body

  const basePrice = 1000
  const brandFactor: Record<string, number> = {
    '苹果': 1.5,
    '华为': 1.3,
    '小米': 1.1,
    '三星': 1.2,
  }
  const conditionFactor: Record<string, number> = {
    '全新': 1.0,
    '99新': 0.9,
    '95新': 0.8,
    '9成新': 0.7,
    '8成新': 0.6,
    '破损': 0.3,
  }

  const price = Math.round(
    basePrice *
      (brandFactor[brand] || 1) *
      (conditionFactor[condition] || 0.5) *
      (weight ? weight / 100 : 1),
  )

  res.json({
    success: true,
    data: {
      price,
      currency: 'CNY',
      category,
      brand,
      model,
      condition,
      weight,
      estimatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      validUntil: dayjs().add(7, 'day').format('YYYY-MM-DD HH:mm:ss'),
    },
  })
})

router.get('/brands', async (req: Request, res: Response): Promise<void> => {
  const { category } = req.query
  const brands = category
    ? mockBrands.filter((b) => b.category === category)
    : mockBrands

  res.json({
    success: true,
    data: brands,
  })
})

export default router
