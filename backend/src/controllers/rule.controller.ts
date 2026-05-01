import { Request, Response } from 'express'
import { RuleService } from '../services/rule.service'
import { successResponse, errorResponse, paginatedResponse } from '../utils/response'
import { AuthenticatedRequest } from '../middleware/auth.middleware'
import { UserRole, RuleType, RuleStatus } from '../entities'

export class RuleController {
  static async createRule(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(errorResponse('未授权访问', 401))
      }

      const allowedRoles = [UserRole.MANAGER, UserRole.ADMIN]
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json(errorResponse('权限不足', 403))
      }

      const ruleService = RuleService.getInstance()
      const rule = await ruleService.createRule(req.body, req.user.userId)

      return res.json(successResponse(rule, '规则创建成功'))
    } catch (error: any) {
      return res.status(500).json(errorResponse(error.message || '创建规则失败', 500))
    }
  }

  static async getRule(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(errorResponse('未授权访问', 401))
      }

      const { ruleId } = req.params

      if (!ruleId) {
        return res.status(400).json(errorResponse('规则ID不能为空', 400))
      }

      const ruleService = RuleService.getInstance()
      const rule = await ruleService.getRuleById(ruleId)

      if (!rule) {
        return res.status(404).json(errorResponse('规则不存在', 404))
      }

      return res.json(successResponse(rule))
    } catch (error: any) {
      return res.status(500).json(errorResponse(error.message || '获取规则失败', 500))
    }
  }

  static async listRules(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(errorResponse('未授权访问', 401))
      }

      const page = parseInt(req.query.page as string) || 1
      const pageSize = parseInt(req.query.pageSize as string) || 20
      const type = req.query.type as RuleType
      const status = req.query.status as RuleStatus
      const keyword = req.query.keyword as string

      const ruleService = RuleService.getInstance()
      const result = await ruleService.listRules(
        { type, status, keyword },
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
      return res.status(500).json(errorResponse(error.message || '获取规则列表失败', 500))
    }
  }

  static async updateRule(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(errorResponse('未授权访问', 401))
      }

      const allowedRoles = [UserRole.MANAGER, UserRole.ADMIN]
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json(errorResponse('权限不足', 403))
      }

      const { ruleId } = req.params

      if (!ruleId) {
        return res.status(400).json(errorResponse('规则ID不能为空', 400))
      }

      const ruleService = RuleService.getInstance()
      const updatedRule = await ruleService.updateRule(ruleId, req.body, req.user.userId)

      if (!updatedRule) {
        return res.status(404).json(errorResponse('规则不存在', 404))
      }

      return res.json(successResponse(updatedRule, '规则更新成功'))
    } catch (error: any) {
      return res.status(500).json(errorResponse(error.message || '更新规则失败', 500))
    }
  }

  static async activateRule(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(errorResponse('未授权访问', 401))
      }

      const allowedRoles = [UserRole.MANAGER, UserRole.ADMIN]
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json(errorResponse('权限不足', 403))
      }

      const { ruleId } = req.params

      if (!ruleId) {
        return res.status(400).json(errorResponse('规则ID不能为空', 400))
      }

      const ruleService = RuleService.getInstance()
      const rule = await ruleService.activateRule(ruleId, req.user.userId)

      if (!rule) {
        return res.status(404).json(errorResponse('规则不存在', 404))
      }

      return res.json(successResponse(rule, '规则已激活'))
    } catch (error: any) {
      return res.status(500).json(errorResponse(error.message || '激活规则失败', 500))
    }
  }

  static async deactivateRule(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(errorResponse('未授权访问', 401))
      }

      const allowedRoles = [UserRole.MANAGER, UserRole.ADMIN]
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json(errorResponse('权限不足', 403))
      }

      const { ruleId } = req.params

      if (!ruleId) {
        return res.status(400).json(errorResponse('规则ID不能为空', 400))
      }

      const ruleService = RuleService.getInstance()
      const rule = await ruleService.deactivateRule(ruleId, req.user.userId)

      if (!rule) {
        return res.status(404).json(errorResponse('规则不存在', 404))
      }

      return res.json(successResponse(rule, '规则已停用'))
    } catch (error: any) {
      return res.status(500).json(errorResponse(error.message || '停用规则失败', 500))
    }
  }

  static async deleteRule(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(errorResponse('未授权访问', 401))
      }

      const allowedRoles = [UserRole.ADMIN]
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json(errorResponse('权限不足', 403))
      }

      const { ruleId } = req.params

      if (!ruleId) {
        return res.status(400).json(errorResponse('规则ID不能为空', 400))
      }

      const ruleService = RuleService.getInstance()
      const success = await ruleService.deleteRule(ruleId)

      if (!success) {
        return res.status(404).json(errorResponse('规则不存在或无法删除', 404))
      }

      return res.json(successResponse(null, '规则已删除'))
    } catch (error: any) {
      return res.status(500).json(errorResponse(error.message || '删除规则失败', 500))
    }
  }
}
