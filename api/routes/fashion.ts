import { Router, type Request, type Response } from 'express'
import { getFashionQuizzes, getQuizById, submitQuizResult, getUserQuizResults } from '../services/fashionService.js'
import { completeTask } from '../services/taskService.js'

const router = Router()

router.get('/quizzes', (req: Request, res: Response) => {
  try {
    const quizzes = getFashionQuizzes()
    res.json({ success: true, quizzes })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取测评列表失败' })
  }
})

router.get('/quizzes/:id', (req: Request, res: Response) => {
  try {
    const quiz = getQuizById(req.params.id)
    if (!quiz) {
      return res.json({ success: false, message: '测评不存在' })
    }
    res.json({ success: true, quiz })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取测评失败' })
  }
})

router.post('/quizzes/:id/submit', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    if (!userId) {
      return res.json({ success: false, message: '未登录' })
    }
    const { answers } = req.body
    const result = submitQuizResult(userId, req.params.id, answers)

    if (result.success && result.reward > 0) {
      const { id } = req.params
      const taskId = id.includes('hairstyle') ? 'task-fashion-hairstyle' : 'task-fashion-clothing'
      completeTask(userId, taskId, 1)
    }

    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, message: '提交失败' })
  }
})

router.get('/my/results', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    if (!userId) {
      return res.json({ success: false, message: '未登录' })
    }
    const results = getUserQuizResults(userId)
    res.json({ success: true, results })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取记录失败' })
  }
})

export default router
