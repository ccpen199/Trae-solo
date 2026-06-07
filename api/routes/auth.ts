import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import db from '../database.js'
import { generateToken, authMiddleware } from '../middleware/auth.js'
import { decrypt } from '../encryption.js'

const router = Router()

function serializeUser(user: any) {
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    id_number: user.id_number,
    sukang_status: user.sukang_status,
    verified: user.verified,
    verification_level: user.verification_level,
    verification_method: user.verification_method,
    verification_expiry: user.verification_expiry,
    last_verified_at: user.last_verified_at,
    role: user.role,
    street: user.street,
    created_at: user.created_at,
  }
}

function publicAuthProbe(req: Request, res: Response): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.json({ code: 0, message: 'success', data: { authenticated: false, user: null } })
    return
  }

  authMiddleware(req, res, () => {
    try {
      const userId = (req as any).user.id
      const user = db.prepare('SELECT id, phone, name, role, verified, sukang_status, street, verification_level, verification_method, verification_expiry, last_verified_at FROM users WHERE id = ?').get(userId)
      res.json({ code: 0, message: 'success', data: { authenticated: true, user } })
    } catch (error: any) {
      res.json({ code: -1, message: error.message })
    }
  })
}

router.get('/me', publicAuthProbe)

router.post('/register', (req: Request, res: Response): void => {
  try {
    const { phone, password, name } = req.body
    if (!phone || !password) {
      res.json({ code: -1, message: '手机号和密码不能为空' })
      return
    }
    const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone)
    if (existing) {
      res.json({ code: -1, message: '该手机号已注册' })
      return
    }
    const passwordHash = bcrypt.hashSync(password, 10)
    const result = db.prepare('INSERT INTO users (phone, password_hash, name) VALUES (?, ?, ?)').run(phone, passwordHash, name || '')
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(result.lastInsertRowid)) as any
    const token = generateToken({ id: user.id, phone: user.phone, role: user.role })
    res.json({ code: 0, message: 'success', data: { token, user: serializeUser(user) } })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.post('/login', (req: Request, res: Response): void => {
  try {
    const { phone, password } = req.body
    if (!phone || !password) {
      res.json({ code: -1, message: '手机号和密码不能为空' })
      return
    }
    const loginPhone = phone === 'admin' ? '13800000001' : phone
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(loginPhone) as any
    if (!user) {
      res.json({ code: -1, message: '用户不存在' })
      return
    }
    if (!bcrypt.compareSync(password, user.password_hash)) {
      res.json({ code: -1, message: '密码错误' })
      return
    }
    const token = generateToken({ id: user.id, phone: user.phone, role: user.role })
    res.json({ code: 0, message: 'success', data: { token, user: serializeUser(user) } })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.get('/profile', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any
    if (!user) {
      res.json({ code: -1, message: '用户不存在' })
      return
    }
    let idCard = null
    if (user.id_card_encrypted) {
      try { idCard = decrypt(user.id_card_encrypted) } catch { idCard = null }
    }
    res.json({
      code: 0,
      message: 'success',
      data: {
        id_card: idCard,
        ...serializeUser(user),
      },
    })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

export default router
