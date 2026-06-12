import { Router, type Request, type Response } from 'express'
import { getDb } from '../db/init.js'
import { auth, optionalAuth } from '../middleware/auth.js'

const router = Router()

router.get('/questions', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 10, keyword, tags, sort_by = 'created_at' } = req.query
  const db = getDb()

  let sql = `
    SELECT q.*, u.avatar as author_avatar
    FROM questions q
    LEFT JOIN users u ON q.author_id = u.id
    WHERE 1=1
  `
  const params: Array<string | number> = []

  if (keyword) {
    sql += ' AND (q.title LIKE ? OR q.content LIKE ?)'
    params.push(`%${keyword}%`, `%${keyword}%`)
  }
  if (tags) {
    sql += ' AND q.tags LIKE ?'
    params.push(`%${tags}%`)
  }

  const total = db.prepare(sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) FROM')).get(...params) as { 'COUNT(*)': number }

  const validSort = ['created_at', 'views_count', 'answers_count', 'likes_count']
  const sortBy = validSort.includes(sort_by as string) ? sort_by : 'created_at'
  sql += ` ORDER BY q.${sortBy} DESC LIMIT ? OFFSET ?`
  params.push(Number(limit), (Number(page) - 1) * Number(limit))

  const questions = db.prepare(sql).all(...params)

  res.json({
    success: true,
    data: {
      list: questions,
      total: total['COUNT(*)'],
      page: Number(page),
      limit: Number(limit),
    },
  })
})

router.get('/questions/hot', async (_req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const questions = db.prepare(`
    SELECT q.id, q.title, q.tags, q.views_count, q.answers_count, q.likes_count, q.created_at,
           q.author_name, u.avatar as author_avatar
    FROM questions q
    LEFT JOIN users u ON q.author_id = u.id
    ORDER BY q.likes_count DESC, q.views_count DESC
    LIMIT 10
  `).all()

  res.json({
    success: true,
    data: questions,
  })
})

router.get('/question/:id', async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const question = db.prepare(`
    SELECT q.*, u.avatar as author_avatar
    FROM questions q
    LEFT JOIN users u ON q.author_id = u.id
    WHERE q.id = ?
  `).get(Number(req.params.id))

  if (!question) {
    res.status(404).json({ success: false, error: '问题不存在' })
    return
  }

  db.prepare('UPDATE questions SET views_count = views_count + 1 WHERE id = ?').run(Number(req.params.id))

  const answers = db.prepare(`
    SELECT a.*, u.avatar as author_avatar
    FROM answers a
    LEFT JOIN users u ON a.author_id = u.id
    WHERE a.question_id = ?
    ORDER BY a.is_accepted DESC, a.likes_count DESC, a.created_at ASC
  `).all(Number(req.params.id))

  const q = question as { id: number; tags?: string | null; title: string }
  const tagList = q.tags?.split(',') || []
  let similarSql = `
    SELECT q.id, q.title, q.tags, q.views_count, q.answers_count, q.likes_count
    FROM questions q
    WHERE q.id != ?
  `
  const similarParams: Array<string | number> = [q.id]
  if (tagList.length > 0) {
    similarSql += ' AND (' + tagList.map(() => 'q.tags LIKE ?').join(' OR ') + ')'
    tagList.forEach(t => similarParams.push(`%${t.trim()}%`))
  }
  similarSql += ' ORDER BY q.views_count DESC LIMIT 5'
  const similar = db.prepare(similarSql).all(...similarParams)

  res.json({
    success: true,
    data: {
      ...(question as Record<string, unknown>),
      answers,
      similar_questions: similar,
    },
  })
})

router.post('/questions', auth, async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const { title, content, tags } = req.body

  if (!title || !content) {
    res.status(400).json({ success: false, error: '缺少必要字段：title, content' })
    return
  }

  const user = db.prepare('SELECT username FROM users WHERE id = ?').get(req.user!.userId) as { username: string } | undefined
  if (!user) {
    res.status(404).json({ success: false, error: '用户不存在' })
    return
  }

  const result = db.prepare(`
    INSERT INTO questions (author_id, author_name, title, content, tags)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user!.userId, user.username, title, content, tags ?? null)

  const question = db.prepare(`
    SELECT q.*, u.avatar as author_avatar
    FROM questions q
    LEFT JOIN users u ON q.author_id = u.id
    WHERE q.id = ?
  `).get(result.lastInsertRowid)

  res.status(201).json({
    success: true,
    message: '问题发布成功',
    data: question,
  })
})

router.post('/questions/:id/like', auth, async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const qId = Number(req.params.id)
  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(qId)

  if (!question) {
    res.status(404).json({ success: false, error: '问题不存在' })
    return
  }

  db.prepare('UPDATE questions SET likes_count = likes_count + 1 WHERE id = ?').run(qId)
  const updated = db.prepare('SELECT id, likes_count FROM questions WHERE id = ?').get(qId)

  res.json({
    success: true,
    message: '点赞成功',
    data: updated,
  })
})

router.post('/answers', auth, async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const { question_id, content } = req.body

  if (!question_id || !content) {
    res.status(400).json({ success: false, error: '缺少必要字段：question_id, content' })
    return
  }

  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(question_id)
  if (!question) {
    res.status(404).json({ success: false, error: '问题不存在' })
    return
  }

  const user = db.prepare('SELECT username FROM users WHERE id = ?').get(req.user!.userId) as { username: string } | undefined
  if (!user) {
    res.status(404).json({ success: false, error: '用户不存在' })
    return
  }

  const result = db.prepare(`
    INSERT INTO answers (question_id, author_id, author_name, content)
    VALUES (?, ?, ?, ?)
  `).run(question_id, req.user!.userId, user.username, content)

  db.prepare('UPDATE questions SET answers_count = answers_count + 1 WHERE id = ?').run(question_id)

  const answer = db.prepare(`
    SELECT a.*, u.avatar as author_avatar
    FROM answers a
    LEFT JOIN users u ON a.author_id = u.id
    WHERE a.id = ?
  `).get(result.lastInsertRowid)

  res.status(201).json({
    success: true,
    message: '回答发布成功',
    data: answer,
  })
})

router.post('/answers/:id/like', auth, async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const aId = Number(req.params.id)
  const answer = db.prepare('SELECT * FROM answers WHERE id = ?').get(aId)

  if (!answer) {
    res.status(404).json({ success: false, error: '回答不存在' })
    return
  }

  db.prepare('UPDATE answers SET likes_count = likes_count + 1 WHERE id = ?').run(aId)
  const updated = db.prepare('SELECT id, likes_count FROM answers WHERE id = ?').get(aId)

  res.json({
    success: true,
    message: '点赞成功',
    data: updated,
  })
})

router.put('/answers/:id/accept', auth, async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const aId = Number(req.params.id)
  const answer = db.prepare('SELECT * FROM answers WHERE id = ?').get(aId) as { id: number; question_id: number } | undefined

  if (!answer) {
    res.status(404).json({ success: false, error: '回答不存在' })
    return
  }

  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(answer.question_id) as { id: number; author_id: number } | undefined
  if (!question || question.author_id !== req.user!.userId) {
    res.status(403).json({ success: false, error: '只有提问者才能采纳答案' })
    return
  }

  db.prepare('UPDATE answers SET is_accepted = 0 WHERE question_id = ?').run(answer.question_id)
  db.prepare('UPDATE answers SET is_accepted = 1 WHERE id = ?').run(aId)

  const updated = db.prepare('SELECT id, is_accepted FROM answers WHERE id = ?').get(aId)

  res.json({
    success: true,
    message: '已采纳该答案',
    data: updated,
  })
})

router.get('/my/questions', auth, async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const { page = 1, limit = 10 } = req.query

  let sql = `
    SELECT q.*, u.avatar as author_avatar
    FROM questions q
    LEFT JOIN users u ON q.author_id = u.id
    WHERE q.author_id = ?
    ORDER BY q.created_at DESC
    LIMIT ? OFFSET ?
  `

  const questions = db.prepare(sql).all(req.user!.userId, Number(limit), (Number(page) - 1) * Number(limit))
  const total = db.prepare('SELECT COUNT(*) as c FROM questions WHERE author_id = ?').get(req.user!.userId) as { c: number }

  res.json({
    success: true,
    data: {
      list: questions,
      total: total.c,
      page: Number(page),
      limit: Number(limit),
    },
  })
})

router.get('/my/answers', auth, async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const { page = 1, limit = 10 } = req.query

  let sql = `
    SELECT a.*, q.title as question_title, u.avatar as author_avatar
    FROM answers a
    LEFT JOIN questions q ON a.question_id = q.id
    LEFT JOIN users u ON a.author_id = u.id
    WHERE a.author_id = ?
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `

  const answers = db.prepare(sql).all(req.user!.userId, Number(limit), (Number(page) - 1) * Number(limit))
  const total = db.prepare('SELECT COUNT(*) as c FROM answers WHERE author_id = ?').get(req.user!.userId) as { c: number }

  res.json({
    success: true,
    data: {
      list: answers,
      total: total.c,
      page: Number(page),
      limit: Number(limit),
    },
  })
})

router.get('/tags/hot', async (_req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const rows = db.prepare('SELECT tags FROM questions WHERE tags IS NOT NULL AND tags != ""').all() as Array<{ tags: string }>

  const tagCount: Record<string, number> = {}
  rows.forEach(r => {
    r.tags.split(',').forEach(t => {
      const tag = t.trim()
      if (tag) tagCount[tag] = (tagCount[tag] || 0) + 1
    })
  })

  const hotTags = Object.entries(tagCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  res.json({
    success: true,
    data: hotTags,
  })
})

export default router
