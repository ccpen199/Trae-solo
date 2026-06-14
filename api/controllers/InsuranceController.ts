import type { Response } from 'express'
import insuranceService from '../services/InsuranceService.js'
import type { RequestWithUser } from '../types/index.js'

class InsuranceController {
  list(req: RequestWithUser, res: Response): void {
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

      const result = insuranceService.getInsuranceList(req.user.id, { page, pageSize })

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
          items: result.items,
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
        message: '获取参保信息列表成功',
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取参保信息列表失败',
      })
    }
  }

  history(req: RequestWithUser, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '请先登录',
        })
        return
      }

      const insuranceId = parseInt(req.params.id)

      if (isNaN(insuranceId)) {
        res.status(400).json({
          success: false,
          error: '参保信息ID无效',
        })
        return
      }

      const result = insuranceService.getInsuranceHistory(req.user.id, insuranceId)

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
          list: result.list,
        },
        message: '获取缴费历史成功',
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取缴费历史失败',
      })
    }
  }
}

const insuranceController = new InsuranceController()

export default insuranceController
export { InsuranceController }
