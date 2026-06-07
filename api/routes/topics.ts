import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { status, page = '1', pageSize = '10' } = req.query
  const pageNum = Number(page)
  const pageSizeNum = Number(pageSize)
  const offset = (pageNum - 1) * pageSizeNum

  let where = ''
  const params: any[] = []
  if (status) {
    where = 'WHERE t.status = ?'
    params.push(status)
  }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM topics t ${where}`).get(...params) as { total: number }
  const topics = db.prepare(`
    SELECT t.*, o.id as option_id, o.content as option_content, o.vote_count as option_vote_count, o.sort_order as option_sort_order
    FROM topics t
    LEFT JOIN topic_options o ON o.topic_id = t.id
    ${where}
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSizeNum, offset) as any[]

  const topicMap = new Map<number, any>()
  for (const row of topics) {
    if (!topicMap.has(row.id)) {
      topicMap.set(row.id, {
        ...Object.fromEntries(
          Object.entries(row).filter(([k]) => !k.startsWith('option_'))
        ),
        options: []
      })
    }
    if (row.option_id) {
      topicMap.get(row.id).options.push({
        id: row.option_id,
        content: row.option_content,
        vote_count: row.option_vote_count,
        sort_order: row.option_sort_order
      })
    }
  }

  res.json({
    success: true,
    data: {
      list: Array.from(topicMap.values()),
      total: countRow.total,
      page: pageNum,
      pageSize: pageSizeNum
    }
  })
})

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(id) as any
  if (!topic) {
    res.status(404).json({ success: false, error: '话题不存在' })
    return
  }
  const options = db.prepare('SELECT * FROM topic_options WHERE topic_id = ? ORDER BY sort_order').all(id)
  res.json({ success: true, data: { ...topic, options } })
})

router.post('/', adminMiddleware, (req: Request, res: Response): void => {
  const { title, description, cover_image, max_select, start_time, end_time, options } = req.body

  const insertTopic = db.prepare(`
    INSERT INTO topics (title, description, cover_image, max_select, start_time, end_time)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const insertOption = db.prepare(`
    INSERT INTO topic_options (topic_id, content, sort_order) VALUES (?, ?, ?)
  `)

  const transaction = db.transaction(() => {
    const result = insertTopic.run(title, description || null, cover_image || null, max_select || 1, start_time || null, end_time || null)
    const topicId = result.lastInsertRowid
    if (Array.isArray(options)) {
      options.forEach((content: string, index: number) => {
        insertOption.run(topicId, content, index + 1)
      })
    }
    return topicId
  })

  const topicId = transaction()
  const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(topicId) as any
  const topicOptions = db.prepare('SELECT * FROM topic_options WHERE topic_id = ? ORDER BY sort_order').all(topicId)
  res.json({ success: true, data: { ...topic, options: topicOptions } })
})

router.post('/:id/vote', authMiddleware, (req: Request, res: Response): void => {
  const { id } = req.params
  const { option_ids } = req.body
  const userId = (req as any).user.userId

  const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(id) as any
  if (!topic) {
    res.status(404).json({ success: false, error: '话题不存在' })
    return
  }

  if (!Array.isArray(option_ids) || option_ids.length === 0) {
    res.status(400).json({ success: false, error: '请选择投票选项' })
    return
  }

  if (option_ids.length > topic.max_select) {
    res.status(400).json({ success: false, error: `最多可选择${topic.max_select}个选项` })
    return
  }

  const insertVote = db.prepare(`
    INSERT INTO topic_votes (topic_id, option_id, user_id) VALUES (?, ?, ?)
  `)
  const incrementOption = db.prepare(`
    UPDATE topic_options SET vote_count = vote_count + 1 WHERE id = ?
  `)
  const incrementTopic = db.prepare(`
    UPDATE topics SET participant_count = participant_count + 1 WHERE id = ?
  `)

  const transaction = db.transaction(() => {
    for (const optionId of option_ids) {
      insertVote.run(Number(id), optionId, userId)
      incrementOption.run(optionId)
    }
    incrementTopic.run(Number(id))
  })

  try {
    transaction()
    res.json({ success: true, data: { message: '投票成功' } })
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      res.status(400).json({ success: false, error: '您已经投过票了' })
      return
    }
    throw err
  }
})

router.put('/:id', adminMiddleware, (req: Request, res: Response): void => {
  const { id } = req.params
  const { title, description, cover_image, max_select, start_time, end_time, status } = req.body

  const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(id) as any
  if (!topic) {
    res.status(404).json({ success: false, error: '话题不存在' })
    return
  }

  db.prepare(`
    UPDATE topics SET title = ?, description = ?, cover_image = ?, max_select = ?, start_time = ?, end_time = ?, status = ?
    WHERE id = ?
  `).run(
    title ?? topic.title,
    description ?? topic.description,
    cover_image ?? topic.cover_image,
    max_select ?? topic.max_select,
    start_time ?? topic.start_time,
    end_time ?? topic.end_time,
    status ?? topic.status,
    id
  )

  const updated = db.prepare('SELECT * FROM topics WHERE id = ?').get(id) as any
  const options = db.prepare('SELECT * FROM topic_options WHERE topic_id = ? ORDER BY sort_order').all(id)
  res.json({ success: true, data: { ...updated, options } })
})

router.delete('/:id', adminMiddleware, (req: Request, res: Response): void => {
  const { id } = req.params
  const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(id) as any
  if (!topic) {
    res.status(404).json({ success: false, error: '话题不存在' })
    return
  }

  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM topic_votes WHERE topic_id = ?').run(id)
    db.prepare('DELETE FROM topic_options WHERE topic_id = ?').run(id)
    db.prepare('DELETE FROM topics WHERE id = ?').run(id)
  })
  transaction()

  res.json({ success: true, data: { message: '删除成功' } })
})

export default router
