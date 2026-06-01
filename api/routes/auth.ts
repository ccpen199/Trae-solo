import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import db from '../db.js'

const router = Router()

router.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body
  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' })
    return
  }
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any
  if (!user) {
    res.status(401).json({ error: '账号不存在' })
    return
  }
  if (!bcrypt.compareSync(password, user.password)) {
    res.status(401).json({ error: '密码错误' })
    return
  }
  const token = Buffer.from(JSON.stringify({
    userId: user.id,
    username: user.username,
    role: user.role,
    exp: Date.now() + 86400000
  })).toString('base64')
  res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role, phone: user.phone } })
})

router.get('/me', (req: Request, res: Response): void => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: '未登录' })
    return
  }
  try {
    const payload = JSON.parse(Buffer.from(auth.slice(7), 'base64').toString())
    if (payload.exp < Date.now()) {
      res.status(401).json({ error: '登录已过期' })
      return
    }
    const user = db.prepare('SELECT id, username, name, role, phone FROM users WHERE id = ?').get(payload.userId) as any
    if (!user) {
      res.status(401).json({ error: '用户不存在' })
      return
    }
    res.json({ user })
  } catch {
    res.status(401).json({ error: '无效token' })
  }
})

export default router
