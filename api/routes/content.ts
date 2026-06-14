import { Router, type Request, type Response } from 'express'
import { getJokes, getRandomJoke, getIdiomQuestions, checkIdiomAnswer } from '../services/contentService.js'
import { completeTask } from '../services/taskService.js'

const router = Router()

router.get('/jokes', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const result = getJokes(page, pageSize)
    res.json({ success: true, ...result })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取笑话失败' })
  }
})

router.get('/jokes/random', (req: Request, res: Response) => {
  try {
    const joke = getRandomJoke()
    res.json({ success: true, joke })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取笑话失败' })
  }
})

router.post('/jokes/:id/read', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    if (!userId) {
      return res.json({ success: false, message: '未登录' })
    }
    const result = completeTask(userId, 'task-joke', 1)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, message: '操作失败' })
  }
})

router.get('/idioms/questions', (req: Request, res: Response) => {
  try {
    const count = parseInt(req.query.count as string) || 5
    const questions = getIdiomQuestions(count)
    res.json({ success: true, questions })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取题目失败' })
  }
})

router.post('/idioms/submit', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    if (!userId) {
      return res.json({ success: false, message: '未登录' })
    }
    const { questionId, answer } = req.body
    const isCorrect = checkIdiomAnswer(questionId, answer)

    let result: any = { success: true, correct: isCorrect }

    if (isCorrect) {
      const taskResult = completeTask(userId, 'task-idiom', 1)
      result.reward = taskResult.reward
      result.task = taskResult.task
    }

    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, message: '提交失败' })
  }
})

export default router
