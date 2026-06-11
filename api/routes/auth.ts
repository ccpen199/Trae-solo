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
  const phone = String(req.body?.phone || '138****8888')
  res.status(200).json({
    success: true,
    token: `mock-register-${Date.now()}`,
    user: {
      id: 'U001',
      name: '张明',
      phone,
      role: 'personal',
      authStatus: 'verified',
    },
  })
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const phone = String(req.body?.phone || req.body?.username || '138****8888')
  res.status(200).json({
    success: true,
    token: `mock-login-${Date.now()}`,
    user: {
      id: 'U001',
      name: '张明',
      phone,
      role: 'personal',
      authStatus: 'verified',
    },
  })
})

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    message: 'logged out',
  })
})

export default router
