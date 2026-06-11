import { Router, type Request, type Response } from 'express'
import { ApiResponse, User } from '../../shared/types'
import { userDB, medicationReminderDB, usageRecordDB } from '../db/index'

const router = Router()

router.get('/profile/:id', async (req: Request, res: Response<ApiResponse<User>>): Promise<void> => {
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

    userDB.updateLastActive(id)

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

router.put('/profile/:id', async (req: Request, res: Response<ApiResponse<User>>): Promise<void> => {
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

router.post('/register', async (req: Request, res: Response<ApiResponse<User>>): Promise<void> => {
  try {
    const { phone, name, age, role, accessibilityConfig, chronicDiseases } = req.body

    if (!phone || !name || !age || !role) {
      res.status(400).json({
        success: false,
        error: '缺少必要信息'
      })
      return
    }

    const existingUser = userDB.findByPhone(phone)
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: '该手机号已注册'
      })
      return
    }

    const user = userDB.create({
      phone,
      name,
      age,
      role,
      accessibilityConfig: accessibilityConfig || {
        fontSize: 'normal',
        contrast: 'normal',
        voiceEnabled: false,
        voiceSpeed: 1.0
      },
      chronicDiseases: chronicDiseases || []
    })

    res.status(201).json({
      success: true,
      data: user,
      message: '注册成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '注册失败'
    })
  }
})

router.post('/login', async (req: Request, res: Response<ApiResponse<User>>): Promise<void> => {
  try {
    const { phone } = req.body

    if (!phone) {
      res.status(400).json({
        success: false,
        error: '请输入手机号'
      })
      return
    }

    let user = userDB.findByPhone(phone)

    if (!user) {
      res.status(404).json({
        success: false,
        error: '用户不存在，请先注册'
      })
      return
    }

    userDB.updateLastActive(user.id)

    res.json({
      success: true,
      data: user,
      message: '登录成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '登录失败'
    })
  }
})

router.get('/:id/medications', async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { id } = req.params
    const reminders = medicationReminderDB.findByUserId(id)

    res.json({
      success: true,
      data: reminders
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取用药提醒失败'
    })
  }
})

router.post('/:id/medications', async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { id } = req.params
    const { medicineName, dosage, times, days, enabled, note } = req.body

    if (!medicineName || !dosage || !times || !days) {
      res.status(400).json({
        success: false,
        error: '缺少必要信息'
      })
      return
    }

    const reminder = medicationReminderDB.create({
      userId: id,
      medicineName,
      dosage,
      times,
      days,
      enabled: enabled !== false,
      note: note || ''
    })

    res.status(201).json({
      success: true,
      data: reminder,
      message: '用药提醒创建成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建用药提醒失败'
    })
  }
})

router.put('/medications/:medicationId', async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { medicationId } = req.params
    const updates = req.body

    const existingReminder = medicationReminderDB.findById(medicationId)
    if (!existingReminder) {
      res.status(404).json({
        success: false,
        error: '用药提醒不存在'
      })
      return
    }

    const updated = medicationReminderDB.update(medicationId, updates)

    res.json({
      success: true,
      data: updated,
      message: '更新成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新用药提醒失败'
    })
  }
})

router.delete('/medications/:medicationId', async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { medicationId } = req.params

    const deleted = medicationReminderDB.delete(medicationId)
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: '用药提醒不存在'
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
      error: '删除用药提醒失败'
    })
  }
})

router.post('/:id/usage', async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { id } = req.params
    const { page, duration } = req.body

    if (!page || duration === undefined) {
      res.status(400).json({
        success: false,
        error: '缺少必要信息'
      })
      return
    }

    const record = usageRecordDB.create({
      userId: id,
      page,
      duration
    })

    userDB.updateLastActive(id)

    res.status(201).json({
      success: true,
      data: record
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '记录使用数据失败'
    })
  }
})

router.get('/:id/usage/stats', async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { id } = req.params
    const { date } = req.query

    const targetDate = date as string || new Date().toISOString().split('T')[0]
    const stats = usageRecordDB.getDailyStats(id, targetDate)

    res.json({
      success: true,
      data: {
        date: targetDate,
        stats
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取使用统计失败'
    })
  }
})

export default router
