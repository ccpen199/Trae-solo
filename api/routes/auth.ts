import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'
import { authMiddleware, JWT_SECRET } from '../middleware/auth.js'

const router = Router()

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, email, password, nickname } = req.body

    if (!phone || !email || !password || !nickname) {
      res.status(400).json({ success: false, error: '请填写所有必填字段' })
      return
    }

    const existing = db.prepare('SELECT id FROM users WHERE phone = ? OR email = ?').get(phone, email)
    if (existing) {
      res.status(409).json({ success: false, error: '手机号或邮箱已被注册' })
      return
    }

    const passwordHash = bcrypt.hashSync(password, 10)
    const id = uuidv4()

    db.prepare(`
      INSERT INTO users (id, phone, email, password_hash, nickname)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, phone, email, passwordHash, nickname)

    const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '7d' })

    res.status(201).json({
      success: true,
      data: { id, phone, email, nickname, token },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '注册失败' })
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password } = req.body

    if (!phone || !password) {
      res.status(400).json({ success: false, error: '请提供手机号和密码' })
      return
    }

    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any
    if (!user) {
      res.status(401).json({ success: false, error: '手机号或密码错误' })
      return
    }

    const valid = bcrypt.compareSync(password, user.password_hash)
    if (!valid) {
      res.status(401).json({ success: false, error: '手机号或密码错误' })
      return
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })

    res.json({
      success: true,
      data: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        credit_score: user.credit_score,
        credit_level: user.credit_level,
        help_coins: user.help_coins,
        is_verifier: user.is_verifier,
        token,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '登录失败' })
  }
})

router.get('/profile', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }

    const taskStats = db.prepare(`
      SELECT
        COUNT(CASE WHEN publisher_id = ? THEN 1 END) as published_count,
        COUNT(CASE WHEN assignee_id = ? THEN 1 END) as accepted_count,
        COUNT(CASE WHEN assignee_id = ? AND status = 'completed' THEN 1 END) as completed_count
      FROM tasks
    `).get(user.id, user.id, user.id) as any

    const ratingStats = db.prepare(`
      SELECT AVG(score) as avg_rating, COUNT(*) as rating_count
      FROM ratings
      WHERE rater_id = ?
    `).get(user.id) as any

    res.json({
      success: true,
      data: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        credit_score: user.credit_score,
        credit_level: user.credit_level,
        help_coins: user.help_coins,
        is_verifier: user.is_verifier,
        created_at: user.created_at,
        stats: {
          published_count: taskStats.published_count,
          accepted_count: taskStats.accepted_count,
          completed_count: taskStats.completed_count,
          avg_rating: ratingStats.avg_rating ? Number(ratingStats.avg_rating).toFixed(1) : null,
          rating_count: ratingStats.rating_count,
        },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取个人信息失败' })
  }
})

export default router
