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
  res.status(200).json({
    success: true,
    data: {
      id: 'user-demo',
      name: req.body?.name || '李晓芳',
      role: 'dealer',
      message: '注册成功，已创建演示直销经理账号',
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
    token: 'demo-token-may-89128',
    data: {
      id: 'manager-demo',
      name: '李晓芳',
      role: 'manager',
      username: req.body?.username || req.body?.account || 'admin',
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
    message: '已退出登录',
  })
})

router.get('/me', async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    data: {
      id: 'manager-demo',
      name: '李晓芳',
      role: 'manager',
      permissions: ['dashboard:view', 'dealers:manage', 'compliance:review'],
    },
  })
})

export default router
