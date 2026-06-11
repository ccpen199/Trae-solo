import { Router, type Request, type Response } from 'express'

const router = Router()

interface MenuItem {
  id: string
  name: string
  price: number
  description: string
}

interface Stall {
  id: string
  name: string
  category: string
  rating: number
  avgDeliveryTime: string
  menu: MenuItem[]
}

const stalls: Stall[] = [
  {
    id: '1',
    name: '麻辣香锅',
    category: '川菜',
    rating: 4.8,
    avgDeliveryTime: '15-20分钟',
    menu: [
      { id: 'm1', name: '麻辣香锅（小份）', price: 22, description: '自选食材，小份适合一人食' },
      { id: 'm2', name: '麻辣香锅（大份）', price: 35, description: '自选食材，大份适合两人分享' },
      { id: 'm3', name: '酸辣粉', price: 12, description: '红薯粉配酸辣汤底' },
    ],
  },
  {
    id: '2',
    name: '黄焖鸡米饭',
    category: '家常菜',
    rating: 4.6,
    avgDeliveryTime: '10-15分钟',
    menu: [
      { id: 'm4', name: '黄焖鸡米饭（小）', price: 16, description: '鸡腿肉焖制，配米饭' },
      { id: 'm5', name: '黄焖鸡米饭（大）', price: 22, description: '加量鸡腿肉，配米饭' },
      { id: 'm6', name: '黄焖排骨米饭', price: 25, description: '排骨焖制，配米饭' },
    ],
  },
  {
    id: '3',
    name: '兰州拉面',
    category: '面食',
    rating: 4.5,
    avgDeliveryTime: '10-12分钟',
    menu: [
      { id: 'm7', name: '牛肉拉面（细）', price: 14, description: '清汤牛肉面，细面' },
      { id: 'm8', name: '牛肉拉面（宽）', price: 14, description: '清汤牛肉面，宽面' },
      { id: 'm9', name: '牛肉拌面', price: 16, description: '干拌牛肉面，配小菜' },
    ],
  },
  {
    id: '4',
    name: '粤式烧腊',
    category: '粤菜',
    rating: 4.7,
    avgDeliveryTime: '12-18分钟',
    menu: [
      { id: 'm10', name: '叉烧饭', price: 18, description: '蜜汁叉烧配米饭' },
      { id: 'm11', name: '烧鹅饭', price: 22, description: '脆皮烧鹅配米饭' },
      { id: 'm12', name: '双拼饭', price: 20, description: '叉烧+烧鹅双拼配米饭' },
    ],
  },
  {
    id: '5',
    name: '沙县小吃',
    category: '小吃',
    rating: 4.3,
    avgDeliveryTime: '8-12分钟',
    menu: [
      { id: 'm13', name: '蒸饺', price: 10, description: '一笼八个，鲜虾猪肉馅' },
      { id: 'm14', name: '拌面', price: 8, description: '花生酱拌面' },
      { id: 'm15', name: '馄饨汤', price: 12, description: '鲜肉馄饨配清汤' },
    ],
  },
  {
    id: '6',
    name: '铁板饭',
    category: '快餐',
    rating: 4.4,
    avgDeliveryTime: '12-15分钟',
    menu: [
      { id: 'm16', name: '黑椒牛柳铁板饭', price: 20, description: '嫩牛柳配黑椒汁' },
      { id: 'm17', name: '铁板鱿鱼饭', price: 18, description: '铁板鱿鱼配辣酱' },
      { id: 'm18', name: '铁板豆腐饭', price: 14, description: '铁板豆腐配酱汁' },
    ],
  },
]

interface OrderItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
}

interface Order {
  id: string
  items: OrderItem[]
  dormitory: string
  deliveryTime: string
  status: 'pending' | 'delivering' | 'delivered'
  deliveryPath?: { lat: number; lng: number; timestamp: string }[]
  createdAt: string
}

const orders: Order[] = [
  {
    id: 'ord-001',
    items: [
      { menuItemId: 'm1', name: '麻辣香锅（小份）', price: 22, quantity: 1 },
      { menuItemId: 'm3', name: '酸辣粉', price: 12, quantity: 1 },
    ],
    dormitory: '梅园3栋405',
    deliveryTime: '12:00-12:30',
    status: 'pending',
    createdAt: '2026-06-09T10:30:00Z',
  },
  {
    id: 'ord-002',
    items: [
      { menuItemId: 'm10', name: '叉烧饭', price: 18, quantity: 2 },
    ],
    dormitory: '竹园1栋201',
    deliveryTime: '12:00-12:30',
    status: 'pending',
    createdAt: '2026-06-09T10:35:00Z',
  },
  {
    id: 'ord-003',
    items: [
      { menuItemId: 'm7', name: '牛肉拉面（细）', price: 14, quantity: 1 },
      { menuItemId: 'm13', name: '蒸饺', price: 10, quantity: 1 },
    ],
    dormitory: '松园2栋308',
    deliveryTime: '11:30-12:00',
    status: 'delivering',
    deliveryPath: [
      { lat: 30.516, lng: 114.405, timestamp: '2026-06-09T11:35:00Z' },
      { lat: 30.518, lng: 114.408, timestamp: '2026-06-09T11:38:00Z' },
      { lat: 30.520, lng: 114.412, timestamp: '2026-06-09T11:42:00Z' },
    ],
    createdAt: '2026-06-09T10:20:00Z',
  },
]

interface RiderTask {
  id: string
  orderId: string
  stallName: string
  dormitory: string
  pickupLocation: string
  deliveryFee: number
  estimatedTime: string
  status: 'pending' | 'accepted'
}

const riderTasks: RiderTask[] = [
  {
    id: 'rt-001',
    orderId: 'ord-001',
    stallName: '麻辣香锅',
    dormitory: '梅园3栋405',
    pickupLocation: '第一食堂2楼3号窗口',
    deliveryFee: 3.5,
    estimatedTime: '15分钟',
    status: 'pending',
  },
  {
    id: 'rt-002',
    orderId: 'ord-002',
    stallName: '粤式烧腊',
    dormitory: '竹园1栋201',
    pickupLocation: '第二食堂1楼5号窗口',
    deliveryFee: 4.0,
    estimatedTime: '18分钟',
    status: 'pending',
  },
  {
    id: 'rt-003',
    orderId: 'ord-004',
    stallName: '黄焖鸡米饭',
    dormitory: '桃园4栋106',
    pickupLocation: '第一食堂1楼8号窗口',
    deliveryFee: 3.0,
    estimatedTime: '12分钟',
    status: 'pending',
  },
  {
    id: 'rt-004',
    orderId: 'ord-005',
    stallName: '铁板饭',
    dormitory: '梅园1栋502',
    pickupLocation: '第三食堂2楼1号窗口',
    deliveryFee: 3.5,
    estimatedTime: '14分钟',
    status: 'pending',
  },
]

let orderCounter = 3

router.get('/stalls', (_req: Request, res: Response) => {
  res.json({ success: true, data: stalls })
})

router.get('/stalls/:id', (req: Request, res: Response) => {
  const stall = stalls.find((s) => s.id === req.params.id)
  if (!stall) {
    res.status(404).json({ success: false, error: '档口不存在' })
    return
  }
  res.json({ success: true, data: stall })
})

router.post('/orders', (req: Request, res: Response) => {
  const { items, dormitory, deliveryTime } = req.body
  if (!items || !dormitory || !deliveryTime) {
    res.status(400).json({ success: false, error: '缺少必要参数' })
    return
  }
  orderCounter++
  const order: Order = {
    id: `ord-${String(orderCounter).padStart(3, '0')}`,
    items,
    dormitory,
    deliveryTime,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  orders.push(order)
  res.status(201).json({ success: true, data: order })
})

router.get('/orders/:id', (req: Request, res: Response) => {
  const order = orders.find((o) => o.id === req.params.id)
  if (!order) {
    res.status(404).json({ success: false, error: '订单不存在' })
    return
  }
  const result = { ...order }
  if (!result.deliveryPath) {
    result.deliveryPath = [
      { lat: 30.516, lng: 114.405, timestamp: new Date().toISOString() },
      { lat: 30.518, lng: 114.408, timestamp: new Date(Date.now() + 180000).toISOString() },
      { lat: 30.520, lng: 114.412, timestamp: new Date(Date.now() + 360000).toISOString() },
    ]
  }
  res.json({ success: true, data: result })
})

router.post('/orders/:id/deliver', (req: Request, res: Response) => {
  const order = orders.find((o) => o.id === req.params.id)
  if (!order) {
    res.status(404).json({ success: false, error: '订单不存在' })
    return
  }
  order.status = 'delivered'
  res.json({ success: true, data: order })
})

router.get('/rider/tasks', (_req: Request, res: Response) => {
  const pending = riderTasks.filter((t) => t.status === 'pending')
  res.json({ success: true, data: pending })
})

router.post('/rider/accept/:orderId', (req: Request, res: Response) => {
  const task = riderTasks.find((t) => t.orderId === req.params.orderId && t.status === 'pending')
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在或已被接单' })
    return
  }
  task.status = 'accepted'
  const order = orders.find((o) => o.id === task.orderId)
  if (order) {
    order.status = 'delivering'
  }
  res.json({ success: true, data: task })
})

export default router
