import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { randomUUID } from 'crypto'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { category, keyword, enabled, page = '1', pageSize = '10' } = req.query
  const pageNum = parseInt(page as string)
  const pageSizeNum = parseInt(pageSize as string)
  const offset = (pageNum - 1) * pageSizeNum

  let whereClauses: string[] = []
  let params: any[] = []

  if (category) {
    whereClauses.push('category = ?')
    params.push(category)
  }
  if (keyword) {
    whereClauses.push('(question LIKE ? OR answer LIKE ? OR keywords LIKE ?)')
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
  }
  if (enabled !== undefined) {
    whereClauses.push('enabled = ?')
    params.push(enabled === 'true' || enabled === '1' ? 1 : 0)
  }

  const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''

  const totalStmt = db.prepare(`SELECT COUNT(*) as count FROM knowledge_items ${whereSql}`)
  const total = totalStmt.get(...params) as { count: number }

  const stmt = db.prepare(`SELECT * FROM knowledge_items ${whereSql} ORDER BY hit_count DESC, created_at DESC LIMIT ? OFFSET ?`)
  const items = stmt.all(...params, pageSizeNum, offset)

  const parsed = items.map((k: any) => ({
    ...k,
    keywords: JSON.parse(k.keywords),
  }))

  res.json({
    success: true,
    data: {
      list: parsed,
      total: total.count,
      page: pageNum,
      pageSize: pageSizeNum,
    },
  })
})

router.get('/categories', (req: Request, res: Response): void => {
  const categories = db.prepare(`
    SELECT category, COUNT(*) as count
    FROM knowledge_items
    WHERE enabled = 1
    GROUP BY category
    ORDER BY count DESC
  `).all()

  res.json({
    success: true,
    data: categories,
  })
})

router.get('/hot', (req: Request, res: Response): void => {
  const { limit = '10' } = req.query
  const limitNum = parseInt(limit as string)

  const items = db.prepare(`
    SELECT * FROM knowledge_items
    WHERE enabled = 1
    ORDER BY hit_count DESC
    LIMIT ?
  `).all(limitNum)

  const parsed = items.map((k: any) => ({
    ...k,
    keywords: JSON.parse(k.keywords),
  }))

  res.json({
    success: true,
    data: parsed,
  })
})

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params

  const stmt = db.prepare('SELECT * FROM knowledge_items WHERE id = ?')
  const item = stmt.get(id) as any

  if (!item) {
    res.status(404).json({ success: false, error: '知识条目不存在' })
    return
  }

  db.prepare('UPDATE knowledge_items SET hit_count = hit_count + 1 WHERE id = ?').run(id)

  res.json({
    success: true,
    data: {
      ...item,
      keywords: JSON.parse(item.keywords),
    },
  })
})

router.post('/search', (req: Request, res: Response): void => {
  const { query, category, limit = 20 } = req.body

  if (!query) {
    res.status(400).json({ success: false, error: '搜索关键词不能为空' })
    return
  }

  let whereClauses: string[] = ['enabled = 1']
  let params: any[] = []

  whereClauses.push('(question LIKE ? OR answer LIKE ? OR keywords LIKE ?)')
  params.push(`%${query}%`, `%${query}%`, `%${query}%`)

  if (category) {
    whereClauses.push('category = ?')
    params.push(category)
  }

  const whereSql = 'WHERE ' + whereClauses.join(' AND ')

  const items = db.prepare(`
    SELECT * FROM knowledge_items ${whereSql}
    ORDER BY (
      CASE
        WHEN question LIKE ? THEN 1
        WHEN keywords LIKE ? THEN 2
        ELSE 3
      END
    ), hit_count DESC
    LIMIT ?
  `).all(...params, `%${query}%`, `%${query}%`, limit)

  const parsed = items.map((k: any) => ({
    ...k,
    keywords: JSON.parse(k.keywords),
  }))

  res.json({
    success: true,
    data: parsed,
  })
})

router.post('/', (req: Request, res: Response): void => {
  const { question, answer, category, keywords = [], enabled = 1 } = req.body

  if (!question || !answer || !category) {
    res.status(400).json({ success: false, error: '问题、答案和分类不能为空' })
    return
  }

  const id = randomUUID()
  const stmt = db.prepare(`
    INSERT INTO knowledge_items (id, question, answer, category, keywords, hit_count, enabled)
    VALUES (?, ?, ?, ?, ?, 0, ?)
  `)
  stmt.run(id, question, answer, category, JSON.stringify(keywords), enabled ? 1 : 0)

  const newItem = db.prepare('SELECT * FROM knowledge_items WHERE id = ?').get(id) as any
  res.status(201).json({
    success: true,
    data: {
      ...newItem,
      keywords: JSON.parse(newItem.keywords),
    },
  })
})

router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const { question, answer, category, keywords, enabled, hit_count } = req.body

  const itemStmt = db.prepare('SELECT * FROM knowledge_items WHERE id = ?')
  const existing = itemStmt.get(id) as any

  if (!existing) {
    res.status(404).json({ success: false, error: '知识条目不存在' })
    return
  }

  const updateFields: string[] = []
  const updateParams: any[] = []

  if (question !== undefined) {
    updateFields.push('question = ?')
    updateParams.push(question)
  }
  if (answer !== undefined) {
    updateFields.push('answer = ?')
    updateParams.push(answer)
  }
  if (category !== undefined) {
    updateFields.push('category = ?')
    updateParams.push(category)
  }
  if (keywords !== undefined) {
    updateFields.push('keywords = ?')
    updateParams.push(JSON.stringify(keywords))
  }
  if (enabled !== undefined) {
    updateFields.push('enabled = ?')
    updateParams.push(enabled ? 1 : 0)
  }
  if (hit_count !== undefined) {
    updateFields.push('hit_count = ?')
    updateParams.push(hit_count)
  }

  if (updateFields.length > 0) {
    updateParams.push(id)
    const stmt = db.prepare(`UPDATE knowledge_items SET ${updateFields.join(', ')} WHERE id = ?`)
    stmt.run(...updateParams)
  }

  const updated = db.prepare('SELECT * FROM knowledge_items WHERE id = ?').get(id) as any
  res.json({
    success: true,
    data: {
      ...updated,
      keywords: JSON.parse(updated.keywords),
    },
  })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params

  const itemStmt = db.prepare('SELECT * FROM knowledge_items WHERE id = ?')
  const existing = itemStmt.get(id)

  if (!existing) {
    res.status(404).json({ success: false, error: '知识条目不存在' })
    return
  }

  const stmt = db.prepare('DELETE FROM knowledge_items WHERE id = ?')
  stmt.run(id)

  res.json({
    success: true,
    message: '知识条目已删除',
  })
})

export default router
