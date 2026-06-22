import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.post('/register', (req: Request, res: Response): void => {
  const { phone, name, password } = req.body
  if (!phone || !name || !password) {
    res.status(400).json({ success: false, error: '手机号、姓名和密码为必填项' })
    return
  }

  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone)
  if (existing) {
    res.status(409).json({ success: false, error: '该手机号已注册' })
    return
  }

  const passwordHash = `hash_${password}`
  const result = db.prepare(
    'INSERT INTO users (phone, name, password_hash) VALUES (?, ?, ?)'
  ).run(phone, name, passwordHash)

  const user = db.prepare('SELECT id, phone, name, verify_status, role, avatar_url FROM users WHERE id = ?').get(result.lastInsertRowid)
  res.json({ success: true, data: user })
})

router.post('/login', (req: Request, res: Response): void => {
  const { phone, password } = req.body
  if (!phone || !password) {
    res.status(400).json({ success: false, error: '手机号和密码为必填项' })
    return
  }

  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any
  if (!user) {
    res.status(401).json({ success: false, error: '用户不存在' })
    return
  }

  if (user.password_hash !== `hash_${password}`) {
    res.status(401).json({ success: false, error: '密码错误' })
    return
  }

  const { password_hash, ...userInfo } = user
  res.json({ success: true, data: userInfo })
})

router.post('/verify-realname', (req: Request, res: Response): void => {
  const userId = req.headers['x-user-id']
  if (!userId) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const { real_name, id_number } = req.body
  if (!real_name || !id_number) {
    res.status(400).json({ success: false, error: '真实姓名和身份证号为必填项' })
    return
  }

  db.prepare(
    'UPDATE users SET real_name = ?, id_number = ?, verify_status = ? WHERE id = ?'
  ).run(real_name, id_number, 'verified', Number(userId))

  const user = db.prepare('SELECT id, phone, name, real_name, id_number, verify_status, role FROM users WHERE id = ?').get(Number(userId))
  res.json({ success: true, data: user })
})

router.get('/me', (req: Request, res: Response): void => {
  const userId = req.headers['x-user-id']
  if (!userId) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const user = db.prepare('SELECT id, phone, name, real_name, id_number, verify_status, role, vet_license, avatar_url, created_at FROM users WHERE id = ?').get(Number(userId))
  if (!user) {
    res.status(404).json({ success: false, error: '用户不存在' })
    return
  }

  res.json({ success: true, data: user })
})

export default router
