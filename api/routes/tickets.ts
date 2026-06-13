import { Router, type Request, type Response } from 'express'
import { ticketService } from '../services/ticketService.js'
import { creditService } from '../services/creditService.js'
import { authMiddleware, adminOnly } from '../middleware/auth.js'

const router = Router()

router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) throw new Error('未登录')
    const result = await ticketService.detail(parseInt(req.params.id), req.user.id)
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

router.post('/verify', async (req: Request, res: Response) => {
  try {
    const result = await ticketService.verify(req.body.antiFakeCode)
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

router.post('/:id/checkin', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await ticketService.checkin(parseInt(req.params.id), req.body.gateId)
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

router.get('/credit/check', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) throw new Error('未登录')
    const result = await creditService.checkCredit(req.user.id)
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

router.post('/refund/:id/review', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const refundService = await import('../services/refundService.js')
    const result = await refundService.refundService.reviewRefund(parseInt(req.params.id), req.body.status, req.body.reason)
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

export default router
