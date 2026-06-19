import type { Response } from 'express'
import { provincialPlatformService } from '../services/ProvincialPlatformService.js'
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse, paginatedResponse } from '../utils/response.js'
import type { AuthRequest } from '../middleware/auth.js'

export class ProvincialController {
  async syncToProvincial(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await provincialPlatformService.syncToProvincial()
      
      if (!result.success) {
        errorResponse(res, result.message || '同步失败')
        return
      }

      successResponse(res, result, result.message)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getProvincialSettlements(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1
      const pageSize = parseInt(req.query.pageSize as string) || 20
      const status = req.query.status as any

      const result = await provincialPlatformService.getProvincialSettlements(page, pageSize, status)
      paginatedResponse(res, result.records, result.total, page, pageSize)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getProvincialSettlementDetail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { batchId } = req.params
      
      const record = await provincialPlatformService.getProvincialSettlementById(batchId)
      
      if (!record) {
        notFoundResponse(res, '同步批次不存在')
        return
      }

      successResponse(res, record)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getSettlementDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { batchId } = req.params
      
      const details = await provincialPlatformService.getSettlementDetails(batchId)
      
      if (!details) {
        notFoundResponse(res, '同步批次不存在')
        return
      }

      successResponse(res, details)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async checkSyncStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { batchId } = req.params
      
      const status = await provincialPlatformService.checkSyncStatus(batchId)
      
      if (!status) {
        notFoundResponse(res, '同步批次不存在')
        return
      }

      successResponse(res, status)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getProvincialStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await provincialPlatformService.getProvincialStats()
      successResponse(res, stats)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getCrossCitySettlements(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1
      const pageSize = parseInt(req.query.pageSize as string) || 20

      const result = await provincialPlatformService.getCrossCitySettlements(page, pageSize)
      paginatedResponse(res, result.records, result.total, page, pageSize)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async confirmReceipt(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { batchId } = req.params
      
      const result = await provincialPlatformService.confirmReceipt(batchId)
      
      if (!result) {
        errorResponse(res, '确认失败，批次不存在或状态不正确')
        return
      }

      successResponse(res, null, '收款确认成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async testConnection(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await provincialPlatformService.testConnection()
      
      if (!result.success) {
        errorResponse(res, result.message)
        return
      }

      successResponse(res, result, result.message)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getConfig(req: AuthRequest, res: Response): Promise<void> {
    try {
      const config = provincialPlatformService.getConfig()
      const safeConfig = {
        ...config,
        publicKey: config.publicKey ? '***' : '',
      }
      successResponse(res, safeConfig)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async updateConfig(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { apiUrl, appId, cityCode, publicKey, enabled } = req.body
      
      provincialPlatformService.updateConfig({
        apiUrl,
        appId,
        cityCode,
        publicKey,
        enabled,
      })

      successResponse(res, null, '配置更新成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async generateProvincialReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const startDate = new Date(req.query.startDate as string)
      const endDate = new Date(req.query.endDate as string)

      if (!startDate || !endDate) {
        errorResponse(res, '请指定时间范围')
        return
      }

      const report = await provincialPlatformService.generateProvincialReport(startDate, endDate)
      successResponse(res, report)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async createSettlementRecord(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = req.body
      
      if (!data.batchId || !data.cityCode || !data.totalAmount || !data.subsidyAmount || !data.merchantCount || !data.status) {
        errorResponse(res, '缺少必要参数')
        return
      }

      const record = await provincialPlatformService.createProvincialSettlementRecord({
        ...data,
        syncTime: data.syncTime ? new Date(data.syncTime) : undefined,
        confirmTime: data.confirmTime ? new Date(data.confirmTime) : undefined,
        paidTime: data.paidTime ? new Date(data.paidTime) : undefined,
      })

      successResponse(res, record, '省级结算记录创建成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }
}

export const provincialController = new ProvincialController()
