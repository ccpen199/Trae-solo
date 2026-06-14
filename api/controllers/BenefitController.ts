import type { Response } from 'express'
import benefitService from '../services/BenefitService.js'
import type { RequestWithUser } from '../types/index.js'

class BenefitController {
  pensionList(req: RequestWithUser, res: Response): void {
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

      const result = benefitService.getPensionList(req.user.id, { page, pageSize })

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
        message: '获取养老金发放列表成功',
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取养老金发放列表失败',
      })
    }
  }

  pensionStats(req: RequestWithUser, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '请先登录',
        })
        return
      }

      const data = benefitService.getPensionStats(req.user.id)

      res.status(200).json({
        success: true,
        data,
        message: '获取养老金统计成功',
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取养老金统计失败',
      })
    }
  }

  medicalList(req: RequestWithUser, res: Response): void {
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

      const result = benefitService.getMedicalList(req.user.id, { page, pageSize })

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
        message: '获取医保个人账户划拨列表成功',
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取医保个人账户划拨列表失败',
      })
    }
  }

  medicalBalance(req: RequestWithUser, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '请先登录',
        })
        return
      }

      const data = benefitService.getMedicalBalance(req.user.id)

      res.status(200).json({
        success: true,
        data,
        message: '获取医保个人账户余额成功',
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取医保个人账户余额失败',
      })
    }
  }
}

const benefitController = new BenefitController()

export default benefitController
export { BenefitController }
