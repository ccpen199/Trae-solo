import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getDatabase } from '../lib/database.js'
import * as sm4 from '../lib/sm4.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'hrss-platform-secret-key-2024'
const JWT_EXPIRES_IN = '7d'

interface UserRow {
  id: number
  username: string
  password_hash: string
  real_name?: string
  id_card?: string
  phone?: string
  email?: string
  role: string
  status: string
  avatar?: string
  last_login_at?: string
  created_at?: string
  updated_at?: string
}

function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

function sanitizeUser(user: UserRow) {
  return {
    id: user.id,
    username: user.username,
    realName: user.real_name,
    idCard: user.id_card ? sm4.maskIdCard(user.id_card) : undefined,
    phone: user.phone ? sm4.maskPhone(user.phone) : undefined,
    email: user.email,
    role: user.role,
    status: user.status,
    avatar: user.avatar,
    lastLoginAt: user.last_login_at,
    createdAt: user.created_at,
  }
}

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, realName, idCard, phone, email } = req.body

    if (!username || !password) {
      res.status(400).sendJson({
        code: 400,
        message: '用户名和密码不能为空',
        data: null,
        traceId: req.traceId,
      })
      return
    }

    const db = getDatabase()
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as { id?: number } | undefined
    if (existing) {
      res.status(400).sendJson({
        code: 400,
        message: '用户名已存在',
        data: null,
        traceId: req.traceId,
      })
      return
    }

    const passwordHash = bcrypt.hashSync(password, 10)
    const encryptedIdCard = idCard ? sm4.encrypt(idCard) : undefined
    const encryptedPhone = phone ? sm4.encrypt(phone) : undefined

    const result = db.prepare(`
      INSERT INTO users (username, password_hash, real_name, id_card, phone, email, role, status)
      VALUES (?, ?, ?, ?, ?, ?, 'user', 'active')
    `).run(
      username,
      passwordHash,
      realName || null,
      encryptedIdCard || null,
      encryptedPhone || null,
      email || null
    )

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as UserRow
    const token = generateToken(user.id)

    db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id)

    res.status(201).sendJson({
      code: 0,
      message: '注册成功',
      data: {
        user: sanitizeUser(user),
        token,
      },
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({
      code: 500,
      message: '注册失败：' + err.message,
      data: null,
      traceId: req.traceId,
    })
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      res.status(400).sendJson({
        code: 400,
        message: '用户名和密码不能为空',
        data: null,
        traceId: req.traceId,
      })
      return
    }

    const db = getDatabase()
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as UserRow | undefined

    if (!user) {
      res.status(401).sendJson({
        code: 401,
        message: '用户名或密码错误',
        data: null,
        traceId: req.traceId,
      })
      return
    }

    const passwordValid = bcrypt.compareSync(password, user.password_hash)
    if (!passwordValid) {
      res.status(401).sendJson({
        code: 401,
        message: '用户名或密码错误',
        data: null,
        traceId: req.traceId,
      })
      return
    }

    if (user.status !== 'active') {
      res.status(403).sendJson({
        code: 403,
        message: '账户已被禁用',
        data: null,
        traceId: req.traceId,
      })
      return
    }

    const token = generateToken(user.id)
    db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id)

    res.status(200).sendJson({
      code: 0,
      message: '登录成功',
      data: {
        user: sanitizeUser(user),
        token,
      },
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({
      code: 500,
      message: '登录失败：' + err.message,
      data: null,
      traceId: req.traceId,
    })
  }
})

router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).sendJson({
        code: 401,
        message: '未提供有效的身份凭证',
        data: null,
        traceId: req.traceId,
      })
      return
    }

    const token = authHeader.slice(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }

    const db = getDatabase()
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId) as UserRow | undefined

    if (!user) {
      res.status(404).sendJson({
        code: 404,
        message: '用户不存在',
        data: null,
        traceId: req.traceId,
      })
      return
    }

    res.status(200).sendJson({
      code: 0,
      message: '获取用户信息成功',
      data: {
        user: sanitizeUser(user),
        token,
      },
      traceId: req.traceId,
    })
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
      res.status(401).sendJson({
        code: 401,
        message: '身份凭证已过期或无效',
        data: null,
        traceId: req.traceId,
      })
      return
    }
    const err = error as Error
    res.status(500).sendJson({
      code: 500,
      message: '获取用户信息失败：' + err.message,
      data: null,
      traceId: req.traceId,
    })
  }
})

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  res.status(200).sendJson({
    code: 0,
    message: '登出成功',
    data: null,
    traceId: req.traceId,
  })
})

export default router
