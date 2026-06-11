import { Router, type Request, type Response } from 'express'
import { ApiResponse, FamilyBinding, Alert, Anniversary } from '../../shared/types'
import { familyBindingDB, alertDB, anniversaryDB, userDB } from '../db/index'
import {
  getAlerts,
  getUnreadCount,
  markAlertAsRead,
  markAllAlertsAsRead,
  deleteAlert,
  createHealthAlert
} from '../services/alertService'

const router = Router()

router.get('/bindings/:familyId', async (req: Request, res: Response<ApiResponse<FamilyBinding[]>>): Promise<void> => {
  try {
    const { familyId } = req.params
    const bindings = familyBindingDB.findByFamilyId(familyId)

    res.json({
      success: true,
      data: bindings
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取家庭绑定失败'
    })
  }
})

router.post('/bindings', async (req: Request, res: Response<ApiResponse<FamilyBinding>>): Promise<void> => {
  try {
    const { elderPhone, familyId, relation } = req.body

    if (!elderPhone || !familyId || !relation) {
      res.status(400).json({
        success: false,
        error: '缺少必要信息'
      })
      return
    }

    const elder = userDB.findByPhone(elderPhone)
    if (!elder) {
      res.status(404).json({
        success: false,
        error: '未找到该手机号对应的老人用户'
      })
      return
    }

    if (elder.role !== 'elder') {
      res.status(400).json({
        success: false,
        error: '该用户不是老人角色'
      })
      return
    }

    const existingBindings = familyBindingDB.findByFamilyId(familyId)
    const alreadyBound = existingBindings.some(b => b.elderId === elder.id && b.status === 'active')
    if (alreadyBound) {
      res.status(400).json({
        success: false,
        error: '已经绑定过该老人'
      })
      return
    }

    const binding = familyBindingDB.create({
      elderId: elder.id,
      familyId,
      relation,
      status: 'pending',
      notificationEnabled: true
    })

    res.status(201).json({
      success: true,
      data: binding,
      message: '绑定请求已发送，等待老人确认'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建家庭绑定失败'
    })
  }
})

router.put('/bindings/:bindingId', async (req: Request, res: Response<ApiResponse<FamilyBinding>>): Promise<void> => {
  try {
    const { bindingId } = req.params
    const { status, notificationEnabled, relation } = req.body

    const existingBinding = familyBindingDB.findById(bindingId)
    if (!existingBinding) {
      res.status(404).json({
        success: false,
        error: '绑定记录不存在'
      })
      return
    }

    const updates: Partial<FamilyBinding> = {}
    if (status !== undefined) updates.status = status
    if (notificationEnabled !== undefined) updates.notificationEnabled = notificationEnabled
    if (relation !== undefined) updates.relation = relation

    const updated = familyBindingDB.update(bindingId, updates)

    if (!updated) {
      res.status(404).json({
        success: false,
        error: '更新失败'
      })
      return
    }

    res.json({
      success: true,
      data: updated,
      message: '更新成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新家庭绑定失败'
    })
  }
})

router.delete('/bindings/:bindingId', async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { bindingId } = req.params

    const existingBinding = familyBindingDB.findById(bindingId)
    if (!existingBinding) {
      res.status(404).json({
        success: false,
        error: '绑定记录不存在'
      })
      return
    }

    const deleted = familyBindingDB.delete(bindingId)
    if (!deleted) {
      res.status(500).json({
        success: false,
        error: '删除失败'
      })
      return
    }

    res.json({
      success: true,
      message: '解绑成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '解绑失败'
    })
  }
})

router.get('/alerts/:familyId', async (req: Request, res: Response<ApiResponse<Alert[]>>): Promise<void> => {
  try {
    const { familyId } = req.params
    const { read, type, level, limit } = req.query

    const options = {
      read: read !== undefined ? read === 'true' : undefined,
      type: type as Alert['type'] | undefined,
      level: level as Alert['level'] | undefined,
      limit: limit ? parseInt(limit as string) : undefined
    }

    const alerts = getAlerts(familyId, options)

    res.json({
      success: true,
      data: alerts
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取预警列表失败'
    })
  }
})

router.get('/alerts/:familyId/unread-count', async (req: Request, res: Response<ApiResponse<{ count: number }>>): Promise<void> => {
  try {
    const { familyId } = req.params
    const count = getUnreadCount(familyId)

    res.json({
      success: true,
      data: { count }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取未读预警数量失败'
    })
  }
})

router.put('/alerts/:alertId/read', async (req: Request, res: Response<ApiResponse<Alert>>): Promise<void> => {
  try {
    const { alertId } = req.params
    const alert = markAlertAsRead(alertId)

    if (!alert) {
      res.status(404).json({
        success: false,
        error: '预警不存在'
      })
      return
    }

    res.json({
      success: true,
      data: alert,
      message: '已标记为已读'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '标记失败'
    })
  }
})

router.put('/alerts/:familyId/read-all', async (req: Request, res: Response<ApiResponse<{ count: number }>>): Promise<void> => {
  try {
    const { familyId } = req.params
    const count = markAllAlertsAsRead(familyId)

    res.json({
      success: true,
      data: { count },
      message: `已标记${count}条预警为已读`
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '批量标记失败'
    })
  }
})

router.delete('/alerts/:alertId', async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { alertId } = req.params

    const existingAlert = alertDB.findById(alertId)
    if (!existingAlert) {
      res.status(404).json({
        success: false,
        error: '预警不存在'
      })
      return
    }

    const deleted = deleteAlert(alertId)
    if (!deleted) {
      res.status(500).json({
        success: false,
        error: '删除失败'
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
      error: '删除预警失败'
    })
  }
})

router.post('/health-alert', async (req: Request, res: Response<ApiResponse<Alert[]>>): Promise<void> => {
  try {
    const { elderId, message, level } = req.body

    if (!elderId || !message) {
      res.status(400).json({
        success: false,
        error: '缺少必要信息'
      })
      return
    }

    const alerts = createHealthAlert(elderId, message, level || 'warning')

    res.status(201).json({
      success: true,
      data: alerts,
      message: '健康预警已发送'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '发送健康预警失败'
    })
  }
})

router.get('/anniversaries/:elderId', async (req: Request, res: Response<ApiResponse<Anniversary[]>>): Promise<void> => {
  try {
    const { elderId } = req.params
    const anniversaries = anniversaryDB.findByUserId(elderId)

    res.json({
      success: true,
      data: anniversaries
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取纪念日失败'
    })
  }
})

router.post('/anniversaries', async (req: Request, res: Response<ApiResponse<Anniversary>>): Promise<void> => {
  try {
    const { userId, date, title, type, remindDays } = req.body

    if (!userId || !date || !title || !type) {
      res.status(400).json({
        success: false,
        error: '缺少必要信息'
      })
      return
    }

    const anniversary = anniversaryDB.create({
      userId,
      date,
      title,
      type,
      remindDays: remindDays || 7
    })

    res.status(201).json({
      success: true,
      data: anniversary,
      message: '纪念日创建成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建纪念日失败'
    })
  }
})

router.put('/anniversaries/:anniversaryId', async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { anniversaryId } = req.params
    const updates = req.body

    const updated = anniversaryDB.update(anniversaryId, updates)
    if (!updated) {
      res.status(404).json({
        success: false,
        error: '纪念日不存在'
      })
      return
    }

    res.json({
      success: true,
      message: '更新成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新纪念日失败'
    })
  }
})

router.delete('/anniversaries/:anniversaryId', async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { anniversaryId } = req.params

    const deleted = anniversaryDB.delete(anniversaryId)
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: '纪念日不存在'
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
      error: '删除纪念日失败'
    })
  }
})

export default router
