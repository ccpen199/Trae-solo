import { Router, type Request, type Response } from 'express'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import * as communityService from '../services/communityService.js'

const router = Router()

router.get('/questions', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const category = req.query.category as string | undefined
    const keyword = req.query.keyword as string | undefined
    const sort = (req.query.sort as string) || 'latest'
    const result = communityService.getQuestions(page, pageSize, category, keyword, sort)
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取问题列表失败' })
  }
})

router.get('/questions/categories', async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = communityService.getQuestionCategories()
    res.json({ success: true, categories })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取分类失败' })
  }
})

router.get('/questions/mine', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const result = communityService.getUserQuestions(req.user!.id, page, pageSize)
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取我的提问失败' })
  }
})

router.get('/questions/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const question = communityService.getQuestionById(req.params.id)
    if (!question) {
      res.status(404).json({ success: false, error: '问题不存在' })
      return
    }
    res.json({ success: true, question })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取问题详情失败' })
  }
})

router.post('/questions', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, category, images } = req.body
    if (!title || !content) {
      res.status(400).json({ success: false, error: '标题和内容必填' })
      return
    }
    const question = communityService.createQuestion(req.user!.id, { title, content, category, images })
    res.json({ success: true, question })
  } catch (err) {
    res.status(500).json({ success: false, error: '创建问题失败' })
  }
})

router.delete('/questions/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ok = communityService.deleteQuestion(req.params.id, req.user!.id)
    if (!ok) {
      res.status(400).json({ success: false, error: '删除失败或无权限' })
      return
    }
    res.json({ success: true, message: '已删除' })
  } catch (err) {
    res.status(500).json({ success: false, error: '删除问题失败' })
  }
})

router.post('/questions/:id/like', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const ok = communityService.likeQuestion(req.params.id)
    if (!ok) {
      res.status(400).json({ success: false, error: '点赞失败' })
      return
    }
    res.json({ success: true, message: '已点赞' })
  } catch (err) {
    res.status(500).json({ success: false, error: '点赞失败' })
  }
})

router.get('/questions/:id/answers', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const result = communityService.getQuestionAnswers(req.params.id, page, pageSize)
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取回答列表失败' })
  }
})

router.post('/questions/:id/answers', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content } = req.body
    if (!content) {
      res.status(400).json({ success: false, error: '回答内容必填' })
      return
    }
    const answer = communityService.createAnswer(req.user!.id, req.params.id, content)
    if (!answer) {
      res.status(404).json({ success: false, error: '问题不存在' })
      return
    }
    res.json({ success: true, answer })
  } catch (err) {
    res.status(500).json({ success: false, error: '提交回答失败' })
  }
})

router.post('/answers/:id/like', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const ok = communityService.likeAnswer(req.params.id)
    if (!ok) {
      res.status(400).json({ success: false, error: '点赞失败' })
      return
    }
    res.json({ success: true, message: '已点赞' })
  } catch (err) {
    res.status(500).json({ success: false, error: '点赞失败' })
  }
})

router.post('/questions/:questionId/answers/:answerId/best', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ok = communityService.markBestAnswer(req.user!.id, req.params.questionId, req.params.answerId)
    if (!ok) {
      res.status(400).json({ success: false, error: '设置失败或无权限' })
      return
    }
    res.json({ success: true, message: '已设为最佳回答' })
  } catch (err) {
    res.status(500).json({ success: false, error: '设置最佳回答失败' })
  }
})

router.delete('/answers/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ok = communityService.deleteAnswer(req.params.id, req.user!.id)
    if (!ok) {
      res.status(400).json({ success: false, error: '删除失败或无权限' })
      return
    }
    res.json({ success: true, message: '已删除' })
  } catch (err) {
    res.status(500).json({ success: false, error: '删除回答失败' })
  }
})

export default router
