import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10))
    const offset = (page - 1) * limit

    const category = req.query.category as string
    const status = req.query.status as string
    const keyword = req.query.keyword as string
    const tag = req.query.tag as string
    const sort = req.query.sort as string
    const publisherId = req.query.publisher_id as string
    const assigneeId = req.query.assignee_id as string
    const city = req.query.city as string

    let whereClauses: string[] = []
    let params: any[] = []

    if (status) {
      whereClauses.push('t.status = ?')
      params.push(status)
    } else {
      whereClauses.push("t.status = 'open'")
    }

    if (category) {
      whereClauses.push('t.category = ?')
      params.push(category)
    }
    if (keyword) {
      whereClauses.push('(t.title LIKE ? OR t.description LIKE ? OR t.tags LIKE ?)')
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    if (tag) {
      whereClauses.push('(t.tags LIKE ? OR t.title LIKE ? OR t.description LIKE ?)')
      params.push(`%${tag}%`, `%${tag}%`, `%${tag}%`)
    }
    if (city) {
      whereClauses.push('(JSON_EXTRACT(t.geo_fence, \'$.address\') LIKE ? OR t.title LIKE ? OR t.description LIKE ?)')
      params.push(`%${city}%`, `%${city}%`, `%${city}%`)
    }
    if (publisherId) {
      whereClauses.push('t.publisher_id = ?')
      params.push(publisherId)
    }
    if (assigneeId) {
      whereClauses.push('t.assignee_id = ?')
      params.push(assigneeId)
    }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''

    let orderBy = 't.created_at DESC'
    if (sort === 'hot') {
      orderBy = 't.view_count DESC, t.exposure_weight DESC'
    } else if (sort === 'bounty') {
      orderBy = 't.bounty_amount DESC'
    } else if (sort === 'new') {
      orderBy = 't.created_at DESC'
    }

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM tasks t ${whereStr}`).get(...params) as { total: number }

    const tasks = db.prepare(`
      SELECT t.*, u.nickname as publisher_nickname, u.avatar as publisher_avatar, u.credit_level as publisher_credit_level
      FROM tasks t
      JOIN users u ON t.publisher_id = u.id
      ${whereStr}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as any[]

    const result = tasks.map(t => ({
      ...t,
      tags: JSON.parse(t.tags || '[]'),
      geo_fence: JSON.parse(t.geo_fence || '{}'),
      verify_rules: JSON.parse(t.verify_rules || '[]'),
    }))

    res.json({
      success: true,
      data: {
        items: result,
        total: countRow.total,
        page,
        limit,
        totalPages: Math.ceil(countRow.total / limit),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取任务列表失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const task = db.prepare(`
      SELECT t.*, u.nickname as publisher_nickname, u.avatar as publisher_avatar, u.credit_level as publisher_credit_level,
        a.nickname as assignee_nickname, a.avatar as assignee_avatar
      FROM tasks t
      JOIN users u ON t.publisher_id = u.id
      LEFT JOIN users a ON t.assignee_id = a.id
      WHERE t.id = ?
    `).get(req.params.id) as any

    if (!task) {
      res.status(404).json({ success: false, error: '任务不存在' })
      return
    }

    db.prepare('UPDATE tasks SET view_count = view_count + 1 WHERE id = ?').run(task.id)

    const evidence = db.prepare(`
      SELECT e.*, u.nickname as user_nickname
      FROM evidence e
      JOIN users u ON e.user_id = u.id
      WHERE e.task_id = ?
      ORDER BY e.created_at DESC
    `).all(task.id)

    const ratings = db.prepare(`
      SELECT r.*, u.nickname as rater_nickname
      FROM ratings r
      JOIN users u ON r.rater_id = u.id
      WHERE r.task_id = ?
      ORDER BY r.created_at DESC
    `).all(task.id)

    res.json({
      success: true,
      data: {
        ...task,
        tags: JSON.parse(task.tags || '[]'),
        geo_fence: JSON.parse(task.geo_fence || '{}'),
        verify_rules: JSON.parse(task.verify_rules || '[]'),
        view_count: task.view_count + 1,
        evidence,
        ratings,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取任务详情失败' })
  }
})

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, category, tags, bounty_type, bounty_amount, deadline, geo_fence, verify_rules } = req.body

    if (!title || !description || !category || !deadline) {
      res.status(400).json({ success: false, error: '请填写所有必填字段' })
      return
    }

    const id = uuidv4()

    db.prepare(`
      INSERT INTO tasks (id, publisher_id, title, description, category, tags, bounty_type, bounty_amount, deadline, geo_fence, verify_rules)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.userId!,
      title,
      description,
      category,
      JSON.stringify(tags || []),
      bounty_type || 'coins',
      bounty_amount || 0,
      deadline,
      JSON.stringify(geo_fence || {}),
      JSON.stringify(verify_rules || []),
    )

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any

    res.status(201).json({
      success: true,
      data: {
        ...task,
        tags: JSON.parse(task.tags || '[]'),
        geo_fence: JSON.parse(task.geo_fence || '{}'),
        verify_rules: JSON.parse(task.verify_rules || '[]'),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建任务失败' })
  }
})

router.post('/:id/accept', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as any

    if (!task) {
      res.status(404).json({ success: false, error: '任务不存在' })
      return
    }

    if (task.status !== 'open') {
      res.status(400).json({ success: false, error: '任务状态不是待接单' })
      return
    }

    if (task.publisher_id === req.userId) {
      res.status(400).json({ success: false, error: '不能接自己发布的任务' })
      return
    }

    db.prepare(`
      UPDATE tasks SET assignee_id = ?, status = 'in_progress', updated_at = datetime('now') WHERE id = ?
    `).run(req.userId, req.params.id)

    res.json({ success: true, data: { task_id: req.params.id, assignee_id: req.userId, status: 'in_progress' } })
  } catch (error) {
    res.status(500).json({ success: false, error: '接单失败' })
  }
})

router.post('/:id/complete', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { evidence_list } = req.body as { evidence_list: { type: string; data: string }[] }

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as any

    if (!task) {
      res.status(404).json({ success: false, error: '任务不存在' })
      return
    }

    if (task.assignee_id !== req.userId) {
      res.status(403).json({ success: false, error: '只有接单人才能提交完成凭证' })
      return
    }

    if (task.status !== 'in_progress') {
      res.status(400).json({ success: false, error: '任务状态不允许提交完成' })
      return
    }

    const insertEvidence = db.prepare(`
      INSERT INTO evidence (id, task_id, user_id, type, data) VALUES (?, ?, ?, ?, ?)
    `)

    const transaction = db.transaction(() => {
      if (evidence_list && evidence_list.length > 0) {
        for (const ev of evidence_list) {
          insertEvidence.run(uuidv4(), req.params.id, req.userId!, ev.type, ev.data)
        }
      }

      db.prepare(`
        UPDATE tasks SET status = 'verifying', updated_at = datetime('now') WHERE id = ?
      `).run(req.params.id)
    })

    transaction()

    res.json({ success: true, data: { task_id: req.params.id, status: 'verifying' } })
  } catch (error) {
    res.status(500).json({ success: false, error: '提交完成凭证失败' })
  }
})

router.post('/:id/rate', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { score, comment, type } = req.body as { score: number; comment?: string; type: string }

    if (!score || score < 1 || score > 5) {
      res.status(400).json({ success: false, error: '评分必须在1-5之间' })
      return
    }

    if (!type || !['publisher', 'verifier'].includes(type)) {
      res.status(400).json({ success: false, error: '评分类型无效' })
      return
    }

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as any

    if (!task) {
      res.status(404).json({ success: false, error: '任务不存在' })
      return
    }

    if (task.status !== 'completed' && task.status !== 'verifying') {
      res.status(400).json({ success: false, error: '任务状态不允许评分' })
      return
    }

    const existing = db.prepare('SELECT id FROM ratings WHERE task_id = ? AND rater_id = ? AND type = ?').get(req.params.id, req.userId, type)
    if (existing) {
      res.status(400).json({ success: false, error: '你已经对该任务进行过此类评分' })
      return
    }

    const id = uuidv4()
    db.prepare(`
      INSERT INTO ratings (id, task_id, rater_id, score, comment, type) VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, req.params.id, req.userId!, score, comment || '', type)

    const rating = db.prepare(`
      UPDATE users SET credit_score = credit_score + ? WHERE id = ?
    `)

    if (type === 'publisher') {
      const change = score >= 4 ? 2 : score >= 3 ? 0 : -2
      rating.run(change, task.publisher_id)
      db.prepare(`
        INSERT INTO credit_records (id, user_id, task_id, change, reason) VALUES (?, ?, ?, ?, ?)
      `).run(uuidv4(), task.publisher_id, task.id, change, `任务评分: ${score}分`)
    }

    res.status(201).json({ success: true, data: { id, task_id: req.params.id, score, type } })
  } catch (error) {
    res.status(500).json({ success: false, error: '评分失败' })
  }
})

router.post('/:id/verify', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { approved } = req.body as { approved: boolean }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any
    if (!user.is_verifier) {
      res.status(403).json({ success: false, error: '只有验证者才能验证任务' })
      return
    }

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as any

    if (!task) {
      res.status(404).json({ success: false, error: '任务不存在' })
      return
    }

    if (task.status !== 'verifying') {
      res.status(400).json({ success: false, error: '任务不在验证状态' })
      return
    }

    const transaction = db.transaction(() => {
      if (approved) {
        db.prepare(`
          UPDATE tasks SET status = 'completed', updated_at = datetime('now') WHERE id = ?
        `).run(req.params.id)

        db.prepare(`
          UPDATE users SET help_coins = help_coins + ? WHERE id = ?
        `).run(task.bounty_amount, task.assignee_id)

        const assignee = db.prepare('SELECT help_coins FROM users WHERE id = ?').get(task.assignee_id) as any

        db.prepare(`
          INSERT INTO coin_transactions (id, user_id, task_id, type, amount, balance, description) VALUES (?, ?, ?, 'earn', ?, ?, ?)
        `).run(uuidv4(), task.assignee_id, task.id, task.bounty_amount, assignee.help_coins, `完成任务: ${task.title}`)

        db.prepare(`
          INSERT INTO credit_records (id, user_id, task_id, change, reason) VALUES (?, ?, ?, 5, '完成任务获得信用加分')
        `).run(uuidv4(), task.assignee_id, task.id)

        db.prepare(`
          UPDATE users SET credit_score = credit_score + 5 WHERE id = ?
        `).run(task.assignee_id)
      } else {
        db.prepare(`
          UPDATE tasks SET status = 'disputed', updated_at = datetime('now') WHERE id = ?
        `).run(req.params.id)
      }
    })

    transaction()

    res.json({
      success: true,
      data: { task_id: req.params.id, status: approved ? 'completed' : 'disputed' },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '验证任务失败' })
  }
})

export default router
