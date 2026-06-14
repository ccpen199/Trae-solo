import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

const validTypes = ['school_district', 'medical_insurance', 'traffic', 'social_security']

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const subscriptions = db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').all(userId)
    res.json({ code: 0, message: 'success', data: subscriptions })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.post('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { type } = req.body
    if (!type || !validTypes.includes(type)) {
      res.json({ code: -1, message: '无效的订阅类型' })
      return
    }
    const existing = db.prepare('SELECT id FROM subscriptions WHERE user_id = ? AND type = ?').get(userId, type)
    if (existing) {
      res.json({ code: -1, message: '已订阅该类型' })
      return
    }
    const result = db.prepare('INSERT INTO subscriptions (user_id, type) VALUES (?, ?)').run(userId, type)
    res.json({ code: 0, message: 'success', data: { id: Number(result.lastInsertRowid) } })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.delete('/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { id } = req.params
    const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?').get(id, userId) as any
    if (!sub) {
      res.json({ code: -1, message: '订阅不存在' })
      return
    }
    db.prepare('DELETE FROM subscriptions WHERE id = ?').run(id)
    res.json({ code: 0, message: 'success' })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

export default router
