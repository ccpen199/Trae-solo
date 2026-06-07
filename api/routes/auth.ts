import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import db from '../db.js'
import { generateToken, authMiddleware } from '../auth.js'

const router = Router()

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, role, real_name, id_number, phone } = req.body
    if (!username || !password || !role || !real_name) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }
    if (!['taxpayer', 'admin', 'agent'].includes(role)) {
      res.status(400).json({ success: false, error: '无效角色' })
      return
    }
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
    if (existing) {
      res.status(409).json({ success: false, error: '用户名已存在' })
      return
    }
    const hash = bcrypt.hashSync(password, 10)
    const result = db.prepare(
      'INSERT INTO users (username, password_hash, role, real_name, id_number, phone) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(username, hash, role, real_name, id_number || null, phone || null)

    db.prepare('INSERT INTO audit_logs (user_id, action, module, detail, ip) VALUES (?, ?, ?, ?, ?)')
      .run(Number(result.lastInsertRowid), 'register', 'auth', `用户 ${username} 注册`, req.ip || '')

    res.json({ success: true, data: { id: result.lastInsertRowid, username, role } })
  } catch (err) {
    res.status(500).json({ success: false, error: '注册失败' })
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      res.status(400).json({ success: false, error: '缺少用户名或密码' })
      return
    }
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      res.status(401).json({ success: false, error: '用户名或密码错误' })
      return
    }
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      real_name: user.real_name,
    })
    db.prepare('INSERT INTO audit_logs (user_id, action, module, detail, ip) VALUES (?, ?, ?, ?, ?)')
      .run(user.id, 'login', 'auth', `用户 ${username} 登录`, req.ip || '')
    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, username: user.username, role: user.role, real_name: user.real_name, phone: user.phone },
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: '登录失败' })
  }
})

router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = db.prepare('SELECT id, username, role, real_name, id_number, phone, digital_cert, created_at FROM users WHERE id = ?').get(req.user!.id) as any
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }
    const taxpayers = db.prepare('SELECT * FROM taxpayers WHERE user_id = ?').all(user.id)
    res.json({ success: true, data: { ...user, taxpayers } })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取用户信息失败' })
  }
})

router.post('/logout', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  db.prepare('INSERT INTO audit_logs (user_id, action, module, detail, ip) VALUES (?, ?, ?, ?, ?)')
    .run(req.user!.id, 'logout', 'auth', `用户 ${req.user!.username} 登出`, req.ip || '')
  res.json({ success: true })
})

export default router
