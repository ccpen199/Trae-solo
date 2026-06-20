import { Router, type Request, type Response } from 'express'
import { AuthService } from '../services/auth.service.js'

const router = Router()

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, role } = req.body
    const result = await AuthService.register({ name, email, password, phone, role })
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : '注册失败' })
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body
    const result = await AuthService.login(email, password)
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(401).json({ success: false, error: error instanceof Error ? error.message : '登录失败' })
  }
})

router.post('/logout', async (_req: Request, res: Response): Promise<void> => {
  try {
    await AuthService.logout()
    res.json({ success: true, data: { message: '登出成功' } })
  } catch (error) {
    res.status(500).json({ success: false, error: '登出失败' })
  }
})

router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      res.status(401).json({ success: false, error: '未登录' })
      return
    }
    const user = await AuthService.getCurrentUser(token)
    if (!user) {
      res.status(401).json({ success: false, error: '用户不存在' })
      return
    }
    res.json({ success: true, data: { user } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取用户信息失败' })
  }
})

export default router
