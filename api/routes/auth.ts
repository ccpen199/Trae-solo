import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'csg_energy_platform_2026_secret_key'

export function authMiddleware(req: Request, res: Response, next: Function): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未提供认证令牌' })
    return
  }

  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; username: string }
    const user = db.prepare('SELECT id, username, real_name, customer_type, role, phone, email, company_name, address, points_balance FROM users WHERE id = ?').get(decoded.userId) as any
    if (!user) {
      res.status(401).json({ success: false, error: '用户不存在' })
      return
    }
    ;(req as any).user = user
    next()
  } catch {
    res.status(401).json({ success: false, error: '令牌无效或已过期' })
  }
}

function generateToken(userId: number, username: string): string {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' })
}

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, real_name, customer_type, phone, email, company_name, address } = req.body

    if (!username || !password) {
      res.status(400).json({ success: false, error: '用户名和密码不能为空' })
      return
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
    if (existing) {
      res.status(409).json({ success: false, error: '用户名已存在' })
      return
    }

    const password_hash = bcrypt.hashSync(password, 10)
    const result = db.prepare(`
      INSERT INTO users (username, password_hash, real_name, customer_type, phone, email, company_name, address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(username, password_hash, real_name || null, customer_type || 'individual', phone || null, email || null, company_name || null, address || null)

    const token = generateToken(result.lastInsertRowid as number, username)
    const user = db.prepare('SELECT id, username, real_name, customer_type, role, phone, email, company_name, address, points_balance FROM users WHERE id = ?').get(result.lastInsertRowid)

    res.status(201).json({ success: true, data: { token, user } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      res.status(400).json({ success: false, error: '用户名和密码不能为空' })
      return
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      res.status(401).json({ success: false, error: '用户名或密码错误' })
      return
    }

    const token = generateToken(user.id, user.username)
    const { password_hash, ...userInfo } = user

    res.json({ success: true, data: { token, user: userInfo } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/profile', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  res.json({ success: true, data: (req as any).user })
})

router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  res.json({ success: true, data: (req as any).user })
})

router.put('/profile', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const { real_name, phone, email, company_name, address } = req.body

    const updates: string[] = []
    const values: any[] = []

    if (real_name !== undefined) { updates.push('real_name = ?'); values.push(real_name) }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone) }
    if (email !== undefined) { updates.push('email = ?'); values.push(email) }
    if (company_name !== undefined) { updates.push('company_name = ?'); values.push(company_name) }
    if (address !== undefined) { updates.push('address = ?'); values.push(address) }

    if (updates.length === 0) {
      res.status(400).json({ success: false, error: '没有提供更新字段' })
      return
    }

    updates.push("updated_at = datetime('now')")
    values.push(userId)

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values)

    const user = db.prepare('SELECT id, username, real_name, customer_type, role, phone, email, company_name, address, points_balance FROM users WHERE id = ?').get(userId)
    res.json({ success: true, data: user, message: '资料更新成功' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
