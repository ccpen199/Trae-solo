import type { Response } from 'express'
import { riskControlService } from '../services/RiskControlService.js'
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse, paginatedResponse } from '../utils/response.js'
import type { AuthRequest } from '../middleware/auth.js'
import type { RiskEventType, RiskLevel, RiskStatus } from '../../../shared/types/index.js'

export class RiskController {
  async getEvents(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1
      const pageSize = parseInt(req.query.pageSize as string) || 20
      const type = req.query.type as RiskEventType | undefined
      const level = req.query.level as RiskLevel | undefined
      const status = req.query.status as RiskStatus | undefined

      const result = await riskControlService.getEvents(page, pageSize, type, level, status)
      paginatedResponse(res, result.events, result.total, page, pageSize)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getEventDetail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      
      const event = await riskControlService.getEventById(id)
      
      if (!event) {
        notFoundResponse(res, '风险事件不存在')
        return
      }

      successResponse(res, event)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async resolveEvent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const { action, handlerNotes } = req.body
      const handlerId = req.user?.id || 'system'

      if (!action || !['resolve', 'ignore'].includes(action)) {
        errorResponse(res, '无效的处理动作')
        return
      }

      const result = await riskControlService.resolveEvent(
        id,
        handlerId,
        handlerNotes || '',
        action as 'resolve' | 'ignore',
      )
      
      if (!result) {
        notFoundResponse(res, '风险事件不存在')
        return
      }

      successResponse(res, result, '处理成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async updateEventStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const { status } = req.body

      if (!status) {
        errorResponse(res, '状态不能为空')
        return
      }

      const result = await riskControlService.updateEventStatus(id, status as RiskStatus)
      
      if (!result) {
        notFoundResponse(res, '风险事件不存在')
        return
      }

      successResponse(res, result, '状态更新成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async runRiskScan(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await riskControlService.runRiskScan()
      successResponse(res, result, `风险扫描完成，检测到${result.detected}个风险事件`)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async detectMultiAccount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { deviceId, userId, idCard, phone, ipAddress } = req.body

      if (!deviceId || !userId || !idCard || !phone) {
        errorResponse(res, '缺少必要参数')
        return
      }

      const result = await riskControlService.detectMultiAccount({
        deviceId,
        userId,
        idCard,
        phone,
        ipAddress,
      })

      if (result) {
        successResponse(res, result, '检测到多账号关联风险')
      } else {
        successResponse(res, null, '未检测到风险')
      }
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async detectBulkHoarding(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId, activityId, couponCount, timeWindowMinutes } = req.body

      if (!userId || !activityId || couponCount === undefined) {
        errorResponse(res, '缺少必要参数')
        return
      }

      const result = await riskControlService.detectBulkHoarding({
        userId,
        activityId,
        couponCount,
        timeWindowMinutes,
      })

      if (result) {
        successResponse(res, result, '检测到批量囤积风险')
      } else {
        successResponse(res, null, '未检测到风险')
      }
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async detectAbnormalPath(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId, locations, timeWindowMinutes } = req.body

      if (!userId || !Array.isArray(locations) || locations.length < 2) {
        errorResponse(res, '缺少必要参数或位置点不足')
        return
      }

      const processedLocations = locations.map(loc => ({
        ...loc,
        timestamp: new Date(loc.timestamp),
      }))

      const result = await riskControlService.detectAbnormalPath({
        userId,
        locations: processedLocations,
        timeWindowMinutes,
      })

      if (result) {
        successResponse(res, result, '检测到异常路径风险')
      } else {
        successResponse(res, null, '未检测到风险')
      }
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getRiskStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await riskControlService.getRiskStats()
      successResponse(res, stats)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async createManualEvent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { type, level, evidence, userId, deviceId, relatedAccounts } = req.body

      if (!type || !level || !evidence) {
        errorResponse(res, '缺少必要参数')
        return
      }

      const event = await riskControlService.createManualEvent(
        type as RiskEventType,
        level as RiskLevel,
        evidence,
        userId,
        deviceId,
        relatedAccounts,
      )

      successResponse(res, event, '风险事件创建成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }
}

export const riskController = new RiskController()
