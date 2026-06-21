import { Router, type Request, type Response } from 'express'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import * as valuationService from '../services/valuationService.js'
import * as aiScreenService from '../services/aiScreenService.js'

const router = Router()

router.post('/calculate', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, era, material, condition, dimensions, provenance, aiAuthenticity, expertRating } = req.body
    if (!category) {
      res.status(400).json({ success: false, error: '品类必填' })
      return
    }
    const result = valuationService.calculateValuation({
      category, era, material, condition, dimensions, provenance, aiAuthenticity, expertRating,
    })
    res.json({ success: true, valuation: result })
  } catch (err) {
    res.status(500).json({ success: false, error: '估值计算失败' })
  }
})

router.get('/historical', async (req: Request, res: Response): Promise<void> => {
  try {
    const category = req.query.category as string | undefined
    const data = valuationService.getHistoricalPrices(category)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取历史价格失败' })
  }
})

router.get('/market-stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = valuationService.getMarketStats()
    res.json({ success: true, stats })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取市场统计失败' })
  }
})

router.post('/ai-analyze', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = aiScreenService.analyzeImage()
    res.json({ success: true, result })
  } catch (err) {
    res.status(500).json({ success: false, error: 'AI分析失败' })
  }
})

router.get('/ai-categories', async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = aiScreenService.getAICategories()
    res.json({ success: true, categories })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取AI分类失败' })
  }
})

export default router
