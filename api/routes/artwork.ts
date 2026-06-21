import { Router, type Request, type Response } from 'express'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import * as artworkService from '../services/artworkService.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const category = req.query.category as string | undefined
    const keyword = req.query.keyword as string | undefined
    const result = artworkService.getPublishedArtworks(page, pageSize, category, keyword)
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取藏品列表失败' })
  }
})

router.get('/categories', async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = artworkService.getArtworkCategories()
    res.json({ success: true, categories })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取分类失败' })
  }
})

router.get('/mine', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const result = artworkService.getUserArtworks(req.user!.id, page, pageSize)
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取我的藏品失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const artwork = artworkService.getArtworkById(req.params.id)
    if (!artwork) {
      res.status(404).json({ success: false, error: '藏品不存在' })
      return
    }
    res.json({ success: true, artwork })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取藏品详情失败' })
  }
})

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, category, description, images, dimensions, era, material, provenance, condition, estimated_value, status } = req.body
    if (!title || !category) {
      res.status(400).json({ success: false, error: '标题和分类必填' })
      return
    }
    const artwork = artworkService.createArtwork(req.user!.id, {
      title, category, description, images, dimensions, era, material, provenance, condition, estimated_value, status,
    })
    res.json({ success: true, artwork })
  } catch (err) {
    res.status(500).json({ success: false, error: '创建藏品失败' })
  }
})

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ok = artworkService.updateArtwork(req.params.id, req.user!.id, req.body)
    if (!ok) {
      res.status(400).json({ success: false, error: '更新失败或无权限' })
      return
    }
    const artwork = artworkService.getArtworkById(req.params.id)
    res.json({ success: true, artwork })
  } catch (err) {
    res.status(500).json({ success: false, error: '更新藏品失败' })
  }
})

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ok = artworkService.deleteArtwork(req.params.id, req.user!.id)
    if (!ok) {
      res.status(400).json({ success: false, error: '删除失败或无权限' })
      return
    }
    res.json({ success: true, message: '已删除' })
  } catch (err) {
    res.status(500).json({ success: false, error: '删除藏品失败' })
  }
})

export default router
