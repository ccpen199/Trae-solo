import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { v4 as uuidv4 } from 'uuid'
import { signToken, authMiddleware } from '../middleware/auth.js'
import jwt from 'jsonwebtoken'

const router = Router()

router.post('/send-code', (req: Request, res: Response): void => {
  const { phone } = req.body
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    res.status(400).json({ success: false, error: '手机号格式不正确' })
    return
  }
  res.json({ success: true, message: '验证码已发送(模拟: 123456)' })
})

router.post('/login', (req: Request, res: Response): void => {
  const { phone, code, role } = req.body
  if (!phone || !code || !role) {
    res.status(400).json({ success: false, error: '参数不完整' })
    return
  }
  if (code !== '123456') {
    res.status(400).json({ success: false, error: '验证码错误' })
    return
  }
  if (!['driver', 'shipper', 'admin'].includes(role)) {
    res.status(400).json({ success: false, error: '角色不正确' })
    return
  }

  let user = db.prepare('SELECT * FROM users WHERE phone = ? AND role = ?').get(phone, role) as any

  if (!user) {
    const id = `u_${role.substring(0, 3)}_${uuidv4().substring(0, 8)}`
    const defaultName = role === 'driver' ? '新司机用户' : role === 'shipper' ? '新货主用户' : '管理员'
    db.prepare('INSERT INTO users (id, phone, name, role) VALUES (?, ?, ?, ?)').run(id, phone, defaultName, role)
    
    if (role === 'driver') {
      db.prepare('INSERT INTO driver_profiles (id, user_id) VALUES (?, ?)').run(uuidv4(), id)
    } else if (role === 'shipper') {
      db.prepare('INSERT INTO shipper_profiles (id, user_id) VALUES (?, ?)').run(uuidv4(), id)
    }
    
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  }

  const token = signToken({ userId: String(user.id), role: user.role, phone: user.phone })
  res.json({ success: true, token, user })
})

router.get('/me', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = req.user!.userId
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
    if (!user) {
      res.status(401).json({ success: false, error: '用户不存在' })
      return
    }

    const fetchedUser = user as any
    let profile = null
    if (fetchedUser.role === 'driver') {
      profile = db.prepare('SELECT * FROM driver_profiles WHERE user_id = ?').get(fetchedUser.id)
    } else if (fetchedUser.role === 'shipper') {
      profile = db.prepare('SELECT * FROM shipper_profiles WHERE user_id = ?').get(fetchedUser.id)
    }

    res.json({ success: true, data: fetchedUser, user: fetchedUser, profile })
  } catch (e: any) {
    res.status(401).json({ success: false, error: 'Token无效', message: e.message })
  }
})

export default router
