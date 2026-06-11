/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express'

const router = Router()

/**
 * User Login
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { username, phone } = req.body || {}
  res.status(201).json({
    success: true,
    token: 'demo-register-token',
    user: {
      id: 'citizen-demo',
      username: username || '惠民市民',
      phone: phone || '13800138000',
      role: 'citizen',
    },
  })
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, phone } = req.body || {}
  res.status(200).json({
    success: true,
    token: 'demo-login-token',
    user: {
      id: 'admin-demo',
      username: username || phone || '管理员张明',
      phone: phone || '13800138000',
      role: 'admin',
      permissions: ['coupon.manage', 'merchant.audit', 'settlement.approve'],
    },
  })
})

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({ success: true, message: 'logged out' })
})

router.get('/me', async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    user: {
      id: 'admin-demo',
      username: '管理员张明',
      phone: '13800138000',
      role: 'admin',
    },
  })
})

export default router
