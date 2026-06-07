import { Router, type Request, type Response } from 'express'
import ChatbotService from '../services/ChatbotService.js'
import db from '../db/index.js'
import { success, error } from '../utils/response.js'
import authMiddleware from '../middleware/auth.js'

const router = Router()
const chatbotService = new ChatbotService(db)

router.post('/ask', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId
    const { sessionId, question } = req.body

    if (!sessionId || !question) {
      error(res, '会话ID和问题不能为空')
      return
    }

    const result = await chatbotService.ask({
      userId,
      sessionId,
      question,
    })

    success(res, result, '回答成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '问答失败'
    error(res, message)
  }
})

router.post('/query-archive', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, category, limit } = req.body

    if (!query) {
      error(res, '查询关键词不能为空')
      return
    }

    const result = chatbotService.queryArchive({
      query,
      category,
      limit,
    })

    success(res, result, '知识库查询成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '知识库查询失败'
    error(res, message)
  }
})

export default router
