import { Request, Response } from 'express'
import { PointsService } from '../services/points.service'
import { UserService } from '../services/user.service'
import { successResponse, errorResponse, paginatedResponse } from '../utils/response'
import { AuthenticatedRequest } from '../middleware/auth.middleware'
import { UserRole, TransactionType, EventType } from '../entities'

export class PointsController {
  static async getPointsInfo(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(errorResponse('未授权访问', 401))
      }

      const userService = UserService.getInstance()
      const member = await userService.getMemberByUserId(req.user.userId)

      if (!member) {
        return res.status(404).json(errorResponse('会员信息不存在', 404))
      }

      const pointsService = PointsService.getInstance()
      const info = await pointsService.getPointsInfo(member.id)

      if (!info) {
        return res.status(404).json(errorResponse('积分账户不存在', 404))
      }

      return res.json(successResponse(info))
    } catch (error: any) {
      return res.status(500).json(errorResponse(error.message || '获取积分信息失败', 500))
    }
  }

  static async getTransactions(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(errorResponse('未授权访问', 401))
      }

      const userService = UserService.getInstance()
      const member = await userService.getMemberByUserId(req.user.userId)

      if (!member) {
        return res.status(404).json(errorResponse('会员信息不存在', 404))
      }

      const page = parseInt(req.query.page as string) || 1
      const pageSize = parseInt(req.query.pageSize as string) || 20
      const type = req.query.type as TransactionType
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined

      const pointsService = PointsService.getInstance()
      const result = await pointsService.getTransactions(
        member.id,
        page,
        pageSize,
        { type, startDate, endDate }
      )

      return res.json(paginatedResponse(
        result.items,
        result.total,
        result.page,
        result.pageSize
      ))
    } catch (error: any) {
      return res.status(500).json(errorResponse(error.message || '获取流水失败', 500))
    }
  }

  static async awardPoints(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(errorResponse('未授权访问', 401))
      }

      const allowedRoles = [UserRole.MANAGER, UserRole.EMPLOYEE, UserRole.ADMIN]
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json(errorResponse('权限不足', 403))
      }

      const { memberId, points, businessType, businessNo, description, expiryDate } = req.body

      if (!memberId || !points || !businessType) {
        return res.status(400).json(errorResponse('memberId、points、businessType不能为空', 400))
      }

      if (points <= 0) {
        return res.status(400).json(errorResponse('积分数量必须大于0', 400))
      }

      const pointsService = PointsService.getInstance()
      const result = await pointsService.awardPoints(
        memberId,
        points,
        businessType,
        businessNo || `MANUAL-${Date.now()}`,
        description,
        req.user.userId,
        expiryDate ? new Date(expiryDate) : undefined
      )

      if (!result.success) {
        return res.status(400).json(errorResponse(result.message || '积分发放失败', 400))
      }

      return res.json(successResponse(result, '积分发放成功'))
    } catch (error: any) {
      return res.status(500).json(errorResponse(error.message || '积分发放失败', 500))
    }
  }

  static async triggerEvent(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(errorResponse('未授权访问', 401))
      }

      const { eventType, eventData, businessNo } = req.body

      if (!eventType || !eventData) {
        return res.status(400).json(errorResponse('eventType和eventData不能为空', 400))
      }

      let memberId: string

      if (req.user.role === UserRole.MEMBER) {
        const userService = UserService.getInstance()
        const member = await userService.getMemberByUserId(req.user.userId)
        if (!member) {
          return res.status(404).json(errorResponse('会员信息不存在', 404))
        }
        memberId = member.id
      } else {
        if (!eventData.memberId) {
          return res.status(400).json(errorResponse('需要指定memberId', 400))
        }
        memberId = eventData.memberId
      }

      const pointsService = PointsService.getInstance()
      const result = await pointsService.processBusinessEvent(
        eventType as EventType,
        memberId,
        eventData,
        businessNo
      )

      return res.json(successResponse(result, '事件处理完成'))
    } catch (error: any) {
      return res.status(500).json(errorResponse(error.message || '事件处理失败', 500))
    }
  }

  static async checkIn(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(errorResponse('未授权访问', 401))
      }

      if (req.user.role !== UserRole.MEMBER) {
        return res.status(403).json(errorResponse('只有会员可以签到', 403))
      }

      const userService = UserService.getInstance()
      const member = await userService.getMemberByUserId(req.user.userId)

      if (!member) {
        return res.status(404).json(errorResponse('会员信息不存在', 404))
      }

      const pointsService = PointsService.getInstance()
      const result = await pointsService.processBusinessEvent(
        EventType.CHECK_IN,
        member.id,
        { memberId: member.id },
        `CHECKIN-${Date.now()}`
      )

      if (result.totalPoints > 0) {
        return res.json(successResponse({
          points: result.totalPoints,
          message: `签到成功，获得 ${result.totalPoints} 积分`,
        }, '签到成功'))
      }

      return res.json(successResponse({
        points: 0,
        message: '今日已签到',
      }, '签到完成'))
    } catch (error: any) {
      return res.status(500).json(errorResponse(error.message || '签到失败', 500))
    }
  }
}
