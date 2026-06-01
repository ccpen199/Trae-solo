import express, { type Request, type Response } from 'express'
import db from '../database.js'

const router = express.Router()

router.get('/', (req: Request, res: Response) => {
  const { user_id, is_read, type } = req.query

  let sql = `
    SELECT n.*, u.name as user_name
    FROM notifications n
    LEFT JOIN users u ON n.user_id = u.id
    WHERE 1=1
  `
  const params: any[] = []

  if (user_id) {
    sql += ' AND n.user_id = ?'
    params.push(user_id)
  }
  if (is_read !== undefined) {
    sql += ' AND n.is_read = ?'
    params.push(is_read === 'true' ? 1 : 0)
  }
  if (type) {
    sql += ' AND n.type = ?'
    params.push(type)
  }
  sql += ' ORDER BY n.created_at DESC'

  const notifications = db.prepare(sql).all(...params)

  res.json({
    success: true,
    data: notifications
  })
})

router.get('/unread-count/:user_id', (req: Request, res: Response) => {
  const count = db.prepare(`
    SELECT COUNT(*) as count
    FROM notifications
    WHERE user_id = ? AND is_read = 0
  `).get(req.params.user_id)

  res.json({
    success: true,
    data: count.count
  })
})

router.get('/:id', (req: Request, res: Response) => {
  const notification = db.prepare(`
    SELECT n.*, u.name as user_name
    FROM notifications n
    LEFT JOIN users u ON n.user_id = u.id
    WHERE n.id = ?
  `).get(req.params.id)

  if (!notification) {
    return res.status(404).json({
      success: false,
      error: '通知不存在'
    })
  }

  res.json({
    success: true,
    data: notification
  })
})

router.post('/:id/read', (req: Request, res: Response) => {
  const result = db.prepare(`
    UPDATE notifications
    SET is_read = 1
    WHERE id = ?
  `).run(req.params.id)

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      error: '通知不存在'
    })
  }

  res.json({
    success: true,
    message: '已标记为已读'
  })
})

router.post('/read-all/:user_id', (req: Request, res: Response) => {
  db.prepare(`
    UPDATE notifications
    SET is_read = 1
    WHERE user_id = ?
  `).run(req.params.user_id)

  res.json({
    success: true,
    message: '已全部标记为已读'
  })
})

router.post('/', (req: Request, res: Response) => {
  const { user_ids, title, content, type, related_id } = req.body

  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, title, content, type, related_id)
    VALUES (?, ?, ?, ?, ?)
  `)

  try {
    user_ids.forEach((userId: number) => {
      insertNotif.run(userId, title, content, type, related_id || null)
    })

    res.status(201).json({
      success: true,
      message: '通知发送成功'
    })
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

router.delete('/:id', (req: Request, res: Response) => {
  const result = db.prepare('DELETE FROM notifications WHERE id = ?').run(req.params.id)

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      error: '通知不存在'
    })
  }

  res.json({
    success: true,
    message: '删除成功'
  })
})

export default router
