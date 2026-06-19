import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.post('/check', (req: Request, res: Response): void => {
  const db = getDb()
  const { title, description, post_id } = req.body

  if (!title && !description && !post_id) {
    res.status(400).json({ success: false, error: 'Provide title/description or post_id' })
    return
  }

  let textToCheck = ''
  let postId: number | null = null

  if (post_id) {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(post_id) as Record<string, unknown> | undefined
    if (!post) {
      res.status(404).json({ success: false, error: 'Post not found' })
      return
    }
    textToCheck = ((post.title as string) || '') + ' ' + ((post.description as string) || '')
    postId = Number(post_id)
  } else {
    textToCheck = (title || '') + ' ' + (description || '')
  }

  const sensitiveWords = db.prepare('SELECT * FROM sensitive_words').all() as Array<Record<string, unknown>>
  const hits: Array<{ word: string; category: string; positions: number[] }> = []

  let riskScore = 0
  const categoryWeights: Record<string, number> = {
    politics: 50,
    fraud: 30,
    adult: 25,
    violence: 35,
  }

  for (const sw of sensitiveWords) {
    const word = sw.word as string
    const category = sw.category as string
    const regex = new RegExp(word, 'gi')
    const matches = textToCheck.match(regex)
    if (matches) {
      hits.push({ word, category, positions: [] })
      riskScore += categoryWeights[category] || 10
      db.prepare('UPDATE sensitive_words SET hit_count = hit_count + ? WHERE word = ?').run(matches.length, word)
    }
  }

  riskScore = Math.min(100, riskScore)

  if (postId) {
    db.prepare('UPDATE posts SET risk_score = ? WHERE id = ?').run(riskScore, postId)
  }

  res.json({
    success: true,
    data: {
      risk_score: riskScore,
      hits,
      hit_count: hits.length,
      level: riskScore >= 60 ? 'high' : riskScore >= 30 ? 'medium' : 'low',
    },
  })
})

router.get('/words', (req: Request, res: Response): void => {
  const db = getDb()
  const {
    category,
    page = '1',
    limit = '20',
  } = req.query

  const conditions: string[] = []
  const params: unknown[] = []

  if (category) {
    conditions.push('category = ?')
    params.push(category)
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
  const pageNum = Math.max(1, Number(page))
  const limitNum = Math.max(1, Math.min(100, Number(limit)))
  const offset = (pageNum - 1) * limitNum

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM sensitive_words ${where}`).get(...params) as { total: number }
  const rows = db.prepare(
    `SELECT * FROM sensitive_words ${where} ORDER BY hit_count DESC LIMIT ? OFFSET ?`
  ).all(...params, limitNum, offset)

  res.json({
    success: true,
    data: {
      items: rows,
      total: countRow.total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(countRow.total / limitNum),
    },
  })
})

router.post('/words', (req: Request, res: Response): void => {
  const db = getDb()
  const { word, category } = req.body

  if (!word || !category) {
    res.status(400).json({ success: false, error: 'Missing required fields: word, category' })
    return
  }

  const existing = db.prepare('SELECT * FROM sensitive_words WHERE word = ?').get(word)
  if (existing) {
    res.status(409).json({ success: false, error: 'Sensitive word already exists' })
    return
  }

  const result = db.prepare('INSERT INTO sensitive_words (word, category, hit_count) VALUES (?, ?, 0)').run(word, category)
  const created = db.prepare('SELECT * FROM sensitive_words WHERE id = ?').get(result.lastInsertRowid)

  res.status(201).json({ success: true, data: created })
})

router.delete('/words/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM sensitive_words WHERE id = ?').get(req.params.id)

  if (!existing) {
    res.status(404).json({ success: false, error: 'Sensitive word not found' })
    return
  }

  db.prepare('DELETE FROM sensitive_words WHERE id = ?').run(req.params.id)
  res.json({ success: true, data: { id: Number(req.params.id) } })
})

router.get('/stats', (req: Request, res: Response): void => {
  const db = getDb()

  const distribution = db.prepare(
    `SELECT
      CASE
        WHEN risk_score = 0 THEN 'safe'
        WHEN risk_score BETWEEN 1 AND 29 THEN 'low'
        WHEN risk_score BETWEEN 30 AND 59 THEN 'medium'
        ELSE 'high'
      END as level,
      COUNT(*) as count
    FROM posts
    GROUP BY level
    ORDER BY CASE level
      WHEN 'safe' THEN 1
      WHEN 'low' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'high' THEN 4
    END`
  ).all()

  const totalPosts = (db.prepare('SELECT COUNT(*) as count FROM posts').get() as { count: number }).count
  const avgRisk = (db.prepare('SELECT AVG(risk_score) as avg FROM posts').get() as { avg: number | null }).avg || 0
  const highRiskCount = (db.prepare('SELECT COUNT(*) as count FROM posts WHERE risk_score >= 60').get() as { count: number }).count
  const pendingReview = (db.prepare("SELECT COUNT(*) as count FROM posts WHERE status = 'pending'").get() as { count: number }).count

  const byCategory = db.prepare(
    `SELECT category, COUNT(*) as count, AVG(risk_score) as avg_risk, MAX(risk_score) as max_risk
    FROM posts
    GROUP BY category
    ORDER BY avg_risk DESC`
  ).all()

  res.json({
    success: true,
    data: {
      total_posts: totalPosts,
      avg_risk_score: Math.round(avgRisk * 100) / 100,
      high_risk_count: highRiskCount,
      pending_review: pendingReview,
      distribution,
      by_category: byCategory,
    },
  })
})

export default router
