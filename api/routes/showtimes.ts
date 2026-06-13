import { Router, type Request, type Response } from 'express'
import { showtimeService } from '../services/showtimeService.js'
import { authMiddleware, organizerOrAdmin } from '../middleware/auth.js'

const router = Router()

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await showtimeService.detail(parseInt(req.params.id))
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

router.get('/:id/seats', async (req: Request, res: Response) => {
  try {
    const result = await showtimeService.getSeats(parseInt(req.params.id))
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

router.post('/:id/select-seats', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) throw new Error('未登录')
    const result = await showtimeService.selectSeats(parseInt(req.params.id), req.body.seatIds, req.user.id)
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

router.post('/', authMiddleware, organizerOrAdmin, async (req: Request, res: Response) => {
  try {
    const result = await showtimeService.create(req.body)
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

export default router
