import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/profile', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }

    const published = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE publisher_id = ?').get(req.userId) as { count: number }
    const accepted = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE assignee_id = ?').get(req.userId) as { count: number }
    const completed = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE assignee_id = ? AND status = 'completed'").get(req.userId) as { count: number }

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
          published: published.count,
          accepted: accepted.count,
          completed: completed.count,
        },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取用户信息失败' })
  }
})

router.get('/credit-history', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20))
    const offset = (page - 1) * limit

    const total = db.prepare('SELECT COUNT(*) as count FROM credit_records WHERE user_id = ?').get(req.userId) as { count: number }

    const records = db.prepare(`
      SELECT cr.*, t.title as task_title
      FROM credit_records cr
      LEFT JOIN tasks t ON cr.task_id = t.id
      WHERE cr.user_id = ?
      ORDER BY cr.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.userId, limit, offset)

    res.json({
      success: true,
      data: {
        items: records,
        total: total.count,
        page,
        limit,
        totalPages: Math.ceil(total.count / limit),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取信用记录失败' })
  }
})

router.get('/coins', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = db.prepare('SELECT help_coins FROM users WHERE id = ?').get(req.userId) as any
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20))
    const offset = (page - 1) * limit

    const total = db.prepare('SELECT COUNT(*) as count FROM coin_transactions WHERE user_id = ?').get(req.userId) as { count: number }

    const transactions = db.prepare(`
      SELECT ct.*, t.title as task_title
      FROM coin_transactions ct
      LEFT JOIN tasks t ON ct.task_id = t.id
      WHERE ct.user_id = ?
      ORDER BY ct.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.userId, limit, offset)

    res.json({
      success: true,
      data: {
        balance: user.help_coins,
        transactions: {
          items: transactions,
          total: total.count,
          page,
          limit,
          totalPages: Math.ceil(total.count / limit),
        },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取互助币信息失败' })
  }
})

router.post('/coins/exchange', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, description } = req.body as { amount: number; description?: string }

    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, error: '兑换数量必须大于0' })
      return
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any
    if (user.help_coins < amount) {
      res.status(400).json({ success: false, error: '互助币余额不足' })
      return
    }

    const transaction = db.transaction(() => {
      db.prepare('UPDATE users SET help_coins = help_coins - ? WHERE id = ?').run(amount, req.userId)

      const updatedUser = db.prepare('SELECT help_coins FROM users WHERE id = ?').get(req.userId) as any

      db.prepare(`
        INSERT INTO coin_transactions (id, user_id, type, amount, balance, description) VALUES (?, ?, 'exchange', ?, ?, ?)
      `).run(uuidv4(), req.userId!, amount, updatedUser.help_coins, description || '互助币兑换')

      return updatedUser.help_coins
    })

    const newBalance = transaction()

    res.json({
      success: true,
      data: { balance: newBalance, exchanged: amount },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '兑换失败' })
  }
})

router.post('/coins/boost', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { task_id, amount } = req.body as { task_id: string; amount: number }

    if (!task_id || !amount || amount <= 0) {
      res.status(400).json({ success: false, error: '请提供任务ID和有效的互助币数量' })
      return
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any
    if (user.help_coins < amount) {
      res.status(400).json({ success: false, error: '互助币余额不足' })
      return
    }

    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND publisher_id = ?').get(task_id, req.userId) as any
    if (!task) {
      res.status(404).json({ success: false, error: '任务不存在或不属于你' })
      return
    }

    const boostWeight = amount * 0.1

    const result = db.transaction(() => {
      db.prepare('UPDATE users SET help_coins = help_coins - ? WHERE id = ?').run(amount, req.userId)

      const updatedUser = db.prepare('SELECT help_coins FROM users WHERE id = ?').get(req.userId) as any

      db.prepare(`
        INSERT INTO coin_transactions (id, user_id, task_id, type, amount, balance, description) VALUES (?, ?, ?, 'spend', ?, ?, ?)
      `).run(uuidv4(), req.userId!, task_id, amount, updatedUser.help_coins, `提升任务曝光: ${task.title}`)

      db.prepare('UPDATE tasks SET exposure_weight = exposure_weight + ? WHERE id = ?').run(boostWeight, task_id)

      return updatedUser.help_coins
    })()

    res.json({
      success: true,
      data: { balance: result, boosted_task: task_id, boost_weight: boostWeight },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '提升曝光失败' })
  }
})

export default router
