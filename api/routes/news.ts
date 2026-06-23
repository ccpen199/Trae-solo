import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { tag, page = '1', limit = '10' } = req.query
  const db = getDb()
  const pageNum = Number(page)
  const limitNum = Number(limit)
  const offset = (pageNum - 1) * limitNum

  let rows: any[]
  let total: number

  if (tag) {
    total = (db.prepare("SELECT COUNT(*) as count FROM news WHERE status = 'approved' AND tags LIKE ?").get(`%${tag}%`) as any).count
    rows = db.prepare("SELECT * FROM news WHERE status = 'approved' AND tags LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?").all(`%${tag}%`, limitNum, offset)
  } else {
    total = (db.prepare("SELECT COUNT(*) as count FROM news WHERE status = 'approved'").get() as any).count
    rows = db.prepare("SELECT * FROM news WHERE status = 'approved' ORDER BY created_at DESC LIMIT ? OFFSET ?").all(limitNum, offset)
  }

  res.json({
    success: true,
    data: {
      items: rows,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  })
})

router.get('/tags', (_req: Request, res: Response): void => {
  const db = getDb()
  const rows = db.prepare("SELECT tags FROM news WHERE status = 'approved'").all() as any[]
  const tagCount: Record<string, number> = {}
  for (const row of rows) {
    if (row.tags) {
      for (const tag of row.tags.split(',')) {
        const trimmed = tag.trim()
        if (trimmed) {
          tagCount[trimmed] = (tagCount[trimmed] || 0) + 1
        }
      }
    }
  }
  const sorted = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }))
  res.json({ success: true, data: sorted })
})

router.get('/government', (req: Request, res: Response): void => {
  const { page = '1', limit = '10' } = req.query
  const db = getDb()
  const pageNum = Number(page)
  const limitNum = Number(limit)
  const offset = (pageNum - 1) * limitNum

  const total = (db.prepare("SELECT COUNT(*) as count FROM news WHERE source = 'government' AND status = 'approved'").get() as any).count
  const rows = db.prepare("SELECT * FROM news WHERE source = 'government' AND status = 'approved' ORDER BY created_at DESC LIMIT ? OFFSET ?").all(limitNum, offset)

  res.json({
    success: true,
    data: {
      items: rows,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const news = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id)
  if (!news) {
    res.status(404).json({ success: false, error: '资讯不存在' })
    return
  }
  res.json({ success: true, data: news })
})

router.post('/submit', (req: Request, res: Response): void => {
  const { title, content, tags, authorId } = req.body
  if (!title || !content) {
    res.status(400).json({ success: false, error: '标题和内容为必填项' })
    return
  }

  const db = getDb()
  const result = db.prepare('INSERT INTO news (title, content, tags, source, status, author_id) VALUES (?, ?, ?, ?, ?, ?)')
    .run(title, content, tags || null, 'user', 'pending', authorId || null)

  const news = db.prepare('SELECT * FROM news WHERE id = ?').get(result.lastInsertRowid)
  res.json({ success: true, data: news })
})

export default router
