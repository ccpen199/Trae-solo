import type { Response } from 'express'
import { alertService } from '../services/AlertService.js'
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse, paginatedResponse } from '../utils/response.js'
import type { AuthRequest } from '../middleware/auth.js'
import type { AlertType, AlertLevel } from '../../../shared/types/index.js'

export class AlertController {
  async getAlerts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1
      const pageSize = parseInt(req.query.pageSize as string) || 20
      const type = req.query.type as AlertType | undefined
      const level = req.query.level as AlertLevel | undefined
      const read = req.query.read !== undefined ? req.query.read === 'true' : undefined
      const merchantId = req.query.merchantId as string | undefined

      const result = await alertService.getAlerts(page, pageSize, type, level, read, merchantId)
      paginatedResponse(res, result.alerts, result.total, page, pageSize)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getAlertDetail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      
      const alert = await alertService.getAlertById(id)
      
      if (!alert) {
        notFoundResponse(res, '预警不存在')
        return
      }

      successResponse(res, alert)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      
      const result = await alertService.markAsRead(id)
      
      if (!result) {
        notFoundResponse(res, '预警不存在')
        return
      }

      successResponse(res, result, '已标记为已读')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.body.merchantId as string | undefined
      
      const count = await alertService.markAllAsRead(merchantId)
      successResponse(res, { marked: count }, `已标记${count}条预警为已读`)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.query.merchantId as string | undefined
      
      const count = await alertService.getUnreadCount(merchantId)
      successResponse(res, { count })
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async deleteAlert(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      
      const result = await alertService.deleteAlert(id)
      
      if (!result) {
        notFoundResponse(res, '预警不存在')
        return
      }

      successResponse(res, null, '删除成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async runAlertChecks(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await alertService.runAlertChecks()
      successResponse(res, {
        inventoryAlerts: result.inventoryAlerts.length,
        verificationAlerts: result.verificationAlerts.length,
        systemAlerts: result.systemAlerts.length,
        total: result.inventoryAlerts.length + result.verificationAlerts.length + result.systemAlerts.length,
      }, `预警检查完成，新增${result.inventoryAlerts.length + result.verificationAlerts.length + result.systemAlerts.length}条预警`)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async checkInventoryAlerts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const threshold = parseInt(req.query.threshold as string) || 100
      
      const alerts = await alertService.checkInventoryAlerts(threshold)
      successResponse(res, { alerts, count: alerts.length })
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getAlertStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await alertService.getAlertStats()
      successResponse(res, stats)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async createAlert(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { type, level, title, message, relatedId, merchantId } = req.body

      if (!type || !level || !title || !message) {
        errorResponse(res, '缺少必要参数')
        return
      }

      const alert = await alertService.createAlert(
        type as AlertType,
        level as AlertLevel,
        title,
        message,
        relatedId,
        merchantId,
      )

      successResponse(res, alert, '预警创建成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async clearOldAlerts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const daysOld = parseInt(req.body.daysOld as string) || 30
      
      const count = await alertService.deleteOldAlerts(daysOld)
      successResponse(res, { deleted: count }, `已删除${count}条超过${daysOld}天的预警`)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }
}

export const alertController = new AlertController()
