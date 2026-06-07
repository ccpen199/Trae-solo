import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'
import authMiddleware from '../middleware/auth.js'

const router = Router()
const JWT_SECRET = 'estate-platform-jwt-secret-2024'

interface AuthRequest extends Request {
  user?: any
}

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, role = 'user', phone, email } = req.body

    if (!username || !password) {
      res.status(400).json({ success: false, error: '用户名和密码不能为空' })
      return
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as any
    if (existingUser) {
      res.status(400).json({ success: false, error: '用户名已存在' })
      return
    }

    const passwordHash = bcrypt.hashSync(password, 10)
    const stmt = db.prepare(`
      INSERT INTO users (username, password_hash, role, phone, email, nickname)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(username, passwordHash, role, phone, email, username)

    const userId = result.lastInsertRowid
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })

    const user = db.prepare('SELECT id, username, role, phone, email, nickname FROM users WHERE id = ?').get(userId) as any

    res.status(201).json({
      success: true,
      data: {
        token,
        user
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '注册失败' })
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
    if (!user) {
      res.status(401).json({ success: false, error: '用户名或密码错误' })
      return
    }

    const isValid = bcrypt.compareSync(password, user.password_hash)
    if (!isValid) {
      res.status(401).json({ success: false, error: '用户名或密码错误' })
      return
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })

    const { password_hash, ...userWithoutPassword } = user

    res.status(200).json({
      success: true,
      data: {
        token,
        user: userWithoutPassword
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '登录失败' })
  }
})

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取用户信息失败' })
  }
})

router.post('/certification', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { certification_type, certification_materials } = req.body

    if (!certification_type) {
      res.status(400).json({ success: false, error: '认证类型不能为空' })
      return
    }

    const stmt = db.prepare(`
      UPDATE users 
      SET certification_type = ?, certification_materials = ?, certification_status = 'pending', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    stmt.run(
      certification_type,
      JSON.stringify(certification_materials),
      req.user.id
    )

    const updatedUser = db.prepare('SELECT id, username, role, phone, email, nickname, certification_type, certification_status FROM users WHERE id = ?').get(req.user.id) as any

    res.status(200).json({
      success: true,
      data: {
        user: updatedUser,
        message: '认证提交成功，等待审核'
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '提交认证失败' })
  }
})

export default router
