import { Router, type Request, type Response } from 'express'
import { queueService } from '../services/queueService.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/join', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) throw new Error('未登录')
    const result = await queueService.joinQueue(req.user.id, req.body.showtimeId, req.body.seatIds || [], req.body.priorityBoost)
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

router.get('/:queueId/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await queueService.getStatus(req.params.queueId)
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

router.post('/:queueId/boost', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await queueService.boostQueue(req.params.queueId, req.body.type, req.body.value)
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

export default router
