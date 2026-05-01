import { Request, Response } from 'express'
import { ReconciliationService } from '../services/reconciliation.service'
import { successResponse, errorResponse, paginatedResponse } from '../utils/response'
import { AuthenticatedRequest } from '../middleware/auth.middleware'
import { UserRole } from '../entities'

export class ReconciliationController {
  static async executeReconciliation(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(errorResponse('未授权访问', 401))
      }

      const allowedRoles = [UserRole.FINANCE, UserRole.ADMIN]
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json(errorResponse('权限不足', 403))
      }

      const { date } = req.body
      const targetDate = date ? new Date(date) : new Date()

      const reconciliationService = ReconciliationService.getInstance()
      const result = await reconciliationService.executeDailyReconciliation(targetDate)

      return res.json(successResponse(result, '日结对账完成'))
    } catch (error: any) {
      return res.status(500).json(errorResponse(error.message || '日结对账失败', 500))
    }
  }

  static async getReconciliation(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(errorResponse('未授权访问', 401))
      }

      const allowedRoles = [UserRole.FINANCE, UserRole.MANAGER, UserRole.ADMIN]
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json(errorResponse('权限不足', 403))
      }

      const { date } = req.query

      if (!date) {
        return res.status(400).json(errorResponse('日期参数不能为空', 400))
      }

      const targetDate = new Date(date as string)

      const reconciliationService = ReconciliationService.getInstance()
      const reconciliation = await reconciliationService.getReconciliationByDate(targetDate)

      if (!reconciliation) {
        return res.status(404).json(errorResponse('对账单不存在', 404))
      }

      return res.json(successResponse(reconciliation))
    } catch (error: any) {
      return res.status(500).json(errorResponse(error.message || '获取对账单失败', 500))
    }
  }

  static async listReconciliations(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(errorResponse('未授权访问', 401))
      }

      const allowedRoles = [UserRole.FINANCE, UserRole.MANAGER, UserRole.ADMIN]
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json(errorResponse('权限不足', 403))
      }

      const page = parseInt(req.query.page as string) || 1
      const pageSize = parseInt(req.query.pageSize as string) || 20

      const reconciliationService = ReconciliationService.getInstance()
      const result = await reconciliationService.listReconciliations(page, pageSize)

      return res.json(paginatedResponse(
        result.items,
        result.total,
        result.page,
        result.pageSize
      ))
    } catch (error: any) {
      return res.status(500).json(errorResponse(error.message || '获取对账单列表失败', 500))
    }
  }
}
