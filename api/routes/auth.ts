import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import { auth, generateToken } from '../middleware/auth.js'

const router = Router()

router.post('/register', (req: Request, res: Response): void => {
  const { idNumber, name, password, role, creditCode } = req.body
  if (!idNumber || !name || !password || !role) {
    res.status(400).json({ ok: false, error: '缺少必要字段' })
    return
  }
  if (!['personal', 'enterprise', 'admin'].includes(role)) {
    res.status(400).json({ ok: false, error: '无效的角色类型' })
    return
  }

  const db = getDb()
  const passwordHash = 'hashed_' + password

  try {
    const result = db.prepare(
      'INSERT INTO users (id_number, name, password_hash, role, credit_code) VALUES (?, ?, ?, ?, ?)'
    ).run(idNumber, name, passwordHash, role, creditCode || null)

    const user = db.prepare('SELECT id, id_number, name, role, credit_code, created_at FROM users WHERE id = ?').get(result.lastInsertRowid) as any
    const token = generateToken(user.id, user.role)
    res.json({ ok: true, token, user })
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      res.status(409).json({ ok: false, error: '该身份证号/信用代码已注册' })
      return
    }
    res.status(500).json({ ok: false, error: '注册失败' })
  }
})

router.post('/login', (req: Request, res: Response): void => {
  const { idNumber, password } = req.body
  if (!idNumber || !password) {
    res.status(400).json({ ok: false, error: '缺少身份证号或密码' })
    return
  }

  const db = getDb()
  const passwordHash = 'hashed_' + password
  const user = db.prepare(
    'SELECT id, id_number, name, role, credit_code, created_at FROM users WHERE id_number = ? AND password_hash = ?'
  ).get(idNumber, passwordHash) as any

  if (!user) {
    res.status(401).json({ ok: false, error: '身份证号或密码错误' })
    return
  }

  const token = generateToken(user.id, user.role)
  res.json({ ok: true, token, user })
})

router.get('/me', auth, (req: Request, res: Response): void => {
  const db = getDb()
  const user = db.prepare(
    'SELECT id, id_number, name, role, credit_code, created_at FROM users WHERE id = ?'
  ).get(req.user!.userId)

  if (!user) {
    res.status(404).json({ ok: false, error: '用户不存在' })
    return
  }

  res.json({ ok: true, user })
})

export default router
