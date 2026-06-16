import { Router, type Request, type Response } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { login, register, getUserById } from '../services/authService.js'
import type { UserRole } from '@shared/types'

const router = Router()

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password } = req.body

    if (!phone || !password) {
      res.status(400).json({
        success: false,
        error: '手机号和密码不能为空',
      })
      return
    }

    const result = login({ phone, password })

    res.json({
      success: true,
      data: result,
    })
  } catch (err) {
    res.status(401).json({
      success: false,
      error: (err as Error).message,
    })
  }
})

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password, nickname, role, avatar } = req.body

    if (!phone || !password || !nickname) {
      res.status(400).json({
        success: false,
        error: '手机号、密码和昵称不能为空',
      })
      return
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: '密码长度至少6位',
      })
      return
    }

    const validRoles: UserRole[] = ['owner', 'doctor', 'hospital', 'merchant']
    if (role && !validRoles.includes(role)) {
      res.status(400).json({
        success: false,
        error: '无效的用户角色',
      })
      return
    }

    const result = register({ phone, password, nickname, role, avatar })

    res.json({
      success: true,
      data: result,
    })
  } catch (err) {
    res.status(400).json({
      success: false,
      error: (err as Error).message,
    })
  }
})

router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '未登录',
      })
      return
    }

    const user = getUserById(req.user.id)
    if (!user) {
      res.status(404).json({
        success: false,
        error: '用户不存在',
      })
      return
    }

    res.json({
      success: true,
      data: user,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取用户信息失败',
    })
  }
})

export default router
