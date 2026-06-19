import { Router, type Request, type Response } from 'express'
import dayjs from 'dayjs'

const router = Router()

const mockOrders = [
  {
    id: 'ORD20240101001',
    orderNo: 'ORD20240101001',
    status: 'pending',
    statusText: '待回收',
    category: '手机',
    brand: '苹果',
    model: 'iPhone 14 Pro',
    condition: '95新',
    weight: 206,
    estimatedPrice: 5200,
    finalPrice: 0,
    address: {
      name: '张三',
      phone: '138****8888',
      province: '广东省',
      city: '深圳市',
      district: '南山区',
      detail: '科技园路1号',
    },
    createdAt: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
    updatedAt: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    id: 'ORD20240101002',
    orderNo: 'ORD20240101002',
    status: 'quality_checking',
    statusText: '质检中',
    category: '电脑',
    brand: '联想',
    model: 'ThinkPad X1 Carbon',
    condition: '9成新',
    weight: 1130,
    estimatedPrice: 6800,
    finalPrice: 0,
    address: {
      name: '李四',
      phone: '139****6666',
      province: '北京市',
      city: '北京市',
      district: '海淀区',
      detail: '中关村大街2号',
    },
    createdAt: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'),
    updatedAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    id: 'ORD20240101003',
    orderNo: 'ORD20240101003',
    status: 'completed',
    statusText: '已完成',
    category: '手机',
    brand: '华为',
    model: 'Mate 60 Pro',
    condition: '99新',
    weight: 225,
    estimatedPrice: 5800,
    finalPrice: 5900,
    address: {
      name: '王五',
      phone: '137****9999',
      province: '上海市',
      city: '上海市',
      district: '浦东新区',
      detail: '陆家嘴路3号',
    },
    createdAt: dayjs().subtract(10, 'day').format('YYYY-MM-DD HH:mm:ss'),
    updatedAt: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
  },
]

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { status, page = 1, pageSize = 10 } = req.query
  const pageNum = Number(page)
  const size = Number(pageSize)

  let filtered = mockOrders
  if (status) {
    filtered = mockOrders.filter((o) => o.status === status)
  }

  const start = (pageNum - 1) * size
  const list = filtered.slice(start, start + size)

  res.json({
    success: true,
    data: {
      list,
      total: filtered.length,
      page: pageNum,
      pageSize: size,
    },
  })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const order = mockOrders.find((o) => o.id === id) || mockOrders[0]

  res.json({
    success: true,
    data: {
      ...order,
      timeline: [
        {
          status: 'created',
          text: '订单创建',
          time: order.createdAt,
        },
        {
          status: 'picked',
          text: '快递已取件',
          time: dayjs(order.createdAt).add(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        },
        {
          status: 'quality_checking',
          text: '开始质检',
          time: dayjs(order.createdAt).add(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
        },
      ],
    },
  })
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { category, brand, model, condition, weight, estimatedPrice, address } = req.body

  const orderId = 'ORD' + dayjs().format('YYYYMMDDHHmmss')

  res.json({
    success: true,
    data: {
      id: orderId,
      orderNo: orderId,
      status: 'pending',
      statusText: '待回收',
      category,
      brand,
      model,
      condition,
      weight,
      estimatedPrice,
      finalPrice: 0,
      address,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    },
  })
})

router.put('/:id/status', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const { status } = req.body

  const statusMap: Record<string, string> = {
    pending: '待回收',
    picking: '取件中',
    quality_checking: '质检中',
    pricing: '定价中',
    to_pay: '待打款',
    completed: '已完成',
    cancelled: '已取消',
  }

  res.json({
    success: true,
    data: {
      id,
      status,
      statusText: statusMap[status] || status,
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    },
  })
})

export default router
