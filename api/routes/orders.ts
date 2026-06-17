import { Router, type Request, type Response } from 'express'

type PurchaseOrder = {
  id: string
  planId: string
  petName: string
  items: string[]
  status: 'submitted' | 'confirmed'
  createdAt: string
}

const router = Router()

const feedingPlans = [
  {
    id: 'f1',
    petName: '豆豆',
    recommendedFoods: ['优质无谷狗粮', '水煮鸡胸肉', '胡萝卜', '南瓜'],
    supplements: ['深海鱼油', '关节宝', '益生菌'],
  },
  {
    id: 'f2',
    petName: '奶茶',
    recommendedFoods: ['全价主食罐', '冻干鸡胸', '化毛膏', '猫草'],
    supplements: ['牛磺酸', '赖氨酸', '卵磷脂'],
  },
]

const mockOrders: PurchaseOrder[] = []

router.get('/feeding-plans', async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    data: feedingPlans,
  })
})

router.post('/purchase', async (req: Request, res: Response): Promise<void> => {
  const plan = feedingPlans.find(item => item.id === req.body.planId) ?? feedingPlans[0]
  const order: PurchaseOrder = {
    id: `order${Date.now()}`,
    planId: plan.id,
    petName: req.body.petName || plan.petName,
    items: req.body.items || [...plan.recommendedFoods.slice(0, 2), ...plan.supplements.slice(0, 1)],
    status: 'submitted',
    createdAt: new Date().toISOString(),
  }
  mockOrders.unshift(order)
  res.status(201).json({
    success: true,
    message: '购买清单已提交',
    data: order,
  })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const order = mockOrders.find(item => item.id === req.params.id)
  if (!order) {
    res.status(404).json({
      success: false,
      error: 'Order not found',
    })
    return
  }
  res.status(200).json({
    success: true,
    data: order,
  })
})

export default router
