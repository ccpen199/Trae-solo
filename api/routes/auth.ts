import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { getDb } from '../db/init.js'
import { auth, signToken } from '../middleware/auth.js'
import type { User, UserRole } from '../../shared/types.js'

const router = Router()

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { username, email, password, role } = req.body as {
    username: string
    email: string
    password: string
    role: UserRole
  }

  if (!username || !email || !password || !role) {
    res.status(400).json({
      success: false,
      error: '缺少必要字段：用户名、邮箱、密码和角色',
    })
    return
  }

  if (!['student', 'enterprise', 'mentor'].includes(role)) {
    res.status(400).json({
      success: false,
      error: '角色必须是 student、enterprise 或 mentor',
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

  const db = getDb()

  const existingUser = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username)
  if (existingUser) {
    res.status(409).json({
      success: false,
      error: '用户名或邮箱已被注册',
    })
    return
  }

  const passwordHash = bcrypt.hashSync(password, 10)
  const now = new Date().toISOString()

  const insertUser = db.prepare(
    'INSERT INTO users (username, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  )

  const result = insertUser.run(username, email, passwordHash, role, now, now)
  const userId = result.lastInsertRowid as number

  if (role === 'student') {
    db.prepare(
      'INSERT INTO student_profiles (user_id, real_name, school, major, grade) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, username, '待完善', '待完善', '待完善')
  } else if (role === 'enterprise') {
    db.prepare(
      'INSERT INTO enterprise_profiles (user_id, company_name, verified) VALUES (?, ?, ?)'
    ).run(userId, username, 0)
  } else if (role === 'mentor') {
    db.prepare(
      'INSERT INTO mentors (user_id, real_name, company, position) VALUES (?, ?, ?, ?)'
    ).run(userId, username, '待完善', '待完善')
  }

  const token = signToken({ userId, email, role })

  const user = db.prepare('SELECT id, username, email, role, avatar, phone, created_at FROM users WHERE id = ?').get(userId)

  res.status(201).json({
    success: true,
    message: '注册成功',
    data: {
      token,
      user,
    },
  })
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string }

  if (!email || !password) {
    res.status(400).json({
      success: false,
      error: '请输入邮箱和密码',
    })
    return
  }

  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined

  if (!user) {
    res.status(401).json({
      success: false,
      error: '邮箱或密码错误',
    })
    return
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password_hash)
  if (!isPasswordValid) {
    res.status(401).json({
      success: false,
      error: '邮箱或密码错误',
    })
    return
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role })

  const { password_hash: _pw, ...safeUser } = user

  let profile = null
  if (user.role === 'student') {
    profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(user.id)
  } else if (user.role === 'enterprise') {
    profile = db.prepare('SELECT * FROM enterprise_profiles WHERE user_id = ?').get(user.id)
  } else if (user.role === 'mentor') {
    profile = db.prepare('SELECT * FROM mentors WHERE user_id = ?').get(user.id)
  }

  res.json({
    success: true,
    message: '登录成功',
    data: {
      token,
      user: safeUser,
      profile,
    },
  })
})

router.get('/me', auth, async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const user = db.prepare('SELECT id, username, email, role, avatar, phone, created_at, updated_at FROM users WHERE id = ?').get(req.user!.userId) as User | undefined

  if (!user) {
    res.status(404).json({
      success: false,
      error: '用户不存在',
    })
    return
  }

  let profile = null
  if (user.role === 'student') {
    profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(user.id)
  } else if (user.role === 'enterprise') {
    profile = db.prepare('SELECT * FROM enterprise_profiles WHERE user_id = ?').get(user.id)
  } else if (user.role === 'mentor') {
    profile = db.prepare('SELECT * FROM mentors WHERE user_id = ?').get(user.id)
  }

  res.json({
    success: true,
    data: {
      user,
      profile,
    },
  })
})

router.put('/me', auth, async (req: Request, res: Response): Promise<void> => {
  const { username, avatar, phone } = req.body
  const db = getDb()
  const userId = req.user!.userId

  db.prepare('UPDATE users SET username = COALESCE(?, username), avatar = COALESCE(?, avatar), phone = COALESCE(?, phone), updated_at = datetime("now") WHERE id = ?')
    .run(username ?? null, avatar ?? null, phone ?? null, userId)

  const user = db.prepare('SELECT id, username, email, role, avatar, phone, created_at, updated_at FROM users WHERE id = ?').get(userId)

  res.json({
    success: true,
    message: '用户信息更新成功',
    data: { user },
  })
})

router.post('/logout', auth, async (_req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    message: '退出登录成功',
  })
})

export default router
