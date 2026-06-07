import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
import { getDb } from '../database.js'
import { authMiddleware, generateToken } from '../middleware/auth.js'

const router = Router()

router.post('/register', (req: Request, res: Response): void => {
  try {
    const { username, phone, password, real_name } = req.body
    if (!username || !phone || !password) {
      res.status(400).json({ success: false, error: '用户名、手机号和密码为必填项' })
      return
    }

    const db = getDb()
    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR phone = ?').get(username, phone) as { id: string } | undefined
    if (existing) {
      res.status(409).json({ success: false, error: '用户名或手机号已存在' })
      return
    }

    const passwordHash = bcrypt.hashSync(password, 10)
    const id = uuidv4()
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

    db.prepare(`
      INSERT INTO users (id, username, phone, password_hash, real_name, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'user', ?, ?)
    `).run(id, username, phone, passwordHash, real_name || '', now, now)

    const token = generateToken({ id, username, role: 'user' })

    res.status(201).json({
      success: true,
      data: {
        id,
        username,
        phone,
        real_name: real_name || '',
        role: 'user',
        token,
      },
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ success: false, error: '注册失败，请稍后重试' })
  }
})

router.post('/login', (req: Request, res: Response): void => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      res.status(400).json({ success: false, error: '用户名和密码为必填项' })
      return
    }

    const db = getDb()
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as {
      id: string
      username: string
      phone: string
      password_hash: string
      real_name: string
      role: string
    } | undefined

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      res.status(401).json({ success: false, error: '用户名或密码错误' })
      return
    }

    const token = generateToken({ id: user.id, username: user.username, role: user.role })

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        real_name: user.real_name,
        role: user.role,
        token,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, error: '登录失败，请稍后重试' })
  }
})

router.get('/profile', authMiddleware, (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const user = db.prepare('SELECT id, username, phone, real_name, role, created_at FROM users WHERE id = ?').get(req.user!.id) as {
      id: string
      username: string
      phone: string
      real_name: string
      role: string
      created_at: string
    } | undefined

    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }

    res.json({ success: true, data: user })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ success: false, error: '获取用户信息失败' })
  }
})

router.put('/profile', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { real_name, phone } = req.body
    const db = getDb()

    if (phone) {
      const existing = db.prepare('SELECT id FROM users WHERE phone = ? AND id != ?').get(phone, req.user!.id) as { id: string } | undefined
      if (existing) {
        res.status(409).json({ success: false, error: '该手机号已被使用' })
        return
      }
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const updates: string[] = []
    const values: string[] = []

    if (real_name !== undefined) {
      updates.push('real_name = ?')
      values.push(real_name)
    }
    if (phone !== undefined) {
      updates.push('phone = ?')
      values.push(phone)
    }

    if (updates.length === 0) {
      res.status(400).json({ success: false, error: '没有需要更新的字段' })
      return
    }

    updates.push('updated_at = ?')
    values.push(now)
    values.push(req.user!.id)

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values)

    const updated = db.prepare('SELECT id, username, phone, real_name, role, created_at FROM users WHERE id = ?').get(req.user!.id)
    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ success: false, error: '更新用户信息失败' })
  }
})

export default router
