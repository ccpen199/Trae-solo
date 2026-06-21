import { Router, type Request, type Response } from 'express'
import { users } from '../store/memory.js'
import authMiddleware, { generateToken } from '../middleware/auth.js'
import type { LoginRequest } from '../../shared/types.js'

const router = Router()

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { phone, idCard, verifyCode, ssoToken } = req.body as LoginRequest

  if (!phone && !idCard && !ssoToken) {
    res.status(400).json({ success: false, error: '请提供手机号、身份证号或SSO令牌' })
    return
  }

  const user = users.get('demo-user')
  if (!user) {
    res.status(404).json({ success: false, error: '用户不存在' })
    return
  }

  const token = generateToken(user.id)

  req.auditAction = 'login'
  req.auditModule = 'auth'

  res.json({
    success: true,
    token,
    user,
  })
})

router.get('/userinfo', authMiddleware(), async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId || 'demo-user'
  const user = users.get(userId) || users.get('demo-user')

  if (!user) {
    res.status(404).json({ success: false, error: '用户不存在' })
    return
  }

  req.auditAction = 'get_userinfo'
  req.auditModule = 'auth'

  res.json({
    success: true,
    data: user,
  })
})

router.post('/logout', authMiddleware(true), async (req: Request, res: Response): Promise<void> => {
  req.auditAction = 'logout'
  req.auditModule = 'auth'

  res.json({
    success: true,
    message: '已退出登录',
  })
})

export default router
