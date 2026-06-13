import { Router, type Request, type Response } from 'express'
import { organizerService } from '../services/organizerService.js'
import { authMiddleware, adminOnly } from '../middleware/auth.js'

const router = Router()

router.post('/apply', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) throw new Error('未登录')
    const result = await organizerService.apply(req.user.id, req.body)
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) throw new Error('未登录')
    const result = await organizerService.getByUserId(req.user.id)
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

router.get('/', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string
    const result = await organizerService.list(status)
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

router.put('/:id/review', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const result = await organizerService.review(parseInt(req.params.id), req.body.status, req.body.reason)
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

export default router
