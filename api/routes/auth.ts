import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../database.js'

const router = Router()

const verifyCodes = new Map<string, { code: string; expires: number }>()

router.post('/send-code', (req: Request, res: Response): void => {
  const { phone } = req.body
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    res.status(400).json({ code: 400, message: '手机号格式不正确', data: null })
    return
  }

  const code = String(Math.floor(100000 + Math.random() * 900000))
  verifyCodes.set(phone, { code, expires: Date.now() + 5 * 60 * 1000 })

  res.json({ code: 200, message: '验证码已发送', data: { phone, hint: code } })
})

router.post('/login', (req: Request, res: Response): void => {
  const { phone, verify_code } = req.body
  if (!phone || !verify_code) {
    res.status(400).json({ code: 400, message: '缺少手机号或验证码', data: null })
    return
  }

  const stored = verifyCodes.get(phone)
  if (!stored || stored.code !== verify_code || Date.now() > stored.expires) {
    res.status(401).json({ code: 401, message: '验证码无效或已过期', data: null })
    return
  }

  verifyCodes.delete(phone)

  const db = getDb()
  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as Record<string, unknown> | undefined

  if (!user) {
    const id = uuidv4()
    db.prepare('INSERT INTO users (id, phone, name, avatar) VALUES (?, ?, ?, ?)').run(id, phone, `用户${phone.slice(-4)}`, '')
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown>
  }

  res.json({ code: 200, message: 'ok', data: user })
})

router.post('/register', (req: Request, res: Response): void => {
  const { phone, name } = req.body
  if (!phone || !name) {
    res.status(400).json({ code: 400, message: '缺少必要字段', data: null })
    return
  }

  const db = getDb()
  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone)
  if (existing) {
    res.status(409).json({ code: 409, message: '该手机号已注册', data: null })
    return
  }

  const id = uuidv4()
  db.prepare('INSERT INTO users (id, phone, name, avatar) VALUES (?, ?, ?, ?)').run(id, phone, name, '')
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)

  res.status(201).json({ code: 201, message: 'ok', data: user })
})

router.post('/logout', (_req: Request, res: Response): void => {
  res.json({ code: 200, message: 'ok', data: null })
})

export default router
