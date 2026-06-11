/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express'

const router = Router()

const demoUser = {
  id: 'user-001',
  phone: '13800138000',
  nickname: '运营管理员',
  role: 'admin',
  permissions: ['station.inspect', 'settlement.manage', 'community.review', 'v2g.configure'],
}

/**
 * User Login
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { phone, username, nickname } = req.body || {}
  res.status(201).json({
    success: true,
    token: 'demo-register-token',
    user: { ...demoUser, phone: phone || demoUser.phone, nickname: nickname || username || demoUser.nickname },
  })
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { phone, username } = req.body || {}
  res.json({
    success: true,
    token: 'demo-login-token',
    user: { ...demoUser, phone: phone || demoUser.phone, nickname: username || demoUser.nickname },
  })
})

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  res.json({ success: true, message: '已退出登录' })
})

router.get('/me', async (_req: Request, res: Response): Promise<void> => {
  res.json({ success: true, user: demoUser, data: demoUser })
})

export default router
