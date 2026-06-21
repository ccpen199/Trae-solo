import { Router, type Request, type Response } from 'express'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import * as authService from '../services/authService.js'

const router = Router()

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, phone } = req.body
    if (!username || !email || !password) {
      res.status(400).json({ success: false, error: '用户名、邮箱和密码不能为空' })
      return
    }
    if (password.length < 6) {
      res.status(400).json({ success: false, error: '密码长度至少6位' })
      return
    }
    const result = authService.register(username, email, password, phone)
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error })
      return
    }
    res.json({ success: true, user: result.user, token: result.token })
  } catch (err) {
    res.status(500).json({ success: false, error: '注册失败' })
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body
    if (!identifier || !password) {
      res.status(400).json({ success: false, error: '请输入账号和密码' })
      return
    }
    const result = authService.login(identifier, password)
    if (!result.success) {
      res.status(401).json({ success: false, error: result.error })
      return
    }
    res.json({ success: true, user: result.user, token: result.token })
  } catch (err) {
    res.status(500).json({ success: false, error: '登录失败' })
  }
})

router.post('/logout', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  res.json({ success: true, message: '已退出登录' })
})

router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = authService.getProfile(req.user!.id)
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }
    res.json({ success: true, user })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取用户信息失败' })
  }
})

router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { avatar, phone } = req.body
    const updated = authService.updateProfile(req.user!.id, { avatar, phone })
    if (!updated) {
      res.status(400).json({ success: false, error: '更新失败' })
      return
    }
    const user = authService.getProfile(req.user!.id)
    res.json({ success: true, user })
  } catch (err) {
    res.status(500).json({ success: false, error: '更新用户信息失败' })
  }
})

router.post('/change-password', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword || newPassword.length < 6) {
      res.status(400).json({ success: false, error: '密码格式不正确' })
      return
    }
    const result = authService.changePassword(req.user!.id, oldPassword, newPassword)
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error })
      return
    }
    res.json({ success: true, message: '密码修改成功' })
  } catch (err) {
    res.status(500).json({ success: false, error: '修改密码失败' })
  }
})

export default router
