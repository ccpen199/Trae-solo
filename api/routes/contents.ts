import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import authMiddleware from '../middleware/auth.js'

const router = Router()

interface AuthRequest extends Request {
  user?: any
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const content_type = req.query.content_type as string

    let whereClauses = ["review_status = 'approved'"]
    let params: any[] = []

    if (content_type) {
      whereClauses.push('content_type = ?')
      params.push(content_type)
    }

    const whereSql = 'WHERE ' + whereClauses.join(' AND ')

    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM contents ${whereSql}`)
    const total = (countStmt.get(...params) as any).count

    const offset = (page - 1) * pageSize
    const contentsStmt = db.prepare(`
      SELECT c.*, u.nickname as author_name, u.avatar as author_avatar
      FROM contents c
      LEFT JOIN users u ON c.author_id = u.id
      ${whereSql}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `)
    const contents = contentsStmt.all(...params, pageSize, offset) as any[]

    const contentsWithMedia = contents.map(content => ({
      ...content,
      media_urls: content.media_urls ? JSON.parse(content.media_urls) : [],
      tags: content.tags ? JSON.parse(content.tags) : []
    }))

    res.status(200).json({
      success: true,
      data: {
        list: contentsWithMedia,
        total,
        page,
        pageSize
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取内容列表失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const stmt = db.prepare(`
      SELECT c.*, u.nickname as author_name, u.avatar as author_avatar, u.certification_type, u.certification_status
      FROM contents c
      LEFT JOIN users u ON c.author_id = u.id
      WHERE c.id = ?
    `)
    const content = stmt.get(id) as any

    if (!content) {
      res.status(404).json({ success: false, error: '内容不存在' })
      return
    }

    content.media_urls = content.media_urls ? JSON.parse(content.media_urls) : []
    content.tags = content.tags ? JSON.parse(content.tags) : []

    db.prepare('UPDATE contents SET view_count = view_count + 1 WHERE id = ?').run(id)

    res.status(200).json({
      success: true,
      data: {
        detail: content
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取内容详情失败' })
  }
})

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content_type, body, media_urls, tags } = req.body

    if (!title) {
      res.status(400).json({ success: false, error: '内容标题不能为空' })
      return
    }

    const stmt = db.prepare(`
      INSERT INTO contents (author_id, title, content_type, body, media_urls, tags)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      req.user.id,
      title,
      content_type || 'article',
      body || null,
      JSON.stringify(media_urls || []),
      JSON.stringify(tags || [])
    )

    const newContent = db.prepare(`
      SELECT c.*, u.nickname as author_name, u.avatar as author_avatar
      FROM contents c
      LEFT JOIN users u ON c.author_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid) as any

    newContent.media_urls = newContent.media_urls ? JSON.parse(newContent.media_urls) : []
    newContent.tags = newContent.tags ? JSON.parse(newContent.tags) : []

    res.status(201).json({
      success: true,
      data: {
        content: newContent
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '发布内容失败' })
  }
})

router.post('/:id/like', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const content = db.prepare('SELECT * FROM contents WHERE id = ?').get(id) as any
    if (!content) {
      res.status(404).json({ success: false, error: '内容不存在' })
      return
    }

    const existingLike = db.prepare('SELECT * FROM content_likes WHERE content_id = ? AND user_id = ?').get(id, req.user.id) as any
    if (existingLike) {
      db.prepare('DELETE FROM content_likes WHERE id = ?').run(existingLike.id)
      db.prepare('UPDATE contents SET like_count = like_count - 1 WHERE id = ?').run(id)
      res.status(200).json({
        success: true,
        data: {
          liked: false,
          like_count: Math.max(0, content.like_count - 1)
        }
      })
      return
    }

    db.prepare('INSERT INTO content_likes (content_id, user_id) VALUES (?, ?)').run(id, req.user.id)
    db.prepare('UPDATE contents SET like_count = like_count + 1 WHERE id = ?').run(id)

    res.status(200).json({
      success: true,
      data: {
        liked: true,
        like_count: content.like_count + 1
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '点赞失败' })
  }
})

router.post('/:id/collect', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const content = db.prepare('SELECT * FROM contents WHERE id = ?').get(id) as any
    if (!content) {
      res.status(404).json({ success: false, error: '内容不存在' })
      return
    }

    const existingCollect = db.prepare('SELECT * FROM content_collects WHERE content_id = ? AND user_id = ?').get(id, req.user.id) as any
    if (existingCollect) {
      db.prepare('DELETE FROM content_collects WHERE id = ?').run(existingCollect.id)
      db.prepare('UPDATE contents SET collect_count = collect_count - 1 WHERE id = ?').run(id)
      res.status(200).json({
        success: true,
        data: {
          collected: false,
          collect_count: Math.max(0, content.collect_count - 1)
        }
      })
      return
    }

    db.prepare('INSERT INTO content_collects (content_id, user_id) VALUES (?, ?)').run(id, req.user.id)
    db.prepare('UPDATE contents SET collect_count = collect_count + 1 WHERE id = ?').run(id)

    res.status(200).json({
      success: true,
      data: {
        collected: true,
        collect_count: content.collect_count + 1
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '收藏失败' })
  }
})

export default router
