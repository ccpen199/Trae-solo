import { Router, type Request, type Response } from 'express'
import { authService } from '../services/authService.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/register', async (req: Request, res: Response) => {
  try {
    const result = await authService.register(req.body)
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

router.post('/login', async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body)
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) throw new Error('未登录')
    const user = await authService.getMe(req.user.id)
    res.json({ success: true, data: user })
  } catch (e: any) {
    res.json({ success: false, error: e.message })
  }
})

router.post('/logout', async (req: Request, res: Response) => {
  res.json({ success: true })
})

export default router
