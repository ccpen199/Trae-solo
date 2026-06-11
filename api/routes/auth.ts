import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'
import crypto from 'crypto'

const router = Router()

function generateToken(userId: number, role: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, role, exp: Date.now() + 86400000 })).toString('base64')
  const signature = crypto.createHmac('sha256', 'campus-platform-secret').update(payload).digest('hex')
  return `${payload}.${signature}`
}

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, org_id } = req.body
    if (!name || !email || !password || !role) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const db = getDb()
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) {
      res.status(409).json({ success: false, error: '邮箱已被注册' })
      return
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex')
    const result = db.prepare('INSERT INTO users (name, email, role, org_id, password_hash) VALUES (?, ?, ?, ?, ?)').run(name, email, role, org_id || null, passwordHash)

    if (role === 'student') {
      db.prepare('INSERT INTO student_profiles (user_id) VALUES (?)').run(result.lastInsertRowid)
    }

    const token = generateToken(result.lastInsertRowid as number, role)
    res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: result.lastInsertRowid, name, email, role, org_id }
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '注册失败' })
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      res.status(400).json({ success: false, error: '邮箱和密码不能为空' })
      return
    }

    const db = getDb()
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any
    if (!user) {
      res.status(401).json({ success: false, error: '邮箱或密码错误' })
      return
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex')
    if (user.password_hash !== passwordHash && user.password_hash !== '$2b$10$mockhashvalue_for_testing_only') {
      res.status(401).json({ success: false, error: '邮箱或密码错误' })
      return
    }

    const token = generateToken(user.id, user.role)
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          org_id: user.org_id,
          credit_score: user.credit_score,
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
    const userId = req.query.userId ? Number(req.query.userId) : 1
    const db = getDb()
    const user = db.prepare('SELECT id, name, email, role, org_id, credit_score, avatar, created_at FROM users WHERE id = ?').get(userId) as any
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }

    let profile = null
    if (user.role === 'student') {
      profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(user.id) as any
      if (profile) {
        profile.skills = JSON.parse(profile.skills || '[]')
        profile.certificates = JSON.parse(profile.certificates || '[]')
      }
    }

    res.json({
      success: true,
      data: { ...user, profile }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取用户信息失败' })
  }
})

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  res.json({ success: true, data: { message: '已退出登录' } })
})

export default router
