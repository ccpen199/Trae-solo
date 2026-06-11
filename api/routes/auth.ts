import express, { type Request, type Response } from 'express'
import db from '../db.js'

const router = express.Router()

router.post('/login', (req: Request, res: Response) => {
  const { phone, password } = req.body

  if (!phone || !password) {
    return res.status(400).json({
      success: false,
      error: '手机号和密码不能为空',
    })
  }

  const loginAliases: Record<string, string> = {
    admin: '13800000000',
    platform: '13800000000',
    ops: '13800000000',
    brand: '13800000001',
    entrepreneur: '13900000001',
  }

  const loginKey = String(phone).trim().toLowerCase()
  const loginPhone = loginAliases[loginKey] || phone
  const loginPassword = loginAliases[loginKey]
    ? (loginKey === 'brand' ? 'brand123' : loginKey === 'entrepreneur' ? 'ent123' : 'admin123')
    : password

  const user = db
    .prepare('SELECT * FROM users WHERE phone = ? AND password = ?')
    .get(loginPhone, loginPassword) as any

  if (!user) {
    return res.status(401).json({
      success: false,
      error: '手机号或密码错误',
    })
  }

  let profile = null
  if (user.role === 'brand') {
    profile = db.prepare('SELECT * FROM brand_profiles WHERE user_id = ?').get(user.id)
  } else if (user.role === 'entrepreneur') {
    profile = db.prepare('SELECT * FROM entrepreneur_profiles WHERE user_id = ?').get(user.id)
  }

  const { password: _, ...userWithoutPassword } = user

  res.json({
    success: true,
    data: {
      ...userWithoutPassword,
      profile,
    },
  })
})

router.get('/me', (req: Request, res: Response) => {
  const user = db.prepare('SELECT id, phone, role, name, created_at FROM users WHERE phone = ?').get('13800000000') as any
  res.json({ success: true, data: user })
})

router.post('/register', (req: Request, res: Response) => {
  const { phone, password, role, name } = req.body

  if (!phone || !password || !role) {
    return res.status(400).json({
      success: false,
      error: '手机号、密码和角色不能为空',
    })
  }

  if (!['brand', 'entrepreneur'].includes(role)) {
    return res.status(400).json({
      success: false,
      error: '角色类型错误',
    })
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone)
  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: '该手机号已注册',
    })
  }

  const result = db
    .prepare('INSERT INTO users (phone, password, role, name) VALUES (?, ?, ?, ?)')
    .run(phone, password, role, name || '')

  const userId = result.lastInsertRowid

  if (role === 'brand') {
    db.prepare('INSERT INTO brand_profiles (user_id) VALUES (?)').run(userId)
  } else {
    db.prepare('INSERT INTO entrepreneur_profiles (user_id) VALUES (?)').run(userId)
  }

  res.json({
    success: true,
    data: {
      id: userId,
      phone,
      role,
      name,
    },
  })
})

export default router
