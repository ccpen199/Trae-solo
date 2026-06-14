import type { Response } from 'express'
import familyService from '../services/FamilyService.js'
import type { RequestWithUser } from '../types/index.js'

class FamilyController {
  listMembers(req: RequestWithUser, res: Response): void {
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

      const result = familyService.getMemberList(req.user.id, { page, pageSize })

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
        message: '获取家庭成员列表成功',
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取家庭成员列表失败',
      })
    }
  }

  async bind(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '请先登录',
        })
        return
      }

      const { relativeIdCard, relativeName, relationship } = req.body

      if (!relativeIdCard || !relativeName || !relationship) {
        res.status(400).json({
          success: false,
          error: '缺少必要参数',
        })
        return
      }

      const result = await familyService.bindMember(req.user.id, {
        relativeIdCard,
        relativeName,
        relationship,
      })

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
          member: result.member,
          verified: result.verified,
        },
        message: result.message,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '绑定亲属失败',
      })
    }
  }

  async verifyPolice(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '请先登录',
        })
        return
      }

      const { idCard, name, relationship } = req.body

      if (!idCard || !name) {
        res.status(400).json({
          success: false,
          error: '缺少身份证号或姓名',
        })
        return
      }

      const result = await familyService.verifyWithPolice(req.user.id, {
        idCard,
        name,
        relationship,
      })

      res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '公安核验失败',
      })
    }
  }

  authorize(req: RequestWithUser, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '请先登录',
        })
        return
      }

      const memberId = parseInt(req.params.id)
      const { authAmount } = req.body

      if (isNaN(memberId)) {
        res.status(400).json({
          success: false,
          error: '家庭成员ID无效',
        })
        return
      }

      if (authAmount === undefined || authAmount === null) {
        res.status(400).json({
          success: false,
          error: '授权金额不能为空',
        })
        return
      }

      const result = familyService.authorizeMember(req.user.id, memberId, { authAmount })

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
          member: result.member,
          authorized: result.authorized,
        },
        message: result.message,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '授权失败',
      })
    }
  }

  usageRecords(req: RequestWithUser, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '请先登录',
        })
        return
      }

      const records = familyService.getUsageRecords(req.user.id)

      res.status(200).json({
        success: true,
        data: records,
        message: '获取共济使用记录成功',
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取共济使用记录失败',
      })
    }
  }

  unbind(req: RequestWithUser, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '请先登录',
        })
        return
      }

      const memberId = parseInt(req.params.id)
      if (isNaN(memberId)) {
        res.status(400).json({
          success: false,
          error: '家庭成员ID无效',
        })
        return
      }

      const result = familyService.unbindMember(req.user.id, memberId)

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.message,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: {
          message: result.message,
        },
        message: result.message,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '解绑失败',
      })
    }
  }
}

const familyController = new FamilyController()

export default familyController
export { FamilyController }
