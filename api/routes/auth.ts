/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express'

const router = Router()

const demoUsers = [
  {
    id: 'user-demo',
    phone: '13800138001',
    nickname: '演示用户',
    role: 'user' as const,
    createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  },
  {
    id: 'admin-demo',
    phone: '13800138000',
    nickname: '平台管理员',
    role: 'admin' as const,
    createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  },
]

function makeToken(userId: string) {
  return Buffer.from(`${userId}:${Date.now()}`).toString('base64url')
}

/**
 * User Register
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { phone, nickname } = req.body || {}
  if (!phone) {
    res.status(400).json({ success: false, error: '手机号不能为空' })
    return
  }

  const user = {
    id: `user-${String(phone).slice(-4)}`,
    phone: String(phone),
    nickname: nickname || `用户${String(phone).slice(-4)}`,
    role: 'user' as const,
    createdAt: new Date().toISOString(),
  }

  res.status(201).json({
    success: true,
    message: '注册成功',
    data: {
      user,
      token: makeToken(user.id),
    },
  })
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { phone, username } = req.body || {}
  const isAdmin = String(username || phone || '').toLowerCase().includes('admin')
  const user = isAdmin ? demoUsers[1] : demoUsers[0]

  res.status(200).json({
    success: true,
    message: '登录成功',
    data: {
      user,
      token: makeToken(user.id),
    },
  })
})

/**
 * Current user
 * GET /api/auth/me
 */
router.get('/me', async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    data: demoUsers[0],
  })
})

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    message: '已退出登录',
  })
})

export default router
