/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express'

const router = Router()

const demoUser = {
  id: 'etc-user-89176',
  username: 'admin',
  phone: '13800138000',
  role: 'admin',
  name: '粤通卡管理员',
  permissions: ['traffic:read', 'settlement:manage', 'obu:manage', 'exception:handle'],
}

/**
 * User Login
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { username, phone, role = 'user' } = req.body || {}
  res.status(201).json({
    success: true,
    data: {
      token: `etc-local-${Date.now()}`,
      user: {
        ...demoUser,
        username: username || phone || demoUser.username,
        phone: phone || demoUser.phone,
        role,
      },
    },
  })
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, phone } = req.body || {}
  res.json({
    success: true,
    data: {
      token: `etc-admin-${Date.now()}`,
      user: {
        ...demoUser,
        username: username || phone || demoUser.username,
        phone: phone || demoUser.phone,
      },
    },
  })
})

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (_req: Request, res: Response): Promise<void> => {
  res.json({ success: true, message: 'logged out' })
})

router.get('/me', async (_req: Request, res: Response): Promise<void> => {
  res.json({ success: true, data: demoUser })
})

router.get('/profile', async (_req: Request, res: Response): Promise<void> => {
  res.json({ success: true, data: demoUser })
})

export default router
