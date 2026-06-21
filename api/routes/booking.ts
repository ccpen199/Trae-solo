import { Router, type Request, type Response } from 'express'
import { bookingOrders, type BookingOrder } from '../data/mockData.js'

const router = Router()

let orders = [...bookingOrders]

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const status = req.query.status as string
  const storeId = req.query.storeId as string
  let filteredOrders = orders

  if (status) {
    filteredOrders = filteredOrders.filter((order) => order.status === status)
  }
  if (storeId) {
    filteredOrders = filteredOrders.filter((order) => order.storeId === storeId)
  }

  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 10
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginatedOrders = filteredOrders.slice(start, end)

  res.json({
    success: true,
    data: {
      list: paginatedOrders,
      total: filteredOrders.length,
      page,
      pageSize,
    },
    message: '获取订座订单列表成功',
  })
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { userId, userName, storeId, storeName, seatId, seatNumber, startTime, endTime, duration, totalAmount } = req.body

  const newOrder: BookingOrder = {
    id: `order-bk-${String(orders.length + 1).padStart(3, '0')}`,
    userId,
    userName,
    storeId,
    storeName,
    seatId,
    seatNumber,
    startTime,
    endTime,
    duration,
    totalAmount,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  orders.unshift(newOrder)

  res.json({
    success: true,
    data: newOrder,
    message: '创建订座订单成功',
  })
})

router.put('/:id/status', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const { status } = req.body

  const orderIndex = orders.findIndex((order) => order.id === id)
  if (orderIndex === -1) {
    res.status(404).json({
      success: false,
      data: null,
      message: '订单不存在',
    })
    return
  }

  orders[orderIndex] = {
    ...orders[orderIndex],
    status,
  }

  res.json({
    success: true,
    data: orders[orderIndex],
    message: '更新订单状态成功',
  })
})

export default router
