import { Router, type Response } from 'express'
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../database.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.post('/register', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, password, name, role } = req.body
    if (!username || !password || !name || !role) {
      res.status(400).json({ success: false, error: '缺少必要字段' })
      return
    }
    const validRoles = ['farmer', 'village', 'township', 'supervisor']
    if (!validRoles.includes(role)) {
      res.status(400).json({ success: false, error: '角色类型无效' })
      return
    }
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
    if (existing) {
      res.status(409).json({ success: false, error: '用户名已存在' })
      return
    }
    const hashedPassword = bcryptjs.hashSync(password, 10)
    const result = db.prepare(
      'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)'
    ).run(username, hashedPassword, name, role)
    res.status(201).json({ success: true, data: { id: result.lastInsertRowid, username, name, role } })
  } catch (error) {
    res.status(500).json({ success: false, error: '注册失败' })
  }
})

router.post('/login', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      res.status(400).json({ success: false, error: '缺少用户名或密码' })
      return
    }
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any
    if (!user) {
      res.status(401).json({ success: false, error: '用户名或密码错误' })
      return
    }
    const valid = bcryptjs.compareSync(password, user.password)
    if (!valid) {
      res.status(401).json({ success: false, error: '用户名或密码错误' })
      return
    }
    const secret = process.env.JWT_SECRET || 'default_secret'
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      secret,
      { expiresIn: '7d' }
    )
    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, username: user.username, name: user.name, role: user.role },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '登录失败' })
  }
})

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = db.prepare('SELECT id, username, name, role, created_at FROM users WHERE id = ?').get(req.user!.id) as any
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }
    res.json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取用户信息失败' })
  }
})

export default router
