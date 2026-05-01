import { Request, Response } from 'express'
import { ExchangeService } from '../services/exchange.service'
import { UserService } from '../services/user.service'
import { successResponse, errorResponse, paginatedResponse } from '../utils/response'
import { AuthenticatedRequest } from '../middleware/auth.middleware'
import { UserRole, ExchangeType, ExchangeOrderStatus } from '../entities'
import { ExchangeItem } from '../engines/exchange-gate/types'

export class ExchangeController {
  static async createExchange(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(errorResponse('未授权访问', 401))
      }

      const { itemId, itemName, itemType, pointsPerUnit, quantity, businessNo } = req.body

      if (!itemId || !itemName || !itemType || pointsPerUnit === undefined || !quantity) {
        return res.status(400).json(errorResponse('缺少必要参数', 400))
      }

      const userService = UserService.getInstance()
      const member = await userService.getMemberByUserId(req.user.userId)

      if (!member) {
        return res.status(404).json(errorResponse('会员信息不存在', 404))
      }

      const item: ExchangeItem = {
        itemId,
        itemName,
        itemType: itemType as ExchangeType,
        pointsPerUnit: Number(pointsPerUnit),
        quantity: Number(quantity),
      }

      const exchangeService = ExchangeService.getInstance()
      const result = await exchangeService.createExchange(
        member.id,
        item,
        businessNo,
        req.user.userId
      )

      if (!result.success) {
        return res.status(400).json(errorResponse(result.errorMessage || '兑换失败', 400))
      }

      return res.json(successResponse({
        orderId: result.orderId,
        orderNo: result.orderNo,
        frozenPoints: result.frozenPoints,
        freezeExpiresAt: result.freezeExpiresAt,
      }, '兑换订单创建成功，积分已冻结'))
    } catch (error: any) {
      return res.status(500).json(errorResponse(error.message || '兑换失败', 500))
    }
  }

  static async confirmExchange(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(errorResponse('未授权访问', 401))
      }

      const allowedRoles = [UserRole.MANAGER, UserRole.EMPLOYEE, UserRole.ADMIN]
      if (!allowedRoles.includes(req.user.role) && req.user.role !== UserRole.MEMBER) {
        return res.status(403).json(errorResponse('权限不足', 403))
      }

      const { orderId } = req.params

      if (!orderId) {
        return res.status(400).json(errorResponse('订单ID不能为空', 400))
      }

      const exchangeService = ExchangeService.getInstance()
      const order = await exchangeService.getOrderById(orderId)

      if (!order) {
        return res.status(404).json(errorResponse('订单不存在', 404))
      }

      if (req.user.role === UserRole.MEMBER) {
        const userService = UserService.getInstance()
        const member = await userService.getMemberByUserId(req.user.userId)
        if (!member || member.id !== order.memberId) {
          return res.status(403).json(errorResponse('无权操作此订单', 403))
        }
      }

      const result = await exchangeService.confirmExchange(orderId, req.user.userId)

      if (!result.success) {
        return res.status(400).json(errorResponse(result.errorMessage || '确认兑换失败', 400))
      }

      return res.json(successResponse({
        orderId: result.orderId,
        orderNo: result.orderNo,
        deductedPoints: result.deductedPoints,
      }, '兑换确认成功，积分已扣减'))
    } catch (error: any) {
      return res.status(500).json(errorResponse(error.message || '确认兑换失败', 500))
    }
  }

  static async cancelExchange(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(errorResponse('未授权访问', 401))
      }

      const { orderId } = req.params
      const { reason } = req.body

      if (!orderId) {
        return res.status(400).json(errorResponse('订单ID不能为空', 400))
      }

      const exchangeService = ExchangeService.getInstance()
      const order = await exchangeService.getOrderById(orderId)

      if (!order) {
        return res.status(404).json(errorResponse('订单不存在', 404))
      }

      if (req.user.role === UserRole.MEMBER) {
        const userService = UserService.getInstance()
        const member = await userService.getMemberByUserId(req.user.userId)
        if (!member || member.id !== order.memberId) {
          return res.status(403).json(errorResponse('无权操作此订单', 403))
        }
      }

      const result = await exchangeService.cancelExchange(orderId, reason, req.user.userId)

      if (!result.success) {
        return res.status(400).json(errorResponse(result.errorMessage || '取消兑换失败', 400))
      }

      return res.json(successResponse({
        orderId: result.orderId,
        orderNo: result.orderNo,
        rolledbackPoints: result.rolledbackPoints,
      }, '兑换已取消，积分已退回'))
    } catch (error: any) {
      return res.status(500).json(errorResponse(error.message || '取消兑换失败', 500))
    }
  }

  static async getOrder(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(errorResponse('未授权访问', 401))
      }

      const { orderId } = req.params

      if (!orderId) {
        return res.status(400).json(errorResponse('订单ID不能为空', 400))
      }

      const exchangeService = ExchangeService.getInstance()
      const order = await exchangeService.getOrderById(orderId)

      if (!order) {
        return res.status(404).json(errorResponse('订单不存在', 404))
      }

      if (req.user.role === UserRole.MEMBER) {
        const userService = UserService.getInstance()
        const member = await userService.getMemberByUserId(req.user.userId)
        if (!member || member.id !== order.memberId) {
          return res.status(403).json(errorResponse('无权查看此订单', 403))
        }
      }

      return res.json(successResponse(order))
    } catch (error: any) {
      return res.status(500).json(errorResponse(error.message || '获取订单失败', 500))
    }
  }

  static async listOrders(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(errorResponse('未授权访问', 401))
      }

      const page = parseInt(req.query.page as string) || 1
      const pageSize = parseInt(req.query.pageSize as string) || 20
      const status = req.query.status as ExchangeOrderStatus
      const exchangeType = req.query.exchangeType as ExchangeType
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined

      let memberId: string | undefined

      if (req.user.role === UserRole.MEMBER) {
        const userService = UserService.getInstance()
        const member = await userService.getMemberByUserId(req.user.userId)
        if (!member) {
          return res.status(404).json(errorResponse('会员信息不存在', 404))
        }
        memberId = member.id
      }

      const exchangeService = ExchangeService.getInstance()
      const result = await exchangeService.listOrders(
        { memberId, status, exchangeType, startDate, endDate },
        page,
        pageSize
      )

      return res.json(paginatedResponse(
        result.items,
        result.total,
        result.page,
        result.pageSize
      ))
    } catch (error: any) {
      return res.status(500).json(errorResponse(error.message || '获取订单列表失败', 500))
    }
  }
}
