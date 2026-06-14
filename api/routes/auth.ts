import { Router, type Request, type Response } from 'express'
import { users } from '../../src/mock/data.js'
import type { User, PageRole } from '../../src/types/index.js'

const router = Router()

interface LoginRequest {
  phone: string
  password?: string
  role?: PageRole
}

interface RegisterRequest {
  phone: string
  password: string
  nickname: string
  role?: PageRole
}

let nextUserId = 100

const generateToken = (userId: number, role: PageRole): string => {
  return Buffer.from(`${userId}:${role}:${Date.now()}`).toString('base64')
}

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { phone, password, nickname, role = 'user' } = req.body as RegisterRequest

  if (!phone || !password || !nickname) {
    res.status(400).json({
      success: false,
      error: '手机号、密码和昵称不能为空',
    })
    return
  }

  const existing = users.find(u => u.phone === phone)
  if (existing) {
    res.status(409).json({
      success: false,
      error: '该手机号已注册',
    })
    return
  }

  const newUser: User = {
    id: nextUserId++,
    phone,
    nickname,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nickname}`,
    created_at: new Date().toISOString(),
  }

  users.push(newUser)

  const token = generateToken(newUser.id, role)

  res.status(201).json({
    success: true,
    data: {
      user: newUser,
      token,
      role,
    },
  })
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { phone, role = 'user' } = req.body as LoginRequest

  if (!phone) {
    res.status(400).json({
      success: false,
      error: '手机号不能为空',
    })
    return
  }

  let user = users.find(u => u.phone === phone)

  if (!user) {
    user = {
      id: nextUserId++,
      phone,
      nickname: `用户${phone.slice(-4)}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}`,
      created_at: new Date().toISOString(),
    }
    users.push(user)
  }

  const token = generateToken(user.id, role)

  res.status(200).json({
    success: true,
    data: {
      user,
      token,
      role,
    },
  })
})

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    message: '登出成功',
  })
})

router.get('/me', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: '未登录',
    })
    return
  }

  const token = authHeader.slice(7)
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [userIdStr] = decoded.split(':')
    const userId = parseInt(userIdStr, 10)
    const user = users.find(u => u.id === userId)

    if (!user) {
      res.status(401).json({
        success: false,
        error: '用户不存在',
      })
      return
    }

    res.status(200).json({
      success: true,
      data: user,
    })
  } catch {
    res.status(401).json({
      success: false,
      error: '无效的token',
    })
  }
})

export default router
