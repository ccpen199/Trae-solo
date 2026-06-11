import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'

const router = Router()

const postComments = new Map<string, any[]>()

router.get('/posts', (req: Request, res: Response): void => {
  try {
    const { topic, page = '1', pageSize = '10' } = req.query

    let sql = `
      SELECT cp.*, u.nickname, u.avatar
      FROM community_posts cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.status = '已通过'
    `
    const params: any[] = []

    if (topic) {
      sql += ' AND cp.topic = ?'
      params.push(topic)
    }

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM (${sql})`).get(...params) as { total: number }
    const total = countResult.total

    sql += ' ORDER BY cp.created_at DESC LIMIT ? OFFSET ?'
    const limit = parseInt(pageSize as string, 10)
    const offset = (parseInt(page as string, 10) - 1) * limit
    params.push(limit, offset)

    const posts = db.prepare(sql).all(...params)

    const postsWithComments = posts.map((p: any) => ({
      ...p,
      comments: postComments.get(p.id) || [],
    }))

    res.json({
      success: true,
      data: {
        list: postsWithComments,
        total,
        page: parseInt(page as string, 10),
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.post('/posts', (req: Request, res: Response): void => {
  try {
    const { userId, title, content, topic = '充电体验' } = req.body
    if (!userId || !title || !content) {
      res.status(400).json({ success: false, error: '缺少必要参数' })
      return
    }

    const id = uuidv4()
    db.prepare(`
      INSERT INTO community_posts (id, user_id, title, content, topic, likes_count, comments_count, status)
      VALUES (?, ?, ?, ?, ?, 0, 0, '待审核')
    `).run(id, userId, title, content, topic)

    const post = db.prepare(`
      SELECT cp.*, u.nickname, u.avatar
      FROM community_posts cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.id = ?
    `).get(id)

    res.json({ success: true, data: post })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.post('/posts/:id/like', (req: Request, res: Response): void => {
  try {
    const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(req.params.id) as any | undefined
    if (!post) {
      res.status(404).json({ success: false, error: '帖子未找到' })
      return
    }

    db.prepare('UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = ?').run(req.params.id)
    const updated = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(req.params.id)

    res.json({ success: true, data: { likesCount: (updated as any).likes_count } })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.post('/posts/:id/comment', (req: Request, res: Response): void => {
  try {
    const { userId, content } = req.body
    if (!userId || !content) {
      res.status(400).json({ success: false, error: '缺少 userId 或 content' })
      return
    }

    const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(req.params.id) as any | undefined
    if (!post) {
      res.status(404).json({ success: false, error: '帖子未找到' })
      return
    }

    const user = db.prepare('SELECT nickname FROM users WHERE id = ?').get(userId) as any | undefined
    const comment = {
      id: uuidv4(),
      postId: req.params.id,
      userId,
      nickname: user?.nickname || '匿名用户',
      content,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    }

    const existing = postComments.get(req.params.id) || []
    existing.push(comment)
    postComments.set(req.params.id, existing)

    db.prepare('UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = ?').run(req.params.id)

    res.json({ success: true, data: comment })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/reviews', (req: Request, res: Response): void => {
  try {
    const { status } = req.query

    let sql = `
      SELECT cp.*, u.nickname, u.avatar
      FROM community_posts cp
      JOIN users u ON cp.user_id = u.id
      WHERE 1=1
    `
    const params: any[] = []

    if (status) {
      sql += ' AND cp.status = ?'
      params.push(status)
    }

    sql += ' ORDER BY cp.created_at DESC'
    const posts = db.prepare(sql).all(...params)

    res.json({ success: true, data: posts })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.put('/reviews/:id', (req: Request, res: Response): void => {
  try {
    const { action } = req.body
    if (!action || !['approve', 'reject'].includes(action)) {
      res.status(400).json({ success: false, error: 'action 必须为 approve 或 reject' })
      return
    }

    const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(req.params.id) as any | undefined
    if (!post) {
      res.status(404).json({ success: false, error: '帖子未找到' })
      return
    }

    const newStatus = action === 'approve' ? '已通过' : '已拒绝'
    db.prepare('UPDATE community_posts SET status = ? WHERE id = ?').run(newStatus, req.params.id)

    res.json({ success: true, data: { id: req.params.id, status: newStatus } })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

export default router
