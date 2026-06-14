import type { Response } from 'express'
import paymentService from '../services/PaymentService.js'
import type { RequestWithUser } from '../types/index.js'

class PaymentController {
  listOrders(req: RequestWithUser, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '请先登录',
        })
        return
      }

      const page = parseInt(req.query.page as string) || 1
      const pageSize = parseInt(req.query.pageSize as string) || 10

      const result = paymentService.getOrderList(req.user.id, { page, pageSize })

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: {
          list: result.items,
          items: result.items,
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
        message: '获取订单列表成功',
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取订单列表失败',
      })
    }
  }

  createOrder(req: RequestWithUser, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '请先登录',
        })
        return
      }

      const { insuranceType, payYear, payGrade, channel } = req.body

      if (!insuranceType || !payYear || !payGrade || !channel) {
        res.status(400).json({
          success: false,
          error: '缺少必要参数',
        })
        return
      }

      const result = paymentService.createOrder(req.user.id, {
        insuranceType,
        payYear,
        payGrade,
        channel,
      })

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: {
          order: result.order,
        },
        message: '订单创建成功',
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '订单创建失败',
      })
    }
  }

  async payOrder(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '请先登录',
        })
        return
      }

      const orderId = parseInt(req.params.id)

      if (isNaN(orderId)) {
        res.status(400).json({
          success: false,
          error: '订单ID无效',
        })
        return
      }

      const result = await paymentService.payOrder(req.user.id, orderId)

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: {
          order: result.order,
          transactionId: result.order ? `TX${result.order.orderNo}` : '',
        },
        message: '支付成功',
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '支付失败',
      })
    }
  }

  getStatus(req: RequestWithUser, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '请先登录',
        })
        return
      }

      const orderId = parseInt(req.params.id)

      if (isNaN(orderId)) {
        res.status(400).json({
          success: false,
          error: '订单ID无效',
        })
        return
      }

      const result = paymentService.getOrderStatus(req.user.id, orderId)

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: {
          order: result.order,
          status: result.order?.status,
        },
        message: '获取订单状态成功',
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取订单状态失败',
      })
    }
  }
}

const paymentController = new PaymentController()

export default paymentController
export { PaymentController }
