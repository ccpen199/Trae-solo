/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express'

const router = Router()

const demoUser = {
  id: 'demo-admin',
  name: '平台管理员',
  role: 'admin',
  phone: '13800000000',
}

/**
 * User Login
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  res.status(201).json({
    success: true,
    data: {
      user: {
        ...demoUser,
        phone: req.body?.phone || demoUser.phone,
        name: req.body?.name || demoUser.name,
      },
      token: 'demo-token',
    },
  })
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: {
      user: {
        ...demoUser,
        phone: req.body?.phone || req.body?.username || demoUser.phone,
      },
      token: 'demo-token',
    },
  })
})

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  res.json({ success: true, message: 'ok' })
})

export default router
