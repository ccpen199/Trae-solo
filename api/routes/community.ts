import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.get('/posts', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, tag, page = '1', limit = '10' } = req.query
    const conditions: string[] = []
    const params: any[] = []

    if (category) { conditions.push('cp.category = ?'); params.push(category) }
    if (tag) { conditions.push('cp.tags LIKE ?'); params.push(`%${tag}%`) }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
    const pageNum = Math.max(1, Number(page))
    const limitNum = Math.max(1, Math.min(100, Number(limit)))
    const offset = (pageNum - 1) * limitNum

    const totalResult = db.prepare(`SELECT COUNT(*) as count FROM community_posts cp ${whereClause}`).get(...params) as { count: number }
    const posts = db.prepare(`
      SELECT cp.*, u.name as author_name, u.role as author_role
      FROM community_posts cp
      JOIN users u ON cp.author_id = u.id
      ${whereClause}
      ORDER BY cp.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limitNum, offset) as any[]

    res.json({
      success: true,
      data: {
        items: posts,
        total: totalResult.count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalResult.count / limitNum),
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/posts/new', async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: {
      mode: 'create',
      categories: ['news', 'policy', 'education'],
      draft: { title: '', content: '', tags: [], category: 'policy' },
    },
  })
})

router.get('/posts/:id/comments', async (req: Request, res: Response): Promise<void> => {
  try {
    const postId = Number(req.params.id)
    if (!Number.isFinite(postId)) {
      res.json({ success: true, data: { items: [], total: 0 } })
      return
    }

    const comments = db.prepare(`
      SELECT c.*, u.name as author_name, u.role as author_role
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(postId)
    res.json({ success: true, data: { items: comments, total: comments.length } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/posts/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const post = db.prepare(`
      SELECT cp.*, u.name as author_name, u.role as author_role
      FROM community_posts cp
      JOIN users u ON cp.author_id = u.id
      WHERE cp.id = ?
    `).get(req.params.id) as any
    if (!post) {
      res.status(404).json({ success: false, error: '帖子不存在' })
      return
    }
    const comments = db.prepare(`
      SELECT c.*, u.name as author_name, u.role as author_role
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(req.params.id)
    res.json({ success: true, data: { ...post, commentList: comments } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/posts', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id']
    if (!userId) {
      res.status(401).json({ success: false, error: '未登录' })
      return
    }
    const { title, content, tags, category } = req.body
    if (!title || !content || !category) {
      res.status(400).json({ success: false, error: '缺少标题、内容或分类' })
      return
    }
    if (!['news', 'policy', 'education'].includes(category)) {
      res.status(400).json({ success: false, error: '无效的分类' })
      return
    }
    const result = db.prepare('INSERT INTO community_posts (author_id, title, content, tags, category) VALUES (?, ?, ?, ?, ?)').run(userId, title, content, JSON.stringify(tags || []), category)
    const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: post })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/posts/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id']
    if (!userId) {
      res.status(401).json({ success: false, error: '未登录' })
      return
    }
    const existing = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '帖子不存在' })
      return
    }
    if (existing.author_id !== Number(userId) && req.headers['x-user-role'] !== 'admin') {
      res.status(403).json({ success: false, error: '无权修改此帖子' })
      return
    }
    const { title, content, tags, category } = req.body
    db.prepare(`
      UPDATE community_posts SET title = COALESCE(?, title), content = COALESCE(?, content),
      tags = COALESCE(?, tags), category = COALESCE(?, category) WHERE id = ?
    `).run(title, content, tags ? JSON.stringify(tags) : null, category, req.params.id)
    const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: post })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/posts/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id']
    if (!userId) {
      res.status(401).json({ success: false, error: '未登录' })
      return
    }
    const existing = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '帖子不存在' })
      return
    }
    if (existing.author_id !== Number(userId) && req.headers['x-user-role'] !== 'admin') {
      res.status(403).json({ success: false, error: '无权删除此帖子' })
      return
    }
    db.prepare('DELETE FROM comments WHERE post_id = ?').run(req.params.id)
    db.prepare('DELETE FROM community_posts WHERE id = ?').run(req.params.id)
    res.json({ success: true, data: null })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/posts/:id/like', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id']
    if (!userId) {
      res.status(401).json({ success: false, error: '未登录' })
      return
    }
    const existing = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '帖子不存在' })
      return
    }
    db.prepare('UPDATE community_posts SET likes = likes + 1 WHERE id = ?').run(req.params.id)
    const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: post })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/posts/:id/comments', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id']
    if (!userId) {
      res.status(401).json({ success: false, error: '未登录' })
      return
    }
    const { content } = req.body
    if (!content) {
      res.status(400).json({ success: false, error: '评论内容不能为空' })
      return
    }
    const existing = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '帖子不存在' })
      return
    }
    const result = db.prepare('INSERT INTO comments (post_id, author_id, content) VALUES (?, ?, ?)').run(req.params.id, userId, content)
    db.prepare('UPDATE community_posts SET comments = comments + 1 WHERE id = ?').run(req.params.id)
    const comment = db.prepare('SELECT c.*, u.name as author_name, u.role as author_role FROM comments c JOIN users u ON c.author_id = u.id WHERE c.id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: comment })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/comments/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id']
    if (!userId) {
      res.status(401).json({ success: false, error: '未登录' })
      return
    }
    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id) as any
    if (!comment) {
      res.status(404).json({ success: false, error: '评论不存在' })
      return
    }
    if (comment.author_id !== Number(userId) && req.headers['x-user-role'] !== 'admin') {
      res.status(403).json({ success: false, error: '无权删除此评论' })
      return
    }
    db.prepare('UPDATE community_posts SET comments = comments - 1 WHERE id = ?').run(comment.post_id)
    db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id)
    res.json({ success: true, data: null })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
