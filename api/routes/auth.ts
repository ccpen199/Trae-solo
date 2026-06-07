import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.post('/register', (req: Request, res: Response): void => {
  const db = getDb()
  const { name, phone, password, role } = req.body
  if (!name || !phone || !role) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }
  try {
    const r = db.prepare('INSERT INTO users (name, phone, password, role) VALUES (?, ?, ?, ?)').run(name, phone, password || '123456', role)
    res.json({ success: true, data: { id: r.lastInsertRowid, name, phone, role } })
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) {
      res.status(400).json({ success: false, error: '手机号已注册' })
    } else {
      res.status(500).json({ success: false, error: '注册失败' })
    }
  }
})

router.post('/login', (req: Request, res: Response): void => {
  const db = getDb()
  const { phone, password } = req.body
  if (!phone || !password) {
    res.status(400).json({ success: false, error: '缺少手机号或密码' })
    return
  }
  const user = db.prepare('SELECT * FROM users WHERE phone = ? AND password = ?').get(phone, password) as any
  if (!user) {
    res.status(401).json({ success: false, error: '手机号或密码错误' })
    return
  }
  let extra = null
  if (user.role === 'agent') {
    extra = db.prepare('SELECT * FROM agents WHERE user_id = ?').get(user.id)
  }
  res.json({ success: true, data: { ...user, extra } })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const user = db.prepare('SELECT id, name, phone, role, avatar, created_at FROM users WHERE id = ?').get(req.params.id)
  if (!user) {
    res.status(404).json({ success: false, error: '用户不存在' })
    return
  }
  res.json({ success: true, data: user })
})

export default router
