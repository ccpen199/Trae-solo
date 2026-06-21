import { Router, type Request, type Response } from 'express'
import { products, mallOrders } from '../data/mockData.js'

const router = Router()

router.get('/products', async (req: Request, res: Response): Promise<void> => {
  const category = req.query.category as string
  const type = req.query.type as string
  let filteredProducts = products

  if (category) {
    filteredProducts = filteredProducts.filter((p) => p.category === category)
  }
  if (type) {
    filteredProducts = filteredProducts.filter((p) => p.type === type)
  }

  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 10
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginatedProducts = filteredProducts.slice(start, end)

  res.json({
    success: true,
    data: {
      list: paginatedProducts,
      total: filteredProducts.length,
      page,
      pageSize,
    },
    message: '获取商品列表成功',
  })
})

router.get('/orders', async (req: Request, res: Response): Promise<void> => {
  const status = req.query.status as string
  const fulfillmentType = req.query.fulfillmentType as string
  let filteredOrders = mallOrders

  if (status) {
    filteredOrders = filteredOrders.filter((order) => order.status === status)
  }
  if (fulfillmentType) {
    filteredOrders = filteredOrders.filter((order) => order.fulfillmentType === fulfillmentType)
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
    message: '获取商城订单列表成功',
  })
})

export default router
