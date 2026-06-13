import { Router, type Request, type Response } from 'express'
import { eventService } from '../services/eventService.js'
import { authMiddleware, organizerOrAdmin } from '../middleware/auth.js'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string
    const keyword = req.query.keyword as string
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const result = await eventService.list({ category, keyword, page, pageSize })
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await eventService.detail(parseInt(req.params.id))
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

router.post('/', authMiddleware, organizerOrAdmin, async (req: Request, res: Response) => {
  try {
    const result = await eventService.create(req.body)
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

router.put('/:id', authMiddleware, organizerOrAdmin, async (req: Request, res: Response) => {
  try {
    const result = await eventService.update(parseInt(req.params.id), req.body)
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

export default router
