import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../database.js'
import { authMiddleware, JWT_SECRET } from '../middleware/auth.js'

const router = Router()

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password, role, name, company, licenseNo, vehicleType, capacity, plateNo } = req.body
    if (!phone || !password || !role || !name) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }
    const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone)
    if (existing) {
      res.status(400).json({ success: false, error: '手机号已注册' })
      return
    }
    const passwordHash = bcrypt.hashSync(password, 10)
    const insertUser = db.prepare('INSERT INTO users (phone, password_hash, name, role, company) VALUES (?, ?, ?, ?, ?)')
    const result = insertUser.run(phone, passwordHash, name, role, company || null)
    const userId = result.lastInsertRowid

    if (role === 'driver' && licenseNo && vehicleType && capacity && plateNo) {
      db.prepare('INSERT INTO driver_profiles (user_id, license_no, vehicle_type, capacity, plate_no) VALUES (?, ?, ?, ?, ?)')
        .run(Number(userId), licenseNo, vehicleType, capacity, plateNo)
    }

    if (role === 'shipper') {
      db.prepare('INSERT INTO shipper_credits (shipper_id, credit_limit, used_amount, available_amount) VALUES (?, 50000, 0, 50000)')
        .run(Number(userId))
    }

    const token = jwt.sign({ userId: Number(userId), role, phone }, JWT_SECRET, { expiresIn: '7d' })
    res.status(201).json({ success: true, userId: Number(userId), token, message: '注册成功' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password, role } = req.body
    if (!phone || !password) {
      res.status(400).json({ success: false, error: '缺少手机号或密码' })
      return
    }
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      res.status(401).json({ success: false, error: '手机号或密码错误' })
      return
    }
    if (role && user.role !== role) {
      res.status(403).json({ success: false, error: '角色不匹配' })
      return
    }
    const token = jwt.sign({ userId: user.id, role: user.role, phone: user.phone }, JWT_SECRET, { expiresIn: '7d' })
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        company: user.company,
        createdAt: user.created_at,
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/profile', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId
    const user = db.prepare('SELECT id, phone, name, role, company, created_at FROM users WHERE id = ?').get(userId) as any
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }
    let profile: any = null
    if (user.role === 'driver') {
      profile = db.prepare('SELECT * FROM driver_profiles WHERE user_id = ?').get(userId) as any
    }
    if (user.role === 'shipper') {
      profile = db.prepare('SELECT * FROM shipper_credits WHERE shipper_id = ?').get(userId) as any
    }
    res.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        company: user.company,
        createdAt: user.created_at,
        profile,
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
