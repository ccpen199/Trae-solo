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
    where = 'WHERE status = ?'
    params.push(status)
  }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM quizzes ${where}`).get(...params) as { total: number }
  const list = db.prepare(`
    SELECT id, title, description, cover_image, status, time_limit, start_time, end_time, participant_count, created_at
    FROM quizzes ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSizeNum, offset)

  res.json({
    success: true,
    data: {
      list,
      total: countRow.total,
      page: pageNum,
      pageSize: pageSizeNum
    }
  })
})

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id) as any
  if (!quiz) {
    res.status(404).json({ success: false, error: '答题不存在' })
    return
  }
  const questions = db.prepare('SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY sort_order').all(id) as any[]
  const safeQuestions = questions.map(q => ({
    id: q.id,
    question_text: q.question_text,
    options: JSON.parse(q.options),
    sort_order: q.sort_order
  }))
  res.json({ success: true, data: { ...quiz, questions: safeQuestions } })
})

router.post('/', adminMiddleware, (req: Request, res: Response): void => {
  const { title, description, cover_image, time_limit, start_time, end_time, questions } = req.body

  const insertQuiz = db.prepare(`
    INSERT INTO quizzes (title, description, cover_image, time_limit, start_time, end_time)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const insertQuestion = db.prepare(`
    INSERT INTO quiz_questions (quiz_id, question_text, options, correct_answer, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `)

  const transaction = db.transaction(() => {
    const result = insertQuiz.run(title, description || null, cover_image || null, time_limit || 30, start_time || null, end_time || null)
    const quizId = result.lastInsertRowid
    if (Array.isArray(questions)) {
      questions.forEach((q: any, index: number) => {
        insertQuestion.run(quizId, q.question_text, JSON.stringify(q.options), q.correct_answer, index + 1)
      })
    }
    return quizId
  })

  const quizId = transaction()
  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(quizId)
  const dbQuestions = db.prepare('SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY sort_order').all(quizId) as any[]
  const safeQuestions = dbQuestions.map(q => ({
    id: q.id,
    question_text: q.question_text,
    options: JSON.parse(q.options),
    correct_answer: q.correct_answer,
    sort_order: q.sort_order
  }))
  res.json({ success: true, data: { ...quiz, questions: safeQuestions } })
})

router.post('/:id/play', authMiddleware, (req: Request, res: Response): void => {
  const { id } = req.params
  const { answers, time_spent } = req.body
  const userId = (req as any).user.userId

  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id) as any
  if (!quiz) {
    res.status(404).json({ success: false, error: '答题不存在' })
    return
  }

  const questions = db.prepare('SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY sort_order').all(id) as any[]
  const total = questions.length
  const pointsPerQuestion = total > 0 ? Math.floor(100 / total) : 20
  let score = 0
  const correctAnswers: number[] = []

  for (let i = 0; i < questions.length; i++) {
    correctAnswers.push(questions[i].correct_answer)
    if (answers[i] === questions[i].correct_answer) {
      score += pointsPerQuestion
    }
  }

  db.prepare(`
    INSERT INTO quiz_records (quiz_id, user_id, score, total, answers, time_spent)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(Number(id), userId, score, total, JSON.stringify(answers), time_spent || 0)

  db.prepare('UPDATE quizzes SET participant_count = participant_count + 1 WHERE id = ?').run(id)

  res.json({
    success: true,
    data: {
      score,
      total,
      correctAnswers
    }
  })
})

router.get('/:id/records', authMiddleware, (req: Request, res: Response): void => {
  const { id } = req.params
  const userId = (req as any).user.userId

  const records = db.prepare(
    'SELECT * FROM quiz_records WHERE quiz_id = ? AND user_id = ? ORDER BY created_at DESC'
  ).all(id, userId) as any[]

  const parsedRecords = records.map(r => ({
    ...r,
    answers: JSON.parse(r.answers)
  }))

  res.json({ success: true, data: parsedRecords })
})

router.put('/:id', adminMiddleware, (req: Request, res: Response): void => {
  const { id } = req.params
  const { title, description, cover_image, time_limit, start_time, end_time, status } = req.body

  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id) as any
  if (!quiz) {
    res.status(404).json({ success: false, error: '答题不存在' })
    return
  }

  db.prepare(`
    UPDATE quizzes SET title = ?, description = ?, cover_image = ?, time_limit = ?, start_time = ?, end_time = ?, status = ?
    WHERE id = ?
  `).run(
    title ?? quiz.title,
    description ?? quiz.description,
    cover_image ?? quiz.cover_image,
    time_limit ?? quiz.time_limit,
    start_time ?? quiz.start_time,
    end_time ?? quiz.end_time,
    status ?? quiz.status,
    id
  )

  const updated = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id)
  res.json({ success: true, data: updated })
})

router.delete('/:id', adminMiddleware, (req: Request, res: Response): void => {
  const { id } = req.params
  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id) as any
  if (!quiz) {
    res.status(404).json({ success: false, error: '答题不存在' })
    return
  }

  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM quiz_records WHERE quiz_id = ?').run(id)
    db.prepare('DELETE FROM quiz_questions WHERE quiz_id = ?').run(id)
    db.prepare('DELETE FROM quizzes WHERE id = ?').run(id)
  })
  transaction()

  res.json({ success: true, data: { message: '删除成功' } })
})

export default router
