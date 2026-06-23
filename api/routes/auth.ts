import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.post('/register', (req: Request, res: Response): void => {
  const { phone, nickname } = req.body
  if (!phone || !nickname) {
    res.status(400).json({ success: false, error: '手机号和昵称为必填项' })
    return
  }

  const db = getDb()
  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone)
  if (existing) {
    res.json({ success: false, error: '手机号已注册' })
    return
  }

  const result = db.prepare('INSERT INTO users (phone, nickname) VALUES (?, ?)').run(phone, nickname)
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid)
  res.json({ success: true, data: user })
})

router.post('/login', (req: Request, res: Response): void => {
  const { phone } = req.body
  if (!phone) {
    res.status(400).json({ success: false, error: '手机号为必填项' })
    return
  }

  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone)
  if (!user) {
    res.json({ success: false, error: '用户不存在' })
    return
  }

  res.json({ success: true, data: user })
})

export default router
