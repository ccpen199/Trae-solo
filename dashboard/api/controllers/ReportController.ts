import type { Response } from 'express'
import { reportService } from '../services/ReportService.js'
import { recommendationService } from '../services/RecommendationService.js'
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from '../utils/response.js'
import type { AuthRequest } from '../middleware/auth.js'

export class ReportController {
  async getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await reportService.getDashboardStats()
      successResponse(res, stats)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getVerificationTrend(req: AuthRequest, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30
      
      const data = await reportService.getVerificationTrend(days)
      successResponse(res, data)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getCategoryDistribution(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await reportService.getCategoryDistribution()
      successResponse(res, data)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getDistrictDistribution(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await reportService.getDistrictDistribution()
      successResponse(res, data)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getActivityPerformance(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { activityId } = req.params
      
      if (!activityId) {
        errorResponse(res, '活动ID不能为空')
        return
      }

      const data = await reportService.getActivityPerformance(activityId)
      successResponse(res, data)
    } catch (error) {
      if (error instanceof Error && error.message === 'Activity not found') {
        notFoundResponse(res, '活动不存在')
        return
      }
      serverErrorResponse(res, error)
    }
  }

  async getMerchantPerformance(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { merchantId } = req.params
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined

      if (!merchantId) {
        errorResponse(res, '商户ID不能为空')
        return
      }

      const data = await reportService.getMerchantPerformance(merchantId, startDate, endDate)
      successResponse(res, data)
    } catch (error) {
      if (error instanceof Error && error.message === 'Merchant not found') {
        notFoundResponse(res, '商户不存在')
        return
      }
      serverErrorResponse(res, error)
    }
  }

  async getSettlementReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const startDate = new Date(req.query.startDate as string)
      const endDate = new Date(req.query.endDate as string)

      if (!startDate || !endDate) {
        errorResponse(res, '请指定时间范围')
        return
      }

      const data = await reportService.getSettlementReport(startDate, endDate)
      successResponse(res, data)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getRiskReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const startDate = new Date(req.query.startDate as string)
      const endDate = new Date(req.query.endDate as string)

      if (!startDate || !endDate) {
        errorResponse(res, '请指定时间范围')
        return
      }

      const data = await reportService.getRiskReport(startDate, endDate)
      successResponse(res, data)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getRecommendations(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params
      const limit = parseInt(req.query.limit as string) || 5
      const category = req.query.category as string | undefined

      if (!userId) {
        errorResponse(res, '用户ID不能为空')
        return
      }

      const recommendations = await recommendationService.getRecommendations({
        userId,
        limit,
        category,
      })

      successResponse(res, recommendations)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getPersonalizedStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params
      
      if (!userId) {
        errorResponse(res, '用户ID不能为空')
        return
      }

      const stats = await recommendationService.getPersonalizedStats(userId)
      successResponse(res, stats)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getTrendingCoupons(req: AuthRequest, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 5
      
      const coupons = await recommendationService.getTrendingCoupons(limit)
      successResponse(res, coupons)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async exportReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { type, startDate, endDate } = req.body
      
      let data: unknown[] = []
      
      switch (type) {
        case 'verification': {
          const trend = await reportService.getVerificationTrend(30)
          data = trend
          break
        }
        case 'category': {
          const category = await reportService.getCategoryDistribution()
          data = category
          break
        }
        case 'district': {
          const district = await reportService.getDistrictDistribution()
          data = district
          break
        }
        case 'settlement': {
          const report = await reportService.getSettlementReport(new Date(startDate), new Date(endDate))
          data = report.byMerchant
          break
        }
        default:
          errorResponse(res, '不支持的报告类型')
          return
      }

      const csv = await reportService.exportToCSV(data, `${type}_report.csv`)
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="${type}_report.csv"`)
      res.send('\uFEFF' + csv)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }
}

export const reportController = new ReportController()
