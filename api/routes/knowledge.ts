import { Router, type Request, type Response } from 'express'
import { authMiddleware, adminMiddleware, type AuthRequest } from '../middleware/auth.js'
import * as knowledgeService from '../services/knowledgeService.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const category = req.query.category as string | undefined
    const keyword = req.query.keyword as string | undefined
    const result = knowledgeService.getArticles(page, pageSize, category, keyword)
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取文章列表失败' })
  }
})

router.get('/categories', async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = knowledgeService.getArticleCategories()
    res.json({ success: true, categories })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取分类失败' })
  }
})

router.get('/popular', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 5
    const articles = knowledgeService.getPopularArticles(limit)
    res.json({ success: true, articles })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取热门文章失败' })
  }
})

router.get('/hot-tags', async (req: Request, res: Response): Promise<void> => {
  try {
    const tags = knowledgeService.getHotTags()
    res.json({ success: true, tags })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取热门标签失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const article = knowledgeService.getArticleById(req.params.id)
    if (!article) {
      res.status(404).json({ success: false, error: '文章不存在' })
      return
    }
    res.json({ success: true, article })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取文章详情失败' })
  }
})

router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, category, summary, content, cover_image, author, tags, status } = req.body
    if (!title || !category || !content) {
      res.status(400).json({ success: false, error: '标题、分类和内容必填' })
      return
    }
    const article = knowledgeService.createArticle({
      title, category, summary, content, cover_image, author, tags, status,
    })
    res.json({ success: true, article })
  } catch (err) {
    res.status(500).json({ success: false, error: '创建文章失败' })
  }
})

router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const ok = knowledgeService.updateArticle(req.params.id, req.body)
    if (!ok) {
      res.status(400).json({ success: false, error: '更新失败' })
      return
    }
    const article = knowledgeService.getArticleById(req.params.id)
    res.json({ success: true, article })
  } catch (err) {
    res.status(500).json({ success: false, error: '更新文章失败' })
  }
})

router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const ok = knowledgeService.deleteArticle(req.params.id)
    if (!ok) {
      res.status(400).json({ success: false, error: '删除失败' })
      return
    }
    res.json({ success: true, message: '已删除' })
  } catch (err) {
    res.status(500).json({ success: false, error: '删除文章失败' })
  }
})

router.post('/:id/like', async (req: Request, res: Response): Promise<void> => {
  try {
    const ok = knowledgeService.likeArticle(req.params.id)
    if (!ok) {
      res.status(400).json({ success: false, error: '点赞失败' })
      return
    }
    res.json({ success: true, message: '已点赞' })
  } catch (err) {
    res.status(500).json({ success: false, error: '点赞失败' })
  }
})

export default router
