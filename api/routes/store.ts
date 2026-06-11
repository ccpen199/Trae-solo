import { Router, type Request, type Response } from 'express'

const router = Router()

interface Product {
  id: string
  name: string
  category: string
  price: number
  shelfZone: string
  shelfRow: number
  expiryDate: string
  stock: number
}

const products: Product[] = [
  { id: 'p01', name: '农夫山泉矿泉水550ml', category: '饮品', price: 2, shelfZone: 'A', shelfRow: 1, expiryDate: '2027-06-01', stock: 200 },
  { id: 'p02', name: '康师傅红烧牛肉面', category: '方便食品', price: 4.5, shelfZone: 'B', shelfRow: 2, expiryDate: '2026-09-15', stock: 150 },
  { id: 'p03', name: '蒙牛纯牛奶250ml', category: '饮品', price: 3.5, shelfZone: 'A', shelfRow: 2, expiryDate: '2026-07-10', stock: 80 },
  { id: 'p04', name: '奥利奥原味饼干', category: '零食', price: 8.9, shelfZone: 'C', shelfRow: 1, expiryDate: '2026-12-20', stock: 60 },
  { id: 'p05', name: '乐事薯片原味75g', category: '零食', price: 6.5, shelfZone: 'C', shelfRow: 2, expiryDate: '2026-11-30', stock: 90 },
  { id: 'p06', name: '伊利酸奶200ml', category: '饮品', price: 4, shelfZone: 'A', shelfRow: 3, expiryDate: '2026-06-15', stock: 40 },
  { id: 'p07', name: '三全速冻水饺500g', category: '速冻食品', price: 15.8, shelfZone: 'D', shelfRow: 1, expiryDate: '2026-08-25', stock: 30 },
  { id: 'p08', name: '统一冰红茶500ml', category: '饮品', price: 3, shelfZone: 'A', shelfRow: 1, expiryDate: '2027-03-01', stock: 120 },
  { id: 'p09', name: '良品铺子坚果礼包', category: '零食', price: 29.9, shelfZone: 'C', shelfRow: 3, expiryDate: '2026-06-20', stock: 25 },
  { id: 'p10', name: '湾仔码头汤圆320g', category: '速冻食品', price: 12.5, shelfZone: 'D', shelfRow: 2, expiryDate: '2026-10-10', stock: 35 },
  { id: 'p11', name: '百事可乐330ml', category: '饮品', price: 2.5, shelfZone: 'A', shelfRow: 4, expiryDate: '2027-01-15', stock: 180 },
  { id: 'p12', name: '卫龙大面筋108g', category: '零食', price: 5, shelfZone: 'C', shelfRow: 4, expiryDate: '2026-08-01', stock: 100 },
  { id: 'p13', name: '安慕希酸奶205ml', category: '饮品', price: 5.5, shelfZone: 'A', shelfRow: 5, expiryDate: '2026-06-18', stock: 50 },
  { id: 'p14', name: '旺旺雪饼150g', category: '零食', price: 7.8, shelfZone: 'C', shelfRow: 5, expiryDate: '2027-02-28', stock: 45 },
]

interface ShelfZone {
  id: string
  name: string
  rows: number
  category: string
  temperature: string
}

const shelves: ShelfZone[] = [
  { id: 'A', name: 'A区-冷藏饮品区', rows: 6, category: '饮品', temperature: '2-8°C' },
  { id: 'B', name: 'B区-常温食品区', rows: 4, category: '方便食品', temperature: '常温' },
  { id: 'C', name: 'C区-零食区', rows: 6, category: '零食', temperature: '常温' },
  { id: 'D', name: 'D区-冷冻食品区', rows: 3, category: '速冻食品', temperature: '-18°C' },
]

interface StoreOrder {
  id: string
  productIds: string[]
  total: number
  dormitory: string
  status: 'pending' | 'picking' | 'delivering' | 'delivered'
  createdAt: string
}

const storeOrders: StoreOrder[] = []

interface DelivererTask {
  id: string
  orderId: string
  dormitory: string
  items: string[]
  shelfZones: string[]
  status: 'pending' | 'picked'
  createdAt: string
}

const delivererTasks: DelivererTask[] = [
  {
    id: 'dt-001',
    orderId: 'sord-001',
    dormitory: '梅园2栋303',
    items: ['农夫山泉矿泉水550ml', '奥利奥原味饼干'],
    shelfZones: ['A', 'C'],
    status: 'pending',
    createdAt: '2026-06-09T09:30:00Z',
  },
  {
    id: 'dt-002',
    orderId: 'sord-002',
    dormitory: '竹园3栋101',
    items: ['康师傅红烧牛肉面', '乐事薯片原味75g', '百事可乐330ml'],
    shelfZones: ['B', 'C', 'A'],
    status: 'pending',
    createdAt: '2026-06-09T09:45:00Z',
  },
  {
    id: 'dt-003',
    orderId: 'sord-003',
    dormitory: '松园1栋520',
    items: ['三全速冻水饺500g', '湾仔码头汤圆320g'],
    shelfZones: ['D'],
    status: 'pending',
    createdAt: '2026-06-09T10:00:00Z',
  },
]

let storeOrderCounter = 0

router.get('/products', (_req: Request, res: Response) => {
  res.json({ success: true, data: products })
})

router.get('/shelves', (_req: Request, res: Response) => {
  res.json({ success: true, data: shelves })
})

router.get('/expiring', (_req: Request, res: Response) => {
  const now = new Date()
  const threshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const expiring = products.filter((p) => new Date(p.expiryDate) <= threshold)
  res.json({ success: true, data: expiring })
})

router.post('/orders', (req: Request, res: Response) => {
  const { productIds, dormitory } = req.body
  if (!productIds || !dormitory) {
    res.status(400).json({ success: false, error: '缺少必要参数' })
    return
  }
  const orderedProducts = products.filter((p) => productIds.includes(p.id))
  const total = orderedProducts.reduce((sum, p) => sum + p.price, 0)
  storeOrderCounter++
  const order: StoreOrder = {
    id: `sord-${String(storeOrderCounter).padStart(3, '0')}`,
    productIds,
    total: Math.round(total * 100) / 100,
    dormitory,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  storeOrders.push(order)
  res.status(201).json({ success: true, data: order })
})

router.get('/deliverer/tasks', (_req: Request, res: Response) => {
  const pending = delivererTasks.filter((t) => t.status === 'pending')
  res.json({ success: true, data: pending })
})

router.post('/deliverer/pick/:taskId', (req: Request, res: Response) => {
  const task = delivererTasks.find((t) => t.id === req.params.taskId && t.status === 'pending')
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在或已被领取' })
    return
  }
  task.status = 'picked'
  res.json({ success: true, data: task })
})

export default router
