import { Router, type Request, type Response } from 'express'
import { hash, compare } from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../db.js'

const JWT_SECRET = process.env.JWT_SECRET || 'bxgz_media_platform_secret_key_2026'

const router = Router()

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, phone, password, real_name } = req.body

    if (!username || !password) {
      res.status(400).json({ success: false, error: '用户名和密码不能为空' })
      return
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
    if (existing) {
      res.status(409).json({ success: false, error: '用户名已存在' })
      return
    }

    const password_hash = await hash(password, 10)

    const stmt = db.prepare(
      'INSERT INTO users (username, phone, password_hash, real_name) VALUES (?, ?, ?, ?)'
    )
    const result = stmt.run(username, phone || null, password_hash, real_name || null)

    const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(result.lastInsertRowid)

    res.json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, error: '注册失败' })
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any
    if (!user) {
      res.status(401).json({ success: false, error: '用户名或密码错误' })
      return
    }

    const isMatch = await compare(password, user.password_hash)
    if (!isMatch) {
      res.status(401).json({ success: false, error: '用户名或密码错误' })
      return
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          real_name: user.real_name,
          role: user.role,
          avatar: user.avatar
        }
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '登录失败' })
  }
})

router.get('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      res.status(401).json({ success: false, error: '未登录' })
      return
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }
    const user = db.prepare(
      'SELECT id, username, phone, real_name, avatar, role, region_code, status, created_at FROM users WHERE id = ?'
    ).get(decoded.userId)

    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }

    res.json({ success: true, data: user })
  } catch (error) {
    res.status(401).json({ success: false, error: '登录已过期' })
  }
})

router.put('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      res.status(401).json({ success: false, error: '未登录' })
      return
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }

    const { real_name, avatar, phone } = req.body

    db.prepare(
      'UPDATE users SET real_name = ?, avatar = ?, phone = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).run(real_name || null, avatar || null, phone || null, decoded.userId)

    const user = db.prepare(
      'SELECT id, username, phone, real_name, avatar, role, region_code, status, created_at FROM users WHERE id = ?'
    ).get(decoded.userId)

    res.json({ success: true, data: user })
  } catch (error) {
    res.status(401).json({ success: false, error: '登录已过期' })
  }
})

export default router
