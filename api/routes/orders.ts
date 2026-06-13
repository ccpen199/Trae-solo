import { Router, type Request, type Response } from 'express'
import { orderService } from '../services/orderService.js'
import { refundService } from '../services/refundService.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) throw new Error('未登录')
    const result = await orderService.create(req.user.id, req.body.showtimeId, req.body.seatIds, req.body.paymentMethod, req.body.zhimaAuthCode)
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) throw new Error('未登录')
    const status = req.query.status as string
    const result = await orderService.list(req.user.id, status)
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) throw new Error('未登录')
    const result = await orderService.detail(parseInt(req.params.id), req.user.id)
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

router.post('/:id/refund', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) throw new Error('未登录')
    const result = await refundService.requestRefund(parseInt(req.params.id), req.body.ticketId, req.user.id, req.body.reason, req.body.reasonCategory)
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

export default router
