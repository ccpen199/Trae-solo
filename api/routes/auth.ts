import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

router.post('/register', (req: Request, res: Response): void => {
  try {
    const { name, phone, company, role, password } = req.body

    if (!name || !phone || !company || !role || !password) {
      res.status(400).json({ success: false, error: '请填写所有必填字段' })
      return
    }

    const validRoles = ['buyer', 'factory', 'supplier', 'designer', 'admin']
    if (!validRoles.includes(role)) {
      res.status(400).json({ success: false, error: '无效的用户角色' })
      return
    }

    const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone) as { id: string } | undefined
    if (existing) {
      res.status(409).json({ success: false, error: '该手机号已注册' })
      return
    }

    const id = uuidv4()
    db.prepare(
      'INSERT INTO users (id, name, phone, company, role, verified, avatar, password) VALUES (?, ?, ?, ?, ?, 0, "", ?)'
    ).run(id, name, phone, company, role, password)

    const user = db.prepare('SELECT id, name, phone, company, role, verified, avatar, created_at FROM users WHERE id = ?').get(id) as {
      id: string; name: string; phone: string; company: string; role: string; verified: number; avatar: string; created_at: string
    }

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        company: user.company,
        role: user.role,
        verified: user.verified === 1,
        avatar: user.avatar,
        createdAt: user.created_at,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '注册失败' })
  }
})

router.post('/login', (req: Request, res: Response): void => {
  try {
    const { phone, password } = req.body

    if (!phone || !password) {
      res.status(400).json({ success: false, error: '请输入手机号和密码' })
      return
    }

    const user = db.prepare('SELECT id, name, phone, company, role, verified, avatar, password, created_at FROM users WHERE phone = ?').get(phone) as {
      id: string; name: string; phone: string; company: string; role: string; verified: number; avatar: string; password: string; created_at: string
    } | undefined

    if (!user || user.password !== password) {
      res.status(401).json({ success: false, error: '手机号或密码错误' })
      return
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        company: user.company,
        role: user.role,
        verified: user.verified === 1,
        avatar: user.avatar,
        createdAt: user.created_at,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '登录失败' })
  }
})

router.post('/logout', (req: Request, res: Response): void => {
  res.json({ success: true, data: null })
})

router.get('/profile', (req: Request, res: Response): void => {
  try {
    const userId = req.query.userId as string
    if (!userId) {
      res.status(400).json({ success: false, error: '缺少用户ID' })
      return
    }

    const user = db.prepare('SELECT id, name, phone, company, role, verified, avatar, created_at FROM users WHERE id = ?').get(userId) as {
      id: string; name: string; phone: string; company: string; role: string; verified: number; avatar: string; created_at: string
    } | undefined

    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        company: user.company,
        role: user.role,
        verified: user.verified === 1,
        avatar: user.avatar,
        createdAt: user.created_at,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取用户信息失败' })
  }
})

export default router
