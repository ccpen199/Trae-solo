import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { category, region, page = '1', limit = '10' } = req.query
  const db = getDb()
  const pageNum = Number(page)
  const limitNum = Number(limit)
  const offset = (pageNum - 1) * limitNum

  let sql = "SELECT * FROM circles WHERE 1=1"
  const params: any[] = []

  if (category) {
    sql += " AND category = ?"
    params.push(category)
  }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count')
  const total = (db.prepare(countSql).get(...params) as any).count

  sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
  params.push(limitNum, offset)

  const rows = db.prepare(sql).all(...params) as any[]

  res.json({
    success: true,
    data: {
      items: rows,
      total,
    },
  })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const circle = db.prepare('SELECT * FROM circles WHERE id = ?').get(Number(req.params.id)) as any
  if (!circle) {
    res.status(404).json({ success: false, error: '圈子不存在' })
    return
  }

  const memberCount = (db.prepare('SELECT COUNT(*) as count FROM circle_members WHERE circle_id = ?').get(Number(req.params.id)) as any).count
  const postCount = (db.prepare('SELECT COUNT(*) as count FROM posts WHERE circle_id = ?').get(Number(req.params.id)) as any).count

  res.json({
    success: true,
    data: {
      ...circle,
      member_count: memberCount,
      post_count: postCount,
    },
  })
})

router.post('/', (req: Request, res: Response): void => {
  const { name, description, category, cover_image, owner_id } = req.body
  if (!name || !owner_id) {
    res.status(400).json({ success: false, error: '圈子名称和创建者ID为必填项' })
    return
  }

  const db = getDb()
  const result = db.prepare(
    'INSERT INTO circles (name, description, category, cover_image, owner_id, status) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, description || null, category || null, cover_image || null, owner_id, 'pending')

  const circle = db.prepare('SELECT * FROM circles WHERE id = ?').get(result.lastInsertRowid)
  res.json({ success: true, data: circle })
})

router.post('/:id/join', (req: Request, res: Response): void => {
  const { user_id } = req.body
  if (!user_id) {
    res.status(400).json({ success: false, error: 'user_id为必填项' })
    return
  }

  const db = getDb()
  const circle = db.prepare('SELECT * FROM circles WHERE id = ?').get(Number(req.params.id))
  if (!circle) {
    res.status(404).json({ success: false, error: '圈子不存在' })
    return
  }

  const existing = db.prepare('SELECT id FROM circle_members WHERE circle_id = ? AND user_id = ?').get(Number(req.params.id), user_id)
  if (existing) {
    res.status(409).json({ success: false, error: '已加入该圈子' })
    return
  }

  db.prepare('INSERT INTO circle_members (circle_id, user_id, role) VALUES (?, ?, ?)').run(Number(req.params.id), user_id, 'member')
  res.json({ success: true, data: { message: '加入成功' } })
})

router.get('/:id/posts', (req: Request, res: Response): void => {
  const db = getDb()
  const circle = db.prepare('SELECT * FROM circles WHERE id = ?').get(Number(req.params.id))
  if (!circle) {
    res.status(404).json({ success: false, error: '圈子不存在' })
    return
  }

  const posts = db.prepare(`
    SELECT p.*, u.nickname, u.avatar
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    WHERE p.circle_id = ?
    ORDER BY p.created_at DESC
  `).all(Number(req.params.id))

  res.json({ success: true, data: posts })
})

router.post('/:id/posts', (req: Request, res: Response): void => {
  const { author_id, content, media_urls, type } = req.body
  if (!author_id || !content) {
    res.status(400).json({ success: false, error: 'author_id和content为必填项' })
    return
  }

  const db = getDb()
  const circle = db.prepare('SELECT * FROM circles WHERE id = ?').get(Number(req.params.id))
  if (!circle) {
    res.status(404).json({ success: false, error: '圈子不存在' })
    return
  }

  const result = db.prepare(
    'INSERT INTO posts (circle_id, author_id, content, media_urls, type) VALUES (?, ?, ?, ?, ?)'
  ).run(Number(req.params.id), author_id, content, media_urls || null, type || 'text')

  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid)
  res.json({ success: true, data: post })
})

export default router
