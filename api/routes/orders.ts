import { Router, type Request, type Response } from 'express'
import type { OrderStatus, ApiResponse } from '../../shared/types/index.js'
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  smartDispatch,
  getExceptionOrders,
  getOrdersByStatus,
  type CreateOrderParams,
} from '../services/orderService.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const status = req.query.status as OrderStatus | undefined

    let orders
    if (status) {
      orders = getOrdersByStatus(status)
    } else {
      const offset = (page - 1) * limit
      orders = getAllOrders(limit, offset)
    }

    const response: ApiResponse = {
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total: orders.length,
        },
      },
    }
    res.status(200).json(response)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch orders',
    })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const params = req.body as CreateOrderParams
    const order = createOrder(params)

    const response: ApiResponse = {
      success: true,
      data: order,
      message: 'Order created successfully',
    }
    res.status(201).json(response)
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order',
    })
  }
})

router.get('/aggregate', async (req: Request, res: Response): Promise<void> => {
  try {
    const lat = parseFloat(req.query.lat as string) || 31.2304
    const lng = parseFloat(req.query.lng as string) || 121.4737
    const radius = parseFloat(req.query.radius as string) || 3

    const plans = smartDispatch(lat, lng, radius)

    const response: ApiResponse = {
      success: true,
      data: plans,
    }
    res.status(200).json(response)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to aggregate orders',
    })
  }
})

router.get('/abnormal', async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = getExceptionOrders()

    const response: ApiResponse = {
      success: true,
      data: orders,
    }
    res.status(200).json(response)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch abnormal orders',
    })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const order = getOrderById(id)

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
      })
      return
    }

    const response: ApiResponse = {
      success: true,
      data: order,
    }
    res.status(200).json(response)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch order',
    })
  }
})

router.put('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { status } = req.body as { status: OrderStatus }

    if (!status) {
      res.status(400).json({
        success: false,
        error: 'Status is required',
      })
      return
    }

    const updatedOrder = updateOrderStatus(id, status)

    if (!updatedOrder) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
      })
      return
    }

    const response: ApiResponse = {
      success: true,
      data: updatedOrder,
      message: 'Order status updated successfully',
    }
    res.status(200).json(response)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update order status',
    })
  }
})

export default router
