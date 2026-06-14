import { Router, type Request, type Response } from 'express'
import { getTodayWaterRecord, addWaterRecord, getTodayStepsRecord, syncSteps } from '../services/healthService.js'
import { completeTask } from '../services/taskService.js'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'ok',
  })
})

router.get('/water/today', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    if (!userId) {
      return res.json({ success: false, message: '未登录' })
    }
    const result = getTodayWaterRecord(userId)
    res.json({ success: true, ...result })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取饮水数据失败' })
  }
})

router.post('/water/checkin', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    if (!userId) {
      return res.json({ success: false, message: '未登录' })
    }
    const { amount } = req.body
    const result = addWaterRecord(userId, amount)

    if (result.completed) {
      completeTask(userId, 'task-water', 1)
    }

    res.json({ success: true, ...result })
  } catch (error) {
    res.status(500).json({ success: false, message: '打卡失败' })
  }
})

router.get('/steps/today', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    if (!userId) {
      return res.json({ success: false, message: '未登录' })
    }
    const result = getTodayStepsRecord(userId)
    res.json({ success: true, ...result })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取步数数据失败' })
  }
})

router.post('/steps/sync', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    if (!userId) {
      return res.json({ success: false, message: '未登录' })
    }
    const { steps } = req.body
    const result = syncSteps(userId, steps || 0)

    if (result.completed) {
      completeTask(userId, 'task-steps', 1)
    }

    res.json({ success: true, ...result })
  } catch (error) {
    res.status(500).json({ success: false, message: '同步步数失败' })
  }
})

export default router
