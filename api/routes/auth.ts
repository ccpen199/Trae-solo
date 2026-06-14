import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { v4 as uuidv4 } from 'uuid'
import { signToken, authMiddleware } from '../middleware/auth.js'
import jwt from 'jsonwebtoken'

const router = Router()

const demoLoginAliases: Record<string, { phone: string; role: 'driver' | 'shipper' | 'admin' }> = {
  admin: { phone: '13700137001', role: 'admin' },
  platform: { phone: '13700137001', role: 'admin' },
  ops: { phone: '13700137001', role: 'admin' },
  driver: { phone: '13800138001', role: 'driver' },
  shipper: { phone: '13900139001', role: 'shipper' },
}

router.post('/send-code', (req: Request, res: Response): void => {
  const { phone } = req.body
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    res.status(400).json({ success: false, error: '手机号格式不正确' })
    return
  }
  res.json({ success: true, message: '验证码已发送(模拟: 123456)' })
})

router.post('/login', (req: Request, res: Response): void => {
  let { phone, code, role } = req.body
  const alias = typeof phone === 'string' ? demoLoginAliases[phone.trim().toLowerCase()] : null
  if (alias && (code === '123456' || String(code || '').trim().toLowerCase() === String(phone).trim().toLowerCase())) {
    phone = alias.phone
    code = '123456'
    role = alias.role
  }

  if (!phone || !code || !role) {
    res.status(400).json({ success: false, error: '请填写手机号、验证码和角色' })
    return
  }
  if (!/^1\d{10}$/.test(phone)) {
    res.status(400).json({ success: false, error: '手机号格式不正确' })
    return
  }
  if (code !== '123456') {
    res.status(400).json({ success: false, error: '验证码错误（演示环境：123456）' })
    return
  }
  if (!['driver', 'shipper', 'admin'].includes(role)) {
    res.status(400).json({ success: false, error: '角色不正确' })
    return
  }

  let user = db.prepare('SELECT * FROM users WHERE phone = ? AND role = ?').get(phone, role) as any

  if (!user) {
    const rolePhoneUser = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any
    if (rolePhoneUser) {
      res.status(400).json({
        success: false,
        error: `该账号已注册为「${rolePhoneUser.role === 'driver' ? '司机' : rolePhoneUser.role === 'shipper' ? '货主' : '管理员'}」，请选择正确角色登录`
      })
      return
    }

    if (role === 'admin') {
      res.status(400).json({ success: false, error: '管理员账号不存在，请联系系统管理员' })
      return
    }

    const userCols = db.prepare('PRAGMA table_info(users)').all() as { name: string; type: string; pk: number }[]
    const idCol = userCols.find(c => c.pk === 1)
    const isIntId = idCol && /INT/i.test(idCol.type)

    const defaultName = role === 'driver' ? '新司机用户' : '新货主用户'
    let info
    if (isIntId) {
      info = db.prepare('INSERT INTO users (phone, name, role, username, password, avatar) VALUES (?, ?, ?, ?, \'xxxx\', \'\')').run(phone, defaultName, role, phone)
    } else {
      const id = `u_${role.substring(0, 3)}_${uuidv4().substring(0, 8)}`
      info = db.prepare('INSERT INTO users (id, phone, name, role, username, password, avatar) VALUES (?, ?, ?, ?, ?, \'xxxx\', \'\')').run(id, phone, defaultName, role, phone)
    }
    const uid = String(info.lastInsertRowid)

    const dpCols = db.prepare('PRAGMA table_info(driver_profiles)').all() as { name: string; type: string; pk: number }[]
    const dpIntId = (dpCols.find(c => c.pk === 1)?.type || '').toUpperCase()
    if (role === 'driver') {
      if (/INT/i.test(dpIntId)) {
        db.prepare('INSERT INTO driver_profiles (user_id) VALUES (?)').run(uid)
      } else {
        db.prepare('INSERT INTO driver_profiles (id, user_id) VALUES (?, ?)').run(uuidv4(), uid)
      }
    } else if (role === 'shipper') {
      const spCols = db.prepare('PRAGMA table_info(shipper_profiles)').all() as { name: string; type: string; pk: number }[]
      const spIntId = (spCols.find(c => c.pk === 1)?.type || '').toUpperCase()
      if (/INT/i.test(spIntId)) {
        db.prepare('INSERT INTO shipper_profiles (user_id) VALUES (?)').run(uid)
      } else {
        db.prepare('INSERT INTO shipper_profiles (id, user_id) VALUES (?, ?)').run(uuidv4(), uid)
      }
    }

    user = db.prepare('SELECT * FROM users WHERE id = ?').get(uid)
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
