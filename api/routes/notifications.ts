import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { type, is_read, page = '1', limit = '20' } = req.query
    const db = getDb()

    let sql = 'SELECT * FROM notifications WHERE user_id = ?'
    const params: unknown[] = [req.user!.id]

    if (type) {
      sql += ' AND type = ?'
      params.push(type)
    }
    if (is_read !== undefined) {
      sql += ' AND is_read = ?'
      params.push(is_read === '1' || is_read === 'true' ? 1 : 0)
    }

    const pageNum = Math.max(1, parseInt(page as string, 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)))
    const offset = (pageNum - 1) * limitNum

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM (${sql})`).get(...params) as { total: number }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limitNum, offset)

    const notifications = db.prepare(sql).all(...params)

    res.json({
      success: true,
      data: {
        items: notifications,
        total: countResult.total,
        page: pageNum,
        limit: limitNum,
        total_pages: Math.ceil(countResult.total / limitNum),
      },
    })
  } catch (error) {
    console.error('List notifications error:', error)
    res.status(500).json({ success: false, error: '获取通知列表失败' })
  }
})

router.put('/:id/read', authMiddleware, (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const notification = db.prepare('SELECT * FROM notifications WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id)
    if (!notification) {
      res.status(404).json({ success: false, error: '通知不存在' })
      return
    }

    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id)
    res.json({ success: true, message: '已标记为已读' })
  } catch (error) {
    console.error('Mark read error:', error)
    res.status(500).json({ success: false, error: '标记已读失败' })
  }
})

router.put('/read-all', authMiddleware, (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const result = db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(req.user!.id)
    res.json({ success: true, message: '已全部标记为已读', data: { count: result.changes } })
  } catch (error) {
    console.error('Mark all read error:', error)
    res.status(500).json({ success: false, error: '全部标记已读失败' })
  }
})

router.get('/unread-count', authMiddleware, (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const result = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user!.id) as { count: number }
    res.json({ success: true, data: { unread_count: result.count } })
  } catch (error) {
    console.error('Get unread count error:', error)
    res.status(500).json({ success: false, error: '获取未读数量失败' })
  }
})

export default router
