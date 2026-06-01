import { Router, type Response } from 'express'
import db from '../database.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 10))
    const keyword = (req.query.keyword as string) || ''
    const status = (req.query.status as string) || ''

    let where = 'WHERE 1=1'
    const params: any[] = []

    if (keyword) {
      where += ' AND (n.title LIKE ? OR n.content LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    if (status) {
      where += ' AND n.status = ?'
      params.push(status)
    }

    const total = (db.prepare(`SELECT COUNT(*) as count FROM notices n ${where}`).get(...params) as any).count
    const offset = (page - 1) * pageSize

    const list = db.prepare(
      `SELECT n.*, u.name as creator_name FROM notices n LEFT JOIN users u ON n.created_by = u.id ${where} ORDER BY n.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, pageSize, offset) as any[]

    res.json({
      success: true,
      data: { list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取公示列表失败' })
  }
})

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const notice = db.prepare(
      'SELECT n.*, u.name as creator_name FROM notices n LEFT JOIN users u ON n.created_by = u.id WHERE n.id = ?'
    ).get(req.params.id) as any

    if (!notice) {
      res.status(404).json({ success: false, error: '公示不存在' })
      return
    }

    res.json({ success: true, data: notice })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取公示详情失败' })
  }
})

router.post('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const { title, content, application_ids, deadline } = req.body

    if (!title || !content) {
      res.status(400).json({ success: false, error: '缺少必要字段' })
      return
    }

    const result = db.prepare(
      `INSERT INTO notices (title, content, status, application_ids, deadline, created_by) VALUES (?, ?, 'active', ?, ?, ?)`
    ).run(title, content, JSON.stringify(application_ids || []), deadline || null, req.user!.id)

    res.status(201).json({ success: true, data: { id: result.lastInsertRowid } })
  } catch (error) {
    res.status(500).json({ success: false, error: '发布公示失败' })
  }
})

export default router
