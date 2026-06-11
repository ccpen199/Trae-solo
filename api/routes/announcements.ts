import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.get('/', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, priority, page = '1', pageSize = '20' } = req.query
    const p = Number(page)
    const ps = Number(pageSize)
    const conditions: string[] = []
    const params: any[] = []

    if (status) { conditions.push('a.status = ?'); params.push(status) }
    if (priority) { conditions.push('a.priority = ?'); params.push(priority) }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
    const total = (db.prepare(`SELECT COUNT(*) as c FROM announcements a ${where}`).get(params) as any).c
    const rows = db.prepare(
      `SELECT a.*, u.name as author_name FROM announcements a LEFT JOIN users u ON a.author_id = u.id ${where} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, ps, (p - 1) * ps)

    res.json({ success: true, data: { list: rows, total, page: p, pageSize: ps } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, priority, target_scope, status } = req.body
    if (!title || !content) {
      res.status(400).json({ success: false, error: '标题和内容不能为空' })
      return
    }

    const result = db.prepare(
      'INSERT INTO announcements (title, content, author_id, priority, target_scope, status) VALUES (?,?,?,?,?,?)'
    ).run(title, content, req.user!.id, priority || 'normal', target_scope ? JSON.stringify(target_scope) : '{}', status || 'published')

    const announcement = db.prepare('SELECT * FROM announcements WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: announcement })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, priority, target_scope, status } = req.body
    const announcement = db.prepare('SELECT id FROM announcements WHERE id = ?').get(req.params.id) as any
    if (!announcement) {
      res.status(404).json({ success: false, error: '公告不存在' })
      return
    }

    db.prepare(
      `UPDATE announcements SET title = COALESCE(?,title), content = COALESCE(?,content),
       priority = COALESCE(?,priority), target_scope = COALESCE(?,target_scope),
       status = COALESCE(?,status), updated_at = datetime('now','localtime') WHERE id = ?`
    ).run(
      title || null, content || null, priority || null,
      target_scope ? JSON.stringify(target_scope) : null,
      status || null, req.params.id
    )

    const updated = db.prepare('SELECT * FROM announcements WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/:id', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const announcement = db.prepare('SELECT id FROM announcements WHERE id = ?').get(req.params.id) as any
    if (!announcement) {
      res.status(404).json({ success: false, error: '公告不存在' })
      return
    }

    db.prepare('DELETE FROM announcement_reads WHERE announcement_id = ?').run(req.params.id)
    db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id)
    res.json({ success: true, data: null })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
