/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express'

const router = Router()

const users = new Map<string, { id: string; username: string; password: string; role: string }>([
  ['demo', { id: 'user-demo', username: 'demo', password: 'demo1234', role: 'user' }],
  ['admin', { id: 'user-admin', username: 'admin', password: 'admin1234', role: 'admin' }],
])

function publicUser(user: { id: string; username: string; role: string }) {
  return {
    id: user.id,
    username: user.username,
    name: user.username === 'admin' ? '运营管理员' : '购房用户',
    role: user.role,
  }
}

function authPayload(user: { id: string; username: string; role: string }) {
  return {
    success: true,
    data: {
      token: `local-token-${user.id}`,
      user: publicUser(user),
    },
    message: 'ok',
  }
}

/**
 * User Login
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const username = String(req.body?.username || req.body?.phone || req.body?.email || '').trim()
  const password = String(req.body?.password || 'demo1234')
  if (!username) {
    res.status(400).json({ success: false, error: 'username is required' })
    return
  }
  const user = {
    id: `user-${Date.now()}`,
    username,
    password,
    role: 'user',
  }
  users.set(username, user)
  res.status(201).json(authPayload(user))
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const username = String(req.body?.username || req.body?.phone || req.body?.email || 'demo').trim()
  const password = String(req.body?.password || '')
  const user = users.get(username)
  if (!user || (password && user.password !== password)) {
    res.status(401).json({ success: false, error: '用户名或密码错误' })
    return
  }
  res.json(authPayload(user))
})

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  res.json({ success: true, message: '已退出登录' })
})

export default router
