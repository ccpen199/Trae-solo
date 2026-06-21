import { nanoid } from 'nanoid'
import db from '../db/index.js'

export interface CommunityQuestion {
  id: string
  user_id: string
  title: string
  content: string
  category?: string
  images?: string
  views: number
  likes: number
  answer_count: number
  is_answered: number
  created_at: string
  updated_at: string
}

export interface QuestionDetail extends CommunityQuestion {
  username: string
  avatar?: string
}

export interface CommunityAnswer {
  id: string
  question_id: string
  user_id: string
  content: string
  likes: number
  is_best: number
  created_at: string
}

export interface AnswerDetail extends CommunityAnswer {
  username: string
  avatar?: string
}

export function createQuestion(userId: string, data: {
  title: string
  content: string
  category?: string
  images?: string
}): CommunityQuestion {
  const id = nanoid()
  db.prepare(`
    INSERT INTO community_questions (id, user_id, title, content, category, images)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, userId, data.title, data.content, data.category || '', data.images || JSON.stringify([]))
  return db.prepare('SELECT * FROM community_questions WHERE id = ?').get(id) as CommunityQuestion
}

export function getQuestionById(id: string): QuestionDetail | undefined {
  db.prepare('UPDATE community_questions SET views = views + 1 WHERE id = ?').run(id)
  return db.prepare(`
    SELECT q.*, u.username, u.avatar
    FROM community_questions q
    LEFT JOIN users u ON q.user_id = u.id
    WHERE q.id = ?
  `).get(id) as QuestionDetail | undefined
}

export function getQuestions(page = 1, pageSize = 10, category?: string, keyword?: string, sort = 'latest'): {
  list: QuestionDetail[]
  total: number
} {
  const offset = (page - 1) * pageSize
  let where = 'WHERE 1=1'
  const params: any[] = []
  if (category) {
    where += ' AND q.category = ?'
    params.push(category)
  }
  if (keyword) {
    where += ' AND (q.title LIKE ? OR q.content LIKE ?)'
    const like = `%${keyword}%`
    params.push(like, like)
  }
  const total = (db.prepare(`SELECT COUNT(*) as count FROM community_questions q ${where}`).get(...params) as { count: number }).count
  let orderBy = 'q.created_at DESC'
  if (sort === 'hot') orderBy = '(q.views * 0.5 + q.likes * 5 + q.answer_count * 3) DESC'
  if (sort === 'unanswered') orderBy = 'q.is_answered ASC, q.created_at DESC'
  const list = db.prepare(`
    SELECT q.*, u.username, u.avatar
    FROM community_questions q
    LEFT JOIN users u ON q.user_id = u.id
    ${where}
    ORDER BY ${orderBy} LIMIT ? OFFSET ?
  `).get(...params, pageSize, offset) as QuestionDetail[]
  return { list, total }
}

export function getUserQuestions(userId: string, page = 1, pageSize = 10): {
  list: QuestionDetail[]
  total: number
} {
  const offset = (page - 1) * pageSize
  const total = (db.prepare('SELECT COUNT(*) as count FROM community_questions WHERE user_id = ?').get(userId) as { count: number }).count
  const list = db.prepare(`
    SELECT q.*, u.username, u.avatar
    FROM community_questions q
    LEFT JOIN users u ON q.user_id = u.id
    WHERE q.user_id = ?
    ORDER BY q.created_at DESC LIMIT ? OFFSET ?
  `).get(userId, pageSize, offset) as QuestionDetail[]
  return { list, total }
}

export function createAnswer(userId: string, questionId: string, content: string): AnswerDetail | undefined {
  const question = db.prepare('SELECT id FROM community_questions WHERE id = ?').get(questionId)
  if (!question) return undefined
  const id = nanoid()
  db.prepare(`
    INSERT INTO community_answers (id, question_id, user_id, content)
    VALUES (?, ?, ?, ?)
  `).run(id, questionId, userId, content)
  db.prepare("UPDATE community_questions SET answer_count = answer_count + 1, updated_at = datetime('now') WHERE id = ?").run(questionId)
  return db.prepare(`
    SELECT a.*, u.username, u.avatar
    FROM community_answers a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.id = ?
  `).get(id) as AnswerDetail
}

export function getQuestionAnswers(questionId: string, page = 1, pageSize = 20): {
  list: AnswerDetail[]
  total: number
} {
  const offset = (page - 1) * pageSize
  const total = (db.prepare('SELECT COUNT(*) as count FROM community_answers WHERE question_id = ?').get(questionId) as { count: number }).count
  const list = db.prepare(`
    SELECT a.*, u.username, u.avatar
    FROM community_answers a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.question_id = ?
    ORDER BY a.is_best DESC, a.likes DESC, a.created_at ASC
    LIMIT ? OFFSET ?
  `).get(questionId, pageSize, offset) as AnswerDetail[]
  return { list, total }
}

export function likeQuestion(questionId: string): boolean {
  const info = db.prepare('UPDATE community_questions SET likes = likes + 1 WHERE id = ?').run(questionId)
  return info.changes > 0
}

export function likeAnswer(answerId: string): boolean {
  const info = db.prepare('UPDATE community_answers SET likes = likes + 1 WHERE id = ?').run(answerId)
  return info.changes > 0
}

export function markBestAnswer(questionOwnerId: string, questionId: string, answerId: string): boolean {
  const question = db.prepare('SELECT user_id FROM community_questions WHERE id = ?').get(questionId) as { user_id: string } | undefined
  if (!question || question.user_id !== questionOwnerId) return false
  const answer = db.prepare('SELECT question_id FROM community_answers WHERE id = ?').get(answerId) as { question_id: string } | undefined
  if (!answer || answer.question_id !== questionId) return false
  db.prepare('UPDATE community_answers SET is_best = 0 WHERE question_id = ?').run(questionId)
  db.prepare('UPDATE community_answers SET is_best = 1 WHERE id = ?').run(answerId)
  db.prepare("UPDATE community_questions SET is_answered = 1, updated_at = datetime('now') WHERE id = ?").run(questionId)
  return true
}

export function deleteQuestion(questionId: string, userId: string): boolean {
  const question = db.prepare('SELECT user_id FROM community_questions WHERE id = ?').get(questionId) as { user_id: string } | undefined
  if (!question || question.user_id !== userId) return false
  db.prepare('DELETE FROM community_answers WHERE question_id = ?').run(questionId)
  const info = db.prepare('DELETE FROM community_questions WHERE id = ?').run(questionId)
  return info.changes > 0
}

export function deleteAnswer(answerId: string, userId: string): boolean {
  const answer = db.prepare('SELECT user_id, question_id FROM community_answers WHERE id = ?').get(answerId) as { user_id: string; question_id: string } | undefined
  if (!answer || answer.user_id !== userId) return false
  const info = db.prepare('DELETE FROM community_answers WHERE id = ?').run(answerId)
  if (info.changes > 0) {
    db.prepare("UPDATE community_questions SET answer_count = answer_count - 1, updated_at = datetime('now') WHERE id = ?").run(answer.question_id)
  }
  return info.changes > 0
}

export function getQuestionCategories(): { category: string; count: number }[] {
  return db.prepare(`
    SELECT COALESCE(NULLIF(category, ''), '其他') as category, COUNT(*) as count
    FROM community_questions GROUP BY category ORDER BY count DESC
  `).all() as { category: string; count: number }[]
}
