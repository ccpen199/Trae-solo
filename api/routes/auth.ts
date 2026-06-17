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
  res.status(201).json({
    success: true,
    data: {
      id: 'demo-owner',
      name: req.body?.name || '示例业主',
      role: 'owner',
    },
  })
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    token: 'local-demo-token',
    data: {
      id: 'u001',
      name: '张明华',
      role: 'council_director',
      phone: req.body?.phone || '13800000000',
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
