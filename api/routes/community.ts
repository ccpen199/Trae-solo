import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { review_status, topic_tag } = req.query
  let sql = `SELECT p.*, u.name as user_name, u.avatar_url as user_avatar
    FROM community_posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.review_status = ?`
  const params: any[] = [review_status || 'approved']

  if (topic_tag) {
    sql += ' AND p.topic_tags LIKE ?'
    params.push(`%"${topic_tag}"%`)
  }
  sql += ' ORDER BY p.created_at DESC'

  const posts = db.prepare(sql).all(...params)
  res.json({ success: true, data: posts })
})

router.post('/', (req: Request, res: Response): void => {
  const userId = req.headers['x-user-id']
  if (!userId) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const { content, image_urls, topic_tags } = req.body
  if (!content) {
    res.status(400).json({ success: false, error: '内容为必填项' })
    return
  }

  const riskKeywords = ['代购', '私下交易', '加微信', '转账', '红包', '低价出售']
  let riskLevel = 'low'
  for (const keyword of riskKeywords) {
    if (content.includes(keyword)) {
      riskLevel = 'high'
      break
    }
  }

  const reviewStatus = riskLevel === 'high' ? 'flagged' : 'pending'

  const result = db.prepare(
    'INSERT INTO community_posts (user_id, content, image_urls, topic_tags, review_status, risk_level) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    Number(userId),
    content,
    image_urls ? JSON.stringify(image_urls) : null,
    topic_tags ? JSON.stringify(topic_tags) : null,
    reviewStatus,
    riskLevel
  )

  const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(result.lastInsertRowid)
  res.json({ success: true, data: post })
})

router.post('/:id/like', (req: Request, res: Response): void => {
  const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(Number(req.params.id))
  if (!post) {
    res.status(404).json({ success: false, error: '帖子不存在' })
    return
  }

  db.prepare('UPDATE community_posts SET like_count = like_count + 1 WHERE id = ?').run(Number(req.params.id))
  const updated = db.prepare('SELECT id, like_count FROM community_posts WHERE id = ?').get(Number(req.params.id))
  res.json({ success: true, data: updated })
})

router.post('/:id/comment', (req: Request, res: Response): void => {
  const userId = req.headers['x-user-id']
  if (!userId) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const { content } = req.body
  if (!content) {
    res.status(400).json({ success: false, error: '评论内容为必填项' })
    return
  }

  const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(Number(req.params.id))
  if (!post) {
    res.status(404).json({ success: false, error: '帖子不存在' })
    return
  }

  const result = db.prepare(
    'INSERT INTO post_comments (post_id, user_id, content) VALUES (?, ?, ?)'
  ).run(Number(req.params.id), Number(userId), content)

  db.prepare('UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = ?').run(Number(req.params.id))

  const comment = db.prepare('SELECT * FROM post_comments WHERE id = ?').get(result.lastInsertRowid)
  res.json({ success: true, data: comment })
})

router.post('/:id/report', (req: Request, res: Response): void => {
  const userId = req.headers['x-user-id']
  if (!userId) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(Number(req.params.id))
  if (!post) {
    res.status(404).json({ success: false, error: '帖子不存在' })
    return
  }

  const { reason } = req.body
  db.prepare('UPDATE community_posts SET review_status = ?, risk_level = ? WHERE id = ?').run('flagged', 'high', Number(req.params.id))

  res.json({ success: true, data: { reported: true, reason: reason || '用户举报' } })
})

export default router
