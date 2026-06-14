import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'vehicle_monitor_jwt_secret_2024'

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      res.status(400).json({ success: false, error: '用户名和密码不能为空' })
      return
    }
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any
    if (!user) {
      res.status(401).json({ success: false, error: '用户名或密码错误' })
      return
    }
    const valid = bcrypt.compareSync(password, user.password_hash)
    if (!valid) {
      res.status(401).json({ success: false, error: '用户名或密码错误' })
      return
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, orgId: user.org_id },
      JWT_SECRET,
      { expiresIn: '24h' },
    )
    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, username: user.username, role: user.role, orgId: user.org_id },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.get('/profile', authMiddleware, (req: Request, res: Response): void => {
  try {
    const user = db.prepare(
      'SELECT u.id, u.username, u.role, u.org_id, o.name as org_name FROM users u LEFT JOIN organizations o ON u.org_id = o.id WHERE u.id = ?',
    ).get(req.user!.id) as any
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }
    res.json({
      success: true,
      data: { id: user.id, username: user.username, role: user.role, orgId: user.org_id, orgName: user.org_name },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

export default router
