import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.post('/login', (req: Request, res: Response): void => {
  const { phone, code, role } = req.body

  if (!phone || !code) {
    res.status(400).json({ success: false, error: '请提供手机号和验证码' })
    return
  }

  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any

  if (!user) {
    res.status(404).json({ success: false, error: '用户不存在' })
    return
  }

  if (role && user.role !== role) {
    res.status(403).json({ success: false, error: '角色不匹配' })
    return
  }

  let profile = null
  if (user.role === 'technician') {
    profile = db.prepare('SELECT * FROM technician_profiles WHERE user_id = ?').get(user.id) as any
  }

  const token = `mock_token_${user.id}_${Date.now()}`

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        profile,
      },
    },
  })
})

router.post('/register', (req: Request, res: Response): void => {
  const { phone, name, role } = req.body

  if (!phone || !name || !role) {
    res.status(400).json({ success: false, error: '请提供手机号、姓名和角色' })
    return
  }

  if (!['consumer', 'technician'].includes(role)) {
    res.status(400).json({ success: false, error: '角色只能是 consumer 或 technician' })
    return
  }

  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone) as any
  if (existing) {
    res.status(409).json({ success: false, error: '该手机号已注册' })
    return
  }

  const id = `U${Date.now()}`
  const now = new Date().toISOString()

  db.prepare('INSERT INTO users (id, phone, name, role, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    id, phone, name, role,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    now,
  )

  let profile = null
  if (role === 'technician') {
    const profileId = `TP${Date.now()}`
    db.prepare('INSERT INTO technician_profiles (id, user_id, status, rating, completed_orders, lat, lng, skills) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      profileId, id, 'pending', 0, 0, 39.9042, 116.4074, '[]',
    )
    profile = { id: profileId, user_id: id, status: 'pending', rating: 0, completed_orders: 0, lat: 39.9042, lng: 116.4074, skills: '[]' }
  }

  const token = `mock_token_${id}_${Date.now()}`

  res.status(201).json({
    success: true,
    data: {
      token,
      user: {
        id,
        phone,
        name,
        role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        profile,
      },
    },
  })
})

router.post('/logout', (req: Request, res: Response): void => {
  res.json({ success: true, data: { message: '已登出' } })
})

export default router
