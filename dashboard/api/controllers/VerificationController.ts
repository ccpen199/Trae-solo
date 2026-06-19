import type { Response } from 'express'
import { verificationService } from '../services/VerificationService.js'
import { reconciliationService } from '../services/ReconciliationService.js'
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse, paginatedResponse } from '../utils/response.js'
import type { AuthRequest } from '../middleware/auth.js'
import type { VerificationStatus, TerminalType } from '../../../shared/types/index.js'

export class VerificationController {
  async verify(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { couponCode, merchantId, terminalType, originalAmount, storeId, terminalId, location, orderNo } = req.body

      if (!couponCode || !merchantId || !terminalType || originalAmount === undefined) {
        errorResponse(res, '缺少必要参数')
        return
      }

      const result = await verificationService.verify({
        couponCode,
        merchantId,
        storeId,
        terminalId,
        terminalType: terminalType as TerminalType,
        originalAmount,
        location,
        orderNo,
      })

      if (!result.success) {
        errorResponse(res, result.error || '核销失败')
        return
      }

      successResponse(res, result.record, '核销成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async reverse(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params

      const result = await verificationService.reverseVerification(id)
      
      if (!result.success) {
        errorResponse(res, result.error || '撤销失败')
        return
      }

      successResponse(res, result.record, '撤销成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getRecords(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1
      const pageSize = parseInt(req.query.pageSize as string) || 20
      const merchantId = req.query.merchantId as string | undefined
      const status = req.query.status as VerificationStatus | undefined
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined

      const result = await verificationService.getRecords(page, pageSize, merchantId, startDate, endDate, status)
      paginatedResponse(res, result.records, result.total, page, pageSize)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getRecordDetail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      
      const record = await verificationService.getRecordById(id)
      
      if (!record) {
        notFoundResponse(res, '核销记录不存在')
        return
      }

      successResponse(res, record)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getReconciliationData(req: AuthRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.query.merchantId as string
      const startDate = new Date(req.query.startDate as string)
      const endDate = new Date(req.query.endDate as string)

      if (!merchantId || !startDate || !endDate) {
        errorResponse(res, '缺少必要参数')
        return
      }

      const data = await verificationService.getReconciliationData(merchantId, startDate, endDate)
      successResponse(res, data)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async submitSettlement(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { merchantId, periodStart, periodEnd } = req.body

      if (!merchantId || !periodStart || !periodEnd) {
        errorResponse(res, '缺少必要参数')
        return
      }

      const settlement = await reconciliationService.createSettlementApplication({
        merchantId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
      })

      if (!settlement) {
        errorResponse(res, '该时间段没有可结算的记录')
        return
      }

      successResponse(res, settlement, '结算申请提交成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getSettlementList(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1
      const pageSize = parseInt(req.query.pageSize as string) || 20
      const merchantId = req.query.merchantId as string | undefined
      const status = req.query.status as string | undefined

      const result = await reconciliationService.getSettlementList(page, pageSize, merchantId, status as any)
      paginatedResponse(res, result.settlements, result.total, page, pageSize)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getSettlementDetail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      
      const settlement = await reconciliationService.getSettlementById(id)
      
      if (!settlement) {
        notFoundResponse(res, '结算记录不存在')
        return
      }

      successResponse(res, settlement)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async approveSettlement(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      
      const result = await reconciliationService.approveSettlement(id)
      
      if (!result) {
        notFoundResponse(res, '结算记录不存在')
        return
      }

      successResponse(res, result, '结算已批准')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async rejectSettlement(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      
      const result = await reconciliationService.rejectSettlement(id)
      
      if (!result) {
        notFoundResponse(res, '结算记录不存在')
        return
      }

      successResponse(res, result, '结算已驳回')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getVerificationTrend(req: AuthRequest, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30
      
      const data = await verificationService.getVerificationTrend(days)
      successResponse(res, data)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getTodayStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.query.merchantId as string | undefined
      
      const stats = await verificationService.getTodayStats(merchantId)
      successResponse(res, stats)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getMerchantStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { merchantId } = req.params
      
      if (!merchantId) {
        errorResponse(res, '商户ID不能为空')
        return
      }

      const stats = await verificationService.getMerchantStats(merchantId)
      successResponse(res, stats)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getSettlementSummary(req: AuthRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.query.merchantId as string
      
      if (!merchantId) {
        errorResponse(res, '商户ID不能为空')
        return
      }

      const summary = await reconciliationService.getSettlementSummary(merchantId)
      successResponse(res, summary)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getReconciliationStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await reconciliationService.getReconciliationStats()
      successResponse(res, stats)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }
}

export const verificationController = new VerificationController()
