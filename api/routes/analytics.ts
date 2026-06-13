import { Router, type Request, type Response } from 'express'
import { analyticsService } from '../services/analyticsService.js'
import { authMiddleware, adminOnly } from '../middleware/auth.js'

const router = Router()

router.get('/heatmap/:showtimeId', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const result = await analyticsService.getHeatmap(parseInt(req.params.showtimeId))
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

router.get('/sales-ranking', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const type = req.query.type as 'zone' | 'event' || 'zone'
    const period = req.query.period as string
    const result = await analyticsService.getSalesRanking(type, period)
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

router.get('/refund-analysis', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const period = req.query.period as string
    const result = await analyticsService.getRefundAnalysis(period)
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

export default router
