import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.get('/posts', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { review_status, category, page = '1', pageSize = '20' } = req.query
    const p = Number(page)
    const ps = Number(pageSize)
    const conditions: string[] = []
    const params: any[] = []

    const userRole = db.prepare('SELECT name FROM roles WHERE id = ?').get(req.user!.role_id) as any
    const isAdmin = userRole && ['street_admin', 'community_admin', 'property_admin'].includes(userRole.name)
    if (!isAdmin) { conditions.push("cp.review_status = 'approved'") }

    if (review_status && isAdmin) { conditions.push('cp.review_status = ?'); params.push(review_status) }
    if (category) { conditions.push('cp.category = ?'); params.push(category) }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
    const total = (db.prepare(`SELECT COUNT(*) as c FROM community_posts cp ${where}`).get(params) as any).c
    const rows = db.prepare(
      `SELECT cp.*, u.name as author_name, rv.name as reviewer_name
       FROM community_posts cp
       LEFT JOIN users u ON cp.author_id = u.id
       LEFT JOIN users rv ON cp.reviewer_id = rv.id
       ${where} ORDER BY cp.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, ps, (p - 1) * ps)

    res.json({ success: true, data: { list: rows, total, page: p, pageSize: ps } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/posts', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, category, images } = req.body
    if (!title || !content) {
      res.status(400).json({ success: false, error: '标题和内容不能为空' })
      return
    }

    const result = db.prepare(
      'INSERT INTO community_posts (title, content, author_id, category, images) VALUES (?,?,?,?,?)'
    ).run(title, content, req.user!.id, category || 'general', images ? JSON.stringify(images) : null)

    const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: post })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/posts/:id/review', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { review_status, review_comment } = req.body
    if (!['approved', 'rejected'].includes(review_status)) {
      res.status(400).json({ success: false, error: '审核状态无效' })
      return
    }

    const post = db.prepare('SELECT id FROM community_posts WHERE id = ?').get(req.params.id) as any
    if (!post) {
      res.status(404).json({ success: false, error: '帖子不存在' })
      return
    }

    db.prepare(
      "UPDATE community_posts SET review_status = ?, reviewer_id = ?, review_comment = ?, updated_at = datetime('now','localtime') WHERE id = ?"
    ).run(review_status, req.user!.id, review_comment || null, req.params.id)

    const updated = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/review', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', pageSize = '20' } = req.query
    const p = Number(page)
    const ps = Number(pageSize)

    const total = (db.prepare("SELECT COUNT(*) as c FROM community_posts WHERE review_status = 'pending'").get() as any).c
    const rows = db.prepare(
      `SELECT cp.*, u.name as author_name
       FROM community_posts cp LEFT JOIN users u ON cp.author_id = u.id
       WHERE cp.review_status = 'pending' ORDER BY cp.created_at DESC LIMIT ? OFFSET ?`
    ).all(ps, (p - 1) * ps)

    res.json({ success: true, data: { list: rows, total, page: p, pageSize: ps } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
