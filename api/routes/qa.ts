import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { category, sort } = req.query
  let sql = `SELECT q.*, u.name as user_name FROM qa_questions q JOIN users u ON q.user_id = u.id WHERE 1=1`
  const params: any[] = []

  if (category) {
    sql += ' AND q.category = ?'
    params.push(category)
  }
  sql += ' ORDER BY q.heat_score DESC'

  const questions = db.prepare(sql).all(...params)
  res.json({ success: true, data: questions })
})

router.post('/', (req: Request, res: Response): void => {
  const userId = req.headers['x-user-id']
  if (!userId) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const { title, content, category } = req.body
  if (!title || !content) {
    res.status(400).json({ success: false, error: '标题和内容为必填项' })
    return
  }

  const result = db.prepare(
    'INSERT INTO qa_questions (user_id, title, content, category) VALUES (?, ?, ?, ?)'
  ).run(Number(userId), title, content, category || null)

  const question = db.prepare('SELECT * FROM qa_questions WHERE id = ?').get(result.lastInsertRowid)
  res.json({ success: true, data: question })
})

router.get('/:id', (req: Request, res: Response): void => {
  const question = db.prepare(
    `SELECT q.*, u.name as user_name FROM qa_questions q JOIN users u ON q.user_id = u.id WHERE q.id = ?`
  ).get(Number(req.params.id)) as any

  if (!question) {
    res.status(404).json({ success: false, error: '问题不存在' })
    return
  }

  db.prepare('UPDATE qa_questions SET view_count = view_count + 1 WHERE id = ?').run(Number(req.params.id))

  const answers = db.prepare(
    `SELECT a.*, u.name as user_name, u.role as user_role FROM qa_answers a JOIN users u ON a.user_id = u.id WHERE a.question_id = ? ORDER BY a.is_certified DESC, a.like_count DESC`
  ).all(Number(req.params.id))

  res.json({ success: true, data: { ...question, view_count: question.view_count + 1, answers } })
})

router.post('/:id/answer', (req: Request, res: Response): void => {
  const userId = req.headers['x-user-id']
  if (!userId) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const { content } = req.body
  if (!content) {
    res.status(400).json({ success: false, error: '回答内容为必填项' })
    return
  }

  const question = db.prepare('SELECT * FROM qa_questions WHERE id = ?').get(Number(req.params.id))
  if (!question) {
    res.status(404).json({ success: false, error: '问题不存在' })
    return
  }

  const result = db.prepare(
    'INSERT INTO qa_answers (question_id, user_id, content) VALUES (?, ?, ?)'
  ).run(Number(req.params.id), Number(userId), content)

  db.prepare('UPDATE qa_questions SET heat_score = heat_score + 5 WHERE id = ?').run(Number(req.params.id))

  const answer = db.prepare('SELECT * FROM qa_answers WHERE id = ?').get(result.lastInsertRowid)
  res.json({ success: true, data: answer })
})

router.put('/:id/certify', (req: Request, res: Response): void => {
  const userId = req.headers['x-user-id']
  if (!userId) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(userId)) as any
  if (!user || user.role !== 'vet') {
    res.status(403).json({ success: false, error: '仅兽医可认证回答' })
    return
  }

  const { answer_id } = req.body
  if (!answer_id) {
    res.status(400).json({ success: false, error: '回答ID为必填项' })
    return
  }

  const answer = db.prepare('SELECT * FROM qa_answers WHERE id = ? AND question_id = ?').get(Number(answer_id), Number(req.params.id))
  if (!answer) {
    res.status(404).json({ success: false, error: '回答不存在' })
    return
  }

  db.prepare('UPDATE qa_answers SET is_certified = 1 WHERE id = ?').run(Number(answer_id))

  const certNumber = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  db.prepare(
    'INSERT INTO vet_certifications (answer_id, vet_id, certificate_number) VALUES (?, ?, ?)'
  ).run(Number(answer_id), Number(userId), certNumber)

  db.prepare('UPDATE qa_questions SET heat_score = heat_score + 20 WHERE id = ?').run(Number(req.params.id))

  res.json({ success: true, data: { certified: true, certificate_number: certNumber } })
})

router.get('/knowledge-graph/data', (req: Request, res: Response): void => {
  const graphData = {
    categories: [
      { id: 'health', name: '健康', children: ['vaccine', 'deworming', 'surgery', 'checkup'] },
      { id: 'care', name: '护理', children: ['grooming', 'feeding', 'training', 'exercise'] },
      { id: 'behavior', name: '行为', children: ['socialization', 'anxiety', 'aggression'] },
      { id: 'nutrition', name: '营养', children: ['diet', 'supplements', 'allergies'] }
    ],
    relations: [
      { from: 'vaccine', to: 'health', label: '属于' },
      { from: 'deworming', to: 'health', label: '属于' },
      { from: 'grooming', to: 'care', label: '属于' },
      { from: 'feeding', to: 'nutrition', label: '关联' },
      { from: 'vaccine', to: 'deworming', label: '常同时进行' },
      { from: 'diet', to: 'allergies', label: '可能引发' },
      { from: 'exercise', to: 'health', label: '促进' },
      { from: 'training', to: 'behavior', label: '改善' }
    ]
  }
  res.json({ success: true, data: graphData })
})

export default router
