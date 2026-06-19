import type { Response } from 'express'
import { couponService } from '../services/CouponService.js'
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse, paginatedResponse } from '../utils/response.js'
import type { AuthRequest } from '../middleware/auth.js'
import type { CouponStatus, CouponType } from '../../../shared/types/index.js'

export class CouponController {
  async createActivity(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = req.body
      
      if (!data.name || !data.type || !data.value || !data.totalQuantity || !data.startTime || !data.endTime) {
        errorResponse(res, '缺少必要参数')
        return
      }

      const activity = await couponService.createActivity({
        ...data,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
      })

      successResponse(res, activity, '活动创建成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getActivityList(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1
      const pageSize = parseInt(req.query.pageSize as string) || 20
      const status = req.query.status as CouponStatus | undefined
      const type = req.query.type as CouponType | undefined

      const result = await couponService.getActivityList(page, pageSize, status, type)
      
      paginatedResponse(res, result.activities, result.total, page, pageSize)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getActivityDetail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      
      const activity = await couponService.getActivityById(id)
      
      if (!activity) {
        notFoundResponse(res, '活动不存在')
        return
      }

      successResponse(res, activity)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async updateActivity(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const updates = req.body

      if (updates.startTime) updates.startTime = new Date(updates.startTime)
      if (updates.endTime) updates.endTime = new Date(updates.endTime)

      const activity = await couponService.updateActivity(id, updates)
      
      if (!activity) {
        notFoundResponse(res, '活动不存在')
        return
      }

      successResponse(res, activity, '活动更新成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async updateActivityStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const { status } = req.body

      if (!status) {
        errorResponse(res, '状态不能为空')
        return
      }

      const activity = await couponService.updateActivityStatus(id, status as CouponStatus)
      
      if (!activity) {
        notFoundResponse(res, '活动不存在')
        return
      }

      successResponse(res, activity, '状态更新成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async distributeCoupon(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { activityId, userId } = req.body

      if (!activityId || !userId) {
        errorResponse(res, '缺少必要参数')
        return
      }

      const instance = await couponService.distributeCoupon(activityId, userId)
      
      if (!instance) {
        errorResponse(res, '发放失败，库存不足或用户已达到领取上限')
        return
      }

      successResponse(res, instance, '发放成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async batchDistribute(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { activityId, userIds } = req.body

      if (!activityId || !Array.isArray(userIds) || userIds.length === 0) {
        errorResponse(res, '缺少必要参数')
        return
      }

      const instances = await couponService.batchDistribute(activityId, userIds)
      
      successResponse(res, { 
        distributed: instances.length, 
        total: userIds.length,
        instances 
      }, `成功发放${instances.length}张券`)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getUserCoupons(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params
      const status = req.query.status as string | undefined

      if (!userId) {
        errorResponse(res, '用户ID不能为空')
        return
      }

      const coupons = await couponService.getUserCoupons(userId, status)
      successResponse(res, coupons)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getInstanceDetail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      
      const instance = await couponService.getInstanceById(id)
      
      if (!instance) {
        notFoundResponse(res, '券实例不存在')
        return
      }

      successResponse(res, instance)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getInventoryCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { activityId } = req.params
      
      const count = await couponService.getInventoryCount(activityId)
      successResponse(res, { available: count })
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async expireCoupons(req: AuthRequest, res: Response): Promise<void> {
    try {
      const count = await couponService.expireCoupons()
      successResponse(res, { expired: count }, `成功处理${count}张过期券`)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }
}

export const couponController = new CouponController()
