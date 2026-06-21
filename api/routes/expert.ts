import { Router, type Request, type Response } from 'express'
import { authMiddleware, adminMiddleware, type AuthRequest } from '../middleware/auth.js'
import * as expertService from '../services/expertService.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const category = req.query.category as string | undefined
    const result = expertService.getApprovedExperts(page, pageSize, category)
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取专家列表失败' })
  }
})

router.get('/categories', async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = expertService.getExpertCategories()
    res.json({ success: true, categories })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取分类失败' })
  }
})

router.get('/pending', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const result = expertService.getPendingExperts(page, pageSize)
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取待审核专家失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const expert = expertService.getExpertById(req.params.id)
    if (!expert) {
      res.status(404).json({ success: false, error: '专家不存在' })
      return
    }
    res.json({ success: true, expert })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取专家信息失败' })
  }
})

router.get('/me/profile', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const expert = expertService.getExpertByUserId(req.user!.id)
    if (!expert) {
      res.status(404).json({ success: false, error: '专家资料不存在' })
      return
    }
    res.json({ success: true, expert })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取专家资料失败' })
  }
})

router.post('/apply', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, title, category, years_of_experience, bio, avatar, price_per_appraisal } = req.body
    if (!name || !category || years_of_experience === undefined || price_per_appraisal === undefined) {
      res.status(400).json({ success: false, error: '必填参数缺失' })
      return
    }
    const expert = expertService.applyExpert(req.user!.id, {
      name, title, category, years_of_experience, bio, avatar, price_per_appraisal,
    })
    if (!expert) {
      res.status(400).json({ success: false, error: '已提交过申请或申请失败' })
      return
    }
    res.json({ success: true, expert, message: '申请已提交，请等待审核' })
  } catch (err) {
    res.status(500).json({ success: false, error: '提交申请失败' })
  }
})

router.put('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updated = expertService.updateExpert(req.user!.id, req.body)
    if (!updated) {
      res.status(400).json({ success: false, error: '更新失败' })
      return
    }
    const expert = expertService.getExpertByUserId(req.user!.id)
    res.json({ success: true, expert })
  } catch (err) {
    res.status(500).json({ success: false, error: '更新专家资料失败' })
  }
})

router.post('/:id/approve', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const ok = expertService.approveExpert(req.params.id)
    if (!ok) {
      res.status(400).json({ success: false, error: '审核失败' })
      return
    }
    res.json({ success: true, message: '已通过审核' })
  } catch (err) {
    res.status(500).json({ success: false, error: '审核操作失败' })
  }
})

router.post('/:id/reject', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const ok = expertService.rejectExpert(req.params.id)
    if (!ok) {
      res.status(400).json({ success: false, error: '操作失败' })
      return
    }
    res.json({ success: true, message: '已拒绝申请' })
  } catch (err) {
    res.status(500).json({ success: false, error: '操作失败' })
  }
})

export default router
