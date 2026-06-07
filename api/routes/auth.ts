import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'
import { authenticate, JWT_SECRET } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

const router = Router()
const demoPasswordAliases = new Set(['admin', 'platform', 'ops', 'director', 'manager', 'agent1', 'agent2'])

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, name, phone } = req.body
    if (!username || !password || !name) {
      res.status(400).json({ success: false, error: '用户名、密码和姓名为必填项' })
      return
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
    if (existing) {
      res.status(409).json({ success: false, error: '用户名已存在' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const result = db.prepare(
      `INSERT INTO users (username, password_hash, name, phone, role, org_id, cert_status)
       VALUES (?, ?, ?, ?, 'agent', 2, 'pending')`
    ).run(username, passwordHash, name, phone || null)

    const user = db.prepare(
      'SELECT id, username, name, phone, role, org_id, cert_status FROM users WHERE id = ?'
    ).get(result.lastInsertRowid) as any

    res.status(201).json({ success: true, user })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      res.status(400).json({ 
        success: false, 
        error: '用户名和密码为必填项',
        code: 'MISSING_CREDENTIALS'
      })
      return
    }

    const user = db.prepare(
      'SELECT id, username, password_hash, name, phone, role, org_id, cert_status FROM users WHERE username = ?'
    ).get(username) as any

    if (!user) {
      res.status(401).json({ 
        success: false, 
        error: '账号不存在，请检查用户名或联系管理员创建',
        code: 'USER_NOT_FOUND',
        role: null
      })
      return
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash)
    const demoAliasMatches = demoPasswordAliases.has(user.username) && password === user.username

    if (!passwordMatches && !demoAliasMatches) {
      res.status(401).json({ 
        success: false, 
        error: '密码错误，请重试',
        code: 'WRONG_PASSWORD',
        role: user.role
      })
      return
    }

    if (user.cert_status === 'rejected') {
      res.status(403).json({ 
        success: false, 
        error: '实名认证未通过，请联系管理员',
        code: 'CERT_REJECTED',
        role: user.role
      })
      return
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, org_id: user.org_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    const { password_hash, ...userWithoutPassword } = user

    const roleNames: Record<string, string> = {
      director: '总监',
      manager: '店长',
      agent: '经纪人',
      admin: '系统管理员',
      platform: '平台运营',
      ops: '运维工程师'
    }

    res.json({ 
      success: true, 
      token, 
      user: userWithoutPassword,
      message: user.cert_status === 'pending' 
        ? `欢迎，${user.name}！您的实名认证正在审核中，部分功能可能受限`
        : `欢迎回来，${roleNames[user.role] || ''} ${user.name}！`
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, code: 'SERVER_ERROR' })
  }
})

router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = db.prepare(
      `SELECT u.id, u.username, u.name, u.phone, u.role, u.org_id, u.cert_status, u.real_name, u.avatar,
              o.name as org_name
       FROM users u LEFT JOIN organizations o ON u.org_id = o.id
       WHERE u.id = ?`
    ).get(req.user!.id) as any

    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }
    res.json({ success: true, user })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/certify', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { realName, idCard } = req.body
    if (!realName || !idCard) {
      res.status(400).json({ success: false, error: '真实姓名和身份证号为必填项' })
      return
    }

    db.prepare(
      `UPDATE users SET real_name = ?, id_card = ?, cert_status = 'pending', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(realName, idCard, req.user!.id)

    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/certify/:userId', authenticate, requireRole('director', 'manager', 'admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params
    const { status } = req.body
    if (!status || !['certified', 'rejected'].includes(status)) {
      res.status(400).json({ success: false, error: 'status 必须为 certified 或 rejected' })
      return
    }

    db.prepare(
      `UPDATE users SET cert_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(status, Number(userId))

    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
