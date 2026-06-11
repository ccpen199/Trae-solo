import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, status, org_id, page = '1', pageSize = '10' } = req.query
    const db = getDb()

    let sql = `SELECT mt.*, o.name as org_name FROM micro_tasks mt LEFT JOIN organizations o ON mt.org_id = o.id WHERE 1=1`
    const params: any[] = []

    if (type) {
      sql += ` AND mt.type = ?`
      params.push(type)
    }
    if (status) {
      sql += ` AND mt.status = ?`
      params.push(status)
    }
    if (org_id) {
      sql += ` AND mt.org_id = ?`
      params.push(org_id)
    }

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM (${sql})`).get(...params) as { total: number }

    const offset = (Number(page) - 1) * Number(pageSize)
    sql += ` ORDER BY mt.created_at DESC LIMIT ? OFFSET ?`
    params.push(Number(pageSize), offset)

    const tasks = db.prepare(sql).all(...params)

    res.json({
      success: true,
      data: {
        items: tasks,
        total: countResult.total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取任务列表失败' })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, type, description, reward, quota, org_id, status } = req.body

    if (!title || !type || !reward || !quota) {
      res.status(400).json({ success: false, error: '标题、类型、奖励和配额不能为空' })
      return
    }

    const db = getDb()
    const result = db.prepare(
      `INSERT INTO micro_tasks (title, type, description, reward, quota, org_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(title, type, description || '', reward, quota, org_id, status || 'published')

    const task = db.prepare('SELECT mt.*, o.name as org_name FROM micro_tasks mt LEFT JOIN organizations o ON mt.org_id = o.id WHERE mt.id = ?').get(result.lastInsertRowid)

    res.status(201).json({ success: true, data: task })
  } catch (error) {
    res.status(500).json({ success: false, error: '发布任务失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const task = db.prepare(`SELECT mt.*, o.name as org_name FROM micro_tasks mt LEFT JOIN organizations o ON mt.org_id = o.id WHERE mt.id = ?`).get(req.params.id) as any

    if (!task) {
      res.status(404).json({ success: false, error: '任务不存在' })
      return
    }

    const submissions = db.prepare(`
      SELECT mts.*, u.name as student_name
      FROM micro_task_submissions mts
      JOIN student_profiles sp ON mts.student_id = sp.id
      JOIN users u ON sp.user_id = u.id
      WHERE mts.task_id = ?
      ORDER BY mts.created_at DESC
    `).all(req.params.id)

    res.json({ success: true, data: { ...task, submissions } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取任务详情失败' })
  }
})

router.get('/:id/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const task = db.prepare('SELECT * FROM micro_tasks WHERE id = ?').get(req.params.id) as any
    if (!task) {
      res.status(404).json({ success: false, error: '任务不存在' })
      return
    }

    const totalSubmissions = db.prepare('SELECT COUNT(*) as count FROM micro_task_submissions WHERE task_id = ?').get(req.params.id) as { count: number }
    const approved = db.prepare("SELECT COUNT(*) as count FROM micro_task_submissions WHERE task_id = ? AND status = 'approved'").get(req.params.id) as { count: number }
    const rejected = db.prepare("SELECT COUNT(*) as count FROM micro_task_submissions WHERE task_id = ? AND status = 'rejected'").get(req.params.id) as { count: number }
    const pending = db.prepare("SELECT COUNT(*) as count FROM micro_task_submissions WHERE task_id = ? AND status = 'pending'").get(req.params.id) as { count: number }

    const completionRate = task.quota > 0 ? Math.round((task.completed / task.quota) * 100) : 0
    const approvalRate = totalSubmissions.count > 0 ? Math.round((approved.count / totalSubmissions.count) * 100) : 0
    const totalReward = task.reward * task.completed

    res.json({
      success: true,
      data: {
        task_id: task.id,
        title: task.title,
        total_submissions: totalSubmissions.count,
        approved: approved.count,
        rejected: rejected.count,
        pending: pending.count,
        completion_rate: completionRate,
        approval_rate: approvalRate,
        total_reward_paid: totalReward,
        quota: task.quota,
        completed: task.completed
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取任务统计失败' })
  }
})

router.post('/:id/submit', async (req: Request, res: Response): Promise<void> => {
  try {
    const { student_id, result } = req.body

    if (!student_id) {
      res.status(400).json({ success: false, error: '学生ID不能为空' })
      return
    }

    const db = getDb()
    const task = db.prepare('SELECT * FROM micro_tasks WHERE id = ?').get(req.params.id) as any
    if (!task) {
      res.status(404).json({ success: false, error: '任务不存在' })
      return
    }

    if (task.status !== 'published') {
      res.status(400).json({ success: false, error: '任务未开放提交' })
      return
    }

    if (task.completed >= task.quota) {
      res.status(400).json({ success: false, error: '任务名额已满' })
      return
    }

    const existing = db.prepare('SELECT * FROM micro_task_submissions WHERE task_id = ? AND student_id = ?').get(req.params.id, student_id) as any
    if (existing) {
      res.status(400).json({ success: false, error: '已提交过该任务' })
      return
    }

    const submitResult = db.prepare(
      `INSERT INTO micro_task_submissions (task_id, student_id, result, status) VALUES (?, ?, ?, 'pending')`
    ).run(Number(req.params.id), student_id, result || '')

    db.prepare('UPDATE micro_tasks SET completed = completed + 1 WHERE id = ?').run(req.params.id)

    const submission = db.prepare(`
      SELECT mts.*, u.name as student_name
      FROM micro_task_submissions mts
      JOIN student_profiles sp ON mts.student_id = sp.id
      JOIN users u ON sp.user_id = u.id
      WHERE mts.id = ?
    `).get(submitResult.lastInsertRowid)

    res.status(201).json({ success: true, data: submission })
  } catch (error) {
    res.status(500).json({ success: false, error: '提交任务失败' })
  }
})

export default router
