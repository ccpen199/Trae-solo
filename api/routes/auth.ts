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
  const { username, phone, role = 'user' } = req.body || {}
  res.status(201).json({
    success: true,
    data: {
      token: `local-${Date.now()}`,
      user: {
        id: 'local-user-1',
        username: username || phone || '13800138000',
        phone: phone || username || '13800138000',
        role,
        name: role === 'admin' ? '平台管理员' : '安居用户',
      },
    },
  })
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, phone, role = 'user' } = req.body || {}
  const normalizedRole = role === 'admin' || String(username || phone || '').includes('admin') ? 'admin' : role
  res.json({
    success: true,
    data: {
      token: `local-${normalizedRole}-${Date.now()}`,
      user: {
        id: normalizedRole === 'admin' ? 'admin-1' : 'user-1',
        username: username || phone || '13800138000',
        phone: phone || username || '13800138000',
        role: normalizedRole,
        name: normalizedRole === 'admin' ? '平台管理员' : '安居用户',
      },
    },
  })
})

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  res.json({ success: true, message: 'logged out' })
})

export default router
