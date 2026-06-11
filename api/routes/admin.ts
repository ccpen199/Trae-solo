import { Router, type Request, type Response } from 'express'
import { ApiResponse, User, HealthContent } from '../../shared/types'
import { userDB, healthContentDB, usageRecordDB } from '../db/index'
import { checkInactivity, InactivityCheckResult } from '../services/alertService'
import { getPendingContents, getContents, PaginatedResult } from '../services/healthContent'

const router = Router()

router.get('/users', async (req: Request, res: Response<ApiResponse<User[]>>): Promise<void> => {
  try {
    const { role } = req.query
    const users = userDB.findAll(role as User['role'] | undefined)

    res.json({
      success: true,
      data: users
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取用户列表失败'
    })
  }
})

router.get('/users/:id', async (req: Request, res: Response<ApiResponse<User>>): Promise<void> => {
  try {
    const { id } = req.params
    const user = userDB.findById(id)

    if (!user) {
      res.status(404).json({
        success: false,
        error: '用户不存在'
      })
      return
    }

    res.json({
      success: true,
      data: user
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取用户信息失败'
    })
  }
})

router.put('/users/:id', async (req: Request, res: Response<ApiResponse<User>>): Promise<void> => {
  try {
    const { id } = req.params
    const updates = req.body

    const existingUser = userDB.findById(id)
    if (!existingUser) {
      res.status(404).json({
        success: false,
        error: '用户不存在'
      })
      return
    }

    const updatedUser = userDB.update(id, updates)

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        error: '更新用户信息失败'
      })
      return
    }

    res.json({
      success: true,
      data: updatedUser,
      message: '更新成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新用户信息失败'
    })
  }
})

router.delete('/users/:id', async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { id } = req.params

    const existingUser = userDB.findById(id)
    if (!existingUser) {
      res.status(404).json({
        success: false,
        error: '用户不存在'
      })
      return
    }

    const deleted = userDB.delete(id)
    if (!deleted) {
      res.status(500).json({
        success: false,
        error: '删除用户失败'
      })
      return
    }

    res.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '删除用户失败'
    })
  }
})

router.get('/contents/pending', async (req: Request, res: Response<ApiResponse<PaginatedResult<HealthContent>>>): Promise<void> => {
  try {
    const { page, pageSize } = req.query
    const result = getPendingContents(
      page ? parseInt(page as string) : 1,
      pageSize ? parseInt(pageSize as string) : 10
    )

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取待审核内容失败'
    })
  }
})

router.get('/contents', async (req: Request, res: Response<ApiResponse<PaginatedResult<HealthContent>>>): Promise<void> => {
  try {
    const { type, status, page, pageSize } = req.query
    const result = getContents({
      type: type as HealthContent['type'] | undefined,
      status: status as HealthContent['status'] | undefined,
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined
    })

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取内容列表失败'
    })
  }
})

router.put('/contents/:id/status', async (req: Request, res: Response<ApiResponse<HealthContent>>): Promise<void> => {
  try {
    const { id } = req.params
    const { status, accessibilityLevel } = req.body

    if (!status) {
      res.status(400).json({
        success: false,
        error: '缺少状态信息'
      })
      return
    }

    const existingContent = healthContentDB.findById(id)
    if (!existingContent) {
      res.status(404).json({
        success: false,
        error: '内容不存在'
      })
      return
    }

    const updates: Partial<HealthContent> = { status }
    if (accessibilityLevel !== undefined) {
      updates.accessibilityLevel = accessibilityLevel
    }

    const updated = healthContentDB.update(id, updates)

    if (!updated) {
      res.status(500).json({
        success: false,
        error: '更新内容状态失败'
      })
      return
    }

    res.json({
      success: true,
      data: updated,
      message: '状态更新成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新内容状态失败'
    })
  }
})

router.delete('/contents/:id', async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { id } = req.params

    const existingContent = healthContentDB.findById(id)
    if (!existingContent) {
      res.status(404).json({
        success: false,
        error: '内容不存在'
      })
      return
    }

    const deleted = healthContentDB.delete(id)
    if (!deleted) {
      res.status(500).json({
        success: false,
        error: '删除内容失败'
      })
      return
    }

    res.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '删除内容失败'
    })
  }
})

router.post('/check-inactivity', async (req: Request, res: Response<ApiResponse<InactivityCheckResult>>): Promise<void> => {
  try {
    const result = checkInactivity()

    res.json({
      success: true,
      data: result,
      message: `检测完成，发现${result.inactiveUsers.length}个不活跃用户，创建${result.alertsCreated}条预警`
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '检测不活跃用户失败'
    })
  }
})

router.get('/stats', async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const elderCount = userDB.findAll('elder').length
    const familyCount = userDB.findAll('family').length
    const auditorCount = userDB.findAll('auditor').length
    const adminCount = userDB.findAll('admin').length

    const pendingContentCount = healthContentDB.count({ status: 'pending' })
    const approvedContentCount = healthContentDB.count({ status: 'approved' })
    const rejectedContentCount = healthContentDB.count({ status: 'rejected' })

    const recipeCount = healthContentDB.count({ type: 'recipe' })
    const exerciseCount = healthContentDB.count({ type: 'exercise' })
    const medicationCount = healthContentDB.count({ type: 'medication' })

    const today = new Date().toISOString().split('T')[0]
    let totalUsageToday = 0
    const elders = userDB.findAll('elder')
    for (const elder of elders) {
      const dailyStats = usageRecordDB.getDailyStats(elder.id, today)
      totalUsageToday += dailyStats.reduce((sum, stat) => sum + stat.totalDuration, 0)
    }

    res.json({
      success: true,
      data: {
        users: {
          total: elderCount + familyCount + auditorCount + adminCount,
          elder: elderCount,
          family: familyCount,
          auditor: auditorCount,
          admin: adminCount
        },
        contents: {
          total: pendingContentCount + approvedContentCount + rejectedContentCount,
          pending: pendingContentCount,
          approved: approvedContentCount,
          rejected: rejectedContentCount,
          byType: {
            recipe: recipeCount,
            exercise: exerciseCount,
            medication: medicationCount
          }
        },
        usage: {
          todayTotalDuration: totalUsageToday
        }
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取统计数据失败'
    })
  }
})

router.get('/user-usage/:userId', async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { userId } = req.params
    const { limit } = req.query

    const records = usageRecordDB.findByUserId(
      userId,
      limit ? parseInt(limit as string) : undefined
    )

    res.json({
      success: true,
      data: records
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取用户使用记录失败'
    })
  }
})

export default router
