import { Router, type Request, type Response } from 'express'
import dayjs from 'dayjs'

const router = Router()

const mockCouriers = [
  {
    id: 'C001',
    name: '张三',
    phone: '138****1111',
    area: '南山区',
    status: 'idle',
    statusText: '空闲',
    todayOrders: 5,
    completedOrders: 3,
    rating: 4.9,
    avatar: '🚚',
  },
  {
    id: 'C002',
    name: '李四',
    phone: '139****2222',
    area: '福田区',
    status: 'busy',
    statusText: '配送中',
    todayOrders: 8,
    completedOrders: 5,
    rating: 4.8,
    avatar: '🚛',
  },
  {
    id: 'C003',
    name: '王五',
    phone: '137****3333',
    area: '宝安区',
    status: 'idle',
    statusText: '空闲',
    todayOrders: 3,
    completedOrders: 3,
    rating: 4.7,
    avatar: '🚐',
  },
]

router.get('/couriers', async (req: Request, res: Response): Promise<void> => {
  const { status, area } = req.query

  let filtered = mockCouriers
  if (status) filtered = filtered.filter((c) => c.status === status)
  if (area) filtered = filtered.filter((c) => c.area === area)

  res.json({
    success: true,
    data: filtered,
  })
})

router.post('/couriers/:id/assign', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const { orderId } = req.body
  const courier = mockCouriers.find((c) => c.id === id) || mockCouriers[0]

  res.json({
    success: true,
    data: {
      assignId: 'ASN' + dayjs().format('YYYYMMDDHHmmss'),
      courierId: id,
      courierName: courier.name,
      orderId: orderId || 'ORD20240101001',
      status: 'assigned',
      assignedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      estimatedPickupTime: dayjs().add(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    },
  })
})

router.get('/logistics/:orderId/track', async (req: Request, res: Response): Promise<void> => {
  const { orderId } = req.params

  res.json({
    success: true,
    data: {
      orderId,
      courier: {
        name: '张三',
        phone: '138****1111',
      },
      currentStatus: 'in_transit',
      currentStatusText: '运输中',
      estimatedDelivery: dayjs().add(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
      tracking: [
        {
          status: 'created',
          text: '订单已创建，等待取件',
          time: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
          location: '系统',
        },
        {
          status: 'picked',
          text: '快递员已取件',
          time: dayjs().subtract(2, 'day').add(3, 'hour').format('YYYY-MM-DD HH:mm:ss'),
          location: '深圳市南山区科技园',
        },
        {
          status: 'in_transit',
          text: '快件已到达【深圳转运中心】',
          time: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
          location: '深圳市宝安区转运中心',
        },
        {
          status: 'in_transit',
          text: '快件正在运输中',
          time: dayjs().subtract(12, 'hour').format('YYYY-MM-DD HH:mm:ss'),
          location: '运输途中',
        },
      ],
    },
  })
})

export default router
