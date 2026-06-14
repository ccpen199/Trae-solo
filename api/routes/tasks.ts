import { Router, type Request, type Response } from 'express'
import { getUserTasks, getUserTask, completeTask, getRecommendedTasks, getTaskById } from '../services/taskService.js'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    const { category } = req.query

    if (userId) {
      let tasks = getUserTasks(userId)
      if (category) {
        tasks = tasks.filter(t => t.category === category)
      }
      res.json({ success: true, tasks })
    } else {
      const { category } = req.query
      let tasks: any[] = []
      if (category) {
        const { getTasksByCategory } = require('../services/taskService')
        tasks = getTasksByCategory(category)
      } else {
        const { getAllTasks } = require('../services/taskService')
        tasks = getAllTasks()
      }
      res.json({ success: true, tasks })
    }
  } catch (error) {
    res.status(500).json({ success: false, message: '获取任务列表失败' })
  }
})

router.get('/daily/recommend', (req: Request, res: Response) => {
  try {
    const tasks = getRecommendedTasks()
    res.json({ success: true, tasks })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取推荐任务失败' })
  }
})

router.get('/:id', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    const taskId = req.params.id

    if (userId) {
      const task = getUserTask(userId, taskId)
      if (!task) {
        return res.json({ success: false, message: '任务不存在' })
      }
      res.json({ success: true, task })
    } else {
      const task = getTaskById(taskId)
      if (!task) {
        return res.json({ success: false, message: '任务不存在' })
      }
      res.json({ success: true, task })
    }
  } catch (error) {
    res.status(500).json({ success: false, message: '获取任务详情失败' })
  }
})

router.post('/:id/complete', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    if (!userId) {
      return res.json({ success: false, message: '未登录' })
    }
    const taskId = req.params.id
    const { progress } = req.body
    const result = completeTask(userId, taskId, progress || 1)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, message: '任务完成失败' })
  }
})

export default router
