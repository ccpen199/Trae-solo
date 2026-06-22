import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../database.js'

const router = Router()
const DEFAULT_AUTHOR_ID = 'creator-demo'
const DEFAULT_AUTHOR_NAME = '居易内容组'

function normalizeImageList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      }
    } catch {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    }
  }

  return []
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

router.post('/', (req: Request, res: Response): void => {
  const { authorId, authorName, buildingId, type, title, content, images } = req.body

  if (!title || !content) {
    res.status(400).json({ success: false, error: '缺少必要参数' })
    return
  }

  const id = uuidv4()
  const imageList = normalizeImageList(images)

  db.prepare(`INSERT INTO creator_contents (id, authorId, authorName, buildingId, type, title, content, images, likes, views)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`).run(
    id,
    authorId || DEFAULT_AUTHOR_ID,
    authorName || DEFAULT_AUTHOR_NAME,
    buildingId || '',
    type || 'article',
    title,
    content,
    JSON.stringify(imageList)
  )

  const created = db.prepare('SELECT * FROM creator_contents WHERE id = ?').get(id)

  res.json({ success: true, data: created })
})

router.get('/', (req: Request, res: Response): void => {
  const { authorId, buildingId, type } = req.query

  let sql = 'SELECT * FROM creator_contents WHERE 1=1'
  const params: unknown[] = []

  if (authorId && typeof authorId === 'string') {
    sql += ' AND authorId = ?'
    params.push(authorId)
  }

  if (buildingId && typeof buildingId === 'string') {
    sql += ' AND buildingId = ?'
    params.push(buildingId)
  }

  if (type && typeof type === 'string') {
    sql += ' AND type = ?'
    params.push(type)
  }

  sql += ' ORDER BY createdAt DESC'

  const contents = db.prepare(sql).all(...params) as Record<string, unknown>[]

  const result = contents.map(c => ({
    ...c,
    images: JSON.parse(c.images as string || '[]')
  }))

  res.json({ success: true, data: result })
})

router.get('/stats', (req: Request, res: Response): void => {
  const authorId = typeof req.query.authorId === 'string' && req.query.authorId.trim()
    ? req.query.authorId
    : DEFAULT_AUTHOR_ID

  const contents = db.prepare(`
    SELECT id, title, likes, views, createdAt
    FROM creator_contents
    WHERE authorId = ?
    ORDER BY createdAt DESC
  `).all(authorId) as Record<string, unknown>[]

  const totalLikes = contents.reduce((sum, item) => sum + toNumber(item.likes), 0)
  const totalViews = contents.reduce((sum, item) => sum + toNumber(item.views), 0)
  const totalComments = contents.reduce((sum, item) => sum + Math.max(0, Math.round(toNumber(item.likes) / 5)), 0)

  const trendTemplate = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    const key = date.toISOString().slice(0, 10)
    return {
      key,
      date: key.slice(5),
      reads: 0,
    }
  })
  const trendMap = new Map(trendTemplate.map((item) => [item.key, item]))

  for (const item of contents) {
    const createdAt = String(item.createdAt || '')
    const key = createdAt.slice(0, 10)
    const bucket = trendMap.get(key)
    if (bucket) {
      bucket.reads += Math.max(1, toNumber(item.views))
    }
  }

  const comparison = contents
    .slice()
    .sort((left, right) => (toNumber(right.views) + toNumber(right.likes)) - (toNumber(left.views) + toNumber(left.likes)))
    .slice(0, 5)
    .map((item) => ({
      title: String(item.title || '未命名内容').slice(0, 10),
      likes: toNumber(item.likes),
      comments: Math.max(0, Math.round(toNumber(item.likes) / 5)),
    }))

  res.json({
    success: true,
    data: {
      authorId,
      total_reads: totalViews,
      total_likes: totalLikes,
      total_comments: totalComments,
      content_count: contents.length,
      read_trend: trendTemplate,
      like_comment_by_content: comparison,
    }
  })
})

router.get('/feed', (req: Request, res: Response): void => {
  const feedItems = db.prepare(`
    SELECT fi.*, b.name as buildingName, b.district, b.avgPrice
    FROM feed_items fi
    LEFT JOIN buildings b ON fi.buildingId = b.id
    ORDER BY fi.createdAt DESC
  `).all()

  res.json({ success: true, data: feedItems })
})

router.post('/subscriptions', (req: Request, res: Response): void => {
  const { userId, buildingId, type } = req.body

  if (!userId || !buildingId) {
    res.status(400).json({ success: false, error: '缺少必要参数' })
    return
  }

  const existing = db.prepare('SELECT id FROM subscriptions WHERE userId = ? AND buildingId = ? AND type = ?').get(userId, buildingId, type || 'price')
  if (existing) {
    res.status(400).json({ success: false, error: '已订阅该楼盘' })
    return
  }

  const id = uuidv4()
  db.prepare('INSERT INTO subscriptions (id, userId, buildingId, type) VALUES (?, ?, ?, ?)').run(
    id, userId, buildingId, type || 'price'
  )

  res.json({ success: true, data: { id, userId, buildingId, type: type || 'price' } })
})

router.delete('/subscriptions/:id', (req: Request, res: Response): void => {
  const { id } = req.params

  const existing = db.prepare('SELECT id FROM subscriptions WHERE id = ?').get(id)
  if (!existing) {
    res.status(404).json({ success: false, error: '订阅不存在' })
    return
  }

  db.prepare('DELETE FROM subscriptions WHERE id = ?').run(id)

  res.json({ success: true, message: '取消订阅成功' })
})

export default router
