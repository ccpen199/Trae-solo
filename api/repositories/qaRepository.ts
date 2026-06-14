import getDatabase from '../config/database.js'
import { toCamelCase } from './utils.js'
import type { QAQuestion, QAAnswer } from '../../shared/types/index.js'

interface QuestionWithAnswers extends QAQuestion {
  answers: QAAnswer[]
}

const qaRepository = {
  findQuestionById(id: number): QAQuestion | null {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM qa_questions WHERE id = ?')
    const row = stmt.get(id)
    return row ? toCamelCase<QAQuestion>(row) : null
  },

  findQuestionByIdWithAnswers(id: number): QuestionWithAnswers | null {
    const db = getDatabase()
    const questionStmt = db.prepare('SELECT * FROM qa_questions WHERE id = ?')
    const questionRow = questionStmt.get(id)
    if (!questionRow) return null

    const answersStmt = db.prepare('SELECT * FROM qa_answers WHERE question_id = ? ORDER BY created_at DESC')
    const answerRows = answersStmt.all(id)

    const question = toCamelCase<QAQuestion>(questionRow)
    const answers = toCamelCase<QAAnswer[]>(answerRows)

    return {
      ...question,
      answers
    }
  },

  findAllQuestions(page: number = 1, pageSize: number = 20): { items: QAQuestion[]; total: number } {
    const db = getDatabase()
    const countStmt = db.prepare('SELECT COUNT(*) as total FROM qa_questions')
    const { total } = countStmt.get() as { total: number }

    const offset = (page - 1) * pageSize
    const dataStmt = db.prepare('SELECT * FROM qa_questions ORDER BY created_at DESC LIMIT ? OFFSET ?')
    const rows = dataStmt.all(pageSize, offset)

    return {
      items: toCamelCase<QAQuestion[]>(rows),
      total
    }
  },

  findQuestionsByUserId(userId: number): QAQuestion[] {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM qa_questions WHERE user_id = ? ORDER BY created_at DESC')
    const rows = stmt.all(userId)
    return toCamelCase<QAQuestion[]>(rows)
  },

  findQuestionsByCategory(category: string, page: number = 1, pageSize: number = 20): { items: QAQuestion[]; total: number } {
    const db = getDatabase()
    const countStmt = db.prepare('SELECT COUNT(*) as total FROM qa_questions WHERE category = ?')
    const { total } = countStmt.get(category) as { total: number }

    const offset = (page - 1) * pageSize
    const dataStmt = db.prepare('SELECT * FROM qa_questions WHERE category = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
    const rows = dataStmt.all(category, pageSize, offset)

    return {
      items: toCamelCase<QAQuestion[]>(rows),
      total
    }
  },

  findQuestionsByStatus(status: string, page: number = 1, pageSize: number = 20): { items: QAQuestion[]; total: number } {
    const db = getDatabase()
    const countStmt = db.prepare('SELECT COUNT(*) as total FROM qa_questions WHERE status = ?')
    const { total } = countStmt.get(status) as { total: number }

    const offset = (page - 1) * pageSize
    const dataStmt = db.prepare('SELECT * FROM qa_questions WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
    const rows = dataStmt.all(status, pageSize, offset)

    return {
      items: toCamelCase<QAQuestion[]>(rows),
      total
    }
  },

  searchQuestions(keyword?: string, category?: string, status?: string, page: number = 1, pageSize: number = 20): { items: QAQuestion[]; total: number } {
    const db = getDatabase()
    const conditions: string[] = []
    const params: unknown[] = []

    if (keyword) {
      conditions.push('(title LIKE ? OR content LIKE ?)')
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    if (category) {
      conditions.push('category = ?')
      params.push(category)
    }
    if (status) {
      conditions.push('status = ?')
      params.push(status)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM qa_questions ${whereClause}`)
    const { total } = countStmt.get(...params) as { total: number }

    const offset = (page - 1) * pageSize
    const dataStmt = db.prepare(`SELECT * FROM qa_questions ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    const rows = dataStmt.all(...params, pageSize, offset)

    return {
      items: toCamelCase<QAQuestion[]>(rows),
      total
    }
  },

  createQuestion(data: Omit<QAQuestion, 'id' | 'createdAt' | 'viewCount'>): number {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO qa_questions (user_id, title, content, category, status)
      VALUES (@userId, @title, @content, @category, @status)
    `)
    const result = stmt.run({
      userId: data.userId,
      title: data.title,
      content: data.content,
      category: data.category || null,
      status: data.status || 'pending'
    })
    return Number(result.lastInsertRowid)
  },

  updateQuestion(id: number, data: Partial<Omit<QAQuestion, 'id' | 'createdAt' | 'userId' | 'viewCount'>>): boolean {
    const db = getDatabase()
    const fields: string[] = []
    const params: Record<string, unknown> = { id }

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
        fields.push(`${snakeKey} = @${key}`)
        params[key] = value
      }
    }

    if (fields.length === 0) return false

    const stmt = db.prepare(`UPDATE qa_questions SET ${fields.join(', ')} WHERE id = @id`)
    const result = stmt.run(params)
    return result.changes > 0
  },

  incrementViewCount(id: number): boolean {
    const db = getDatabase()
    const stmt = db.prepare('UPDATE qa_questions SET view_count = view_count + 1 WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  },

  deleteQuestion(id: number): boolean {
    const db = getDatabase()
    const deleteAnswers = db.prepare('DELETE FROM qa_answers WHERE question_id = ?')
    const deleteQuestion = db.prepare('DELETE FROM qa_questions WHERE id = ?')

    const deleteTransaction = db.transaction((questionId: number) => {
      deleteAnswers.run(questionId)
      deleteQuestion.run(questionId)
    })

    deleteTransaction(id)
    return true
  },

  findAnswerById(id: number): QAAnswer | null {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM qa_answers WHERE id = ?')
    const row = stmt.get(id)
    return row ? toCamelCase<QAAnswer>(row) : null
  },

  findAnswersByQuestionId(questionId: number): QAAnswer[] {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM qa_answers WHERE question_id = ? ORDER BY created_at DESC')
    const rows = stmt.all(questionId)
    return toCamelCase<QAAnswer[]>(rows)
  },

  findAnswersByUserId(userId: number): QAAnswer[] {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM qa_answers WHERE user_id = ? ORDER BY created_at DESC')
    const rows = stmt.all(userId)
    return toCamelCase<QAAnswer[]>(rows)
  },

  createAnswer(data: Omit<QAAnswer, 'id' | 'createdAt' | 'likeCount'>): number {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO qa_answers (question_id, user_id, content, is_expert)
      VALUES (@questionId, @userId, @content, @isExpert)
    `)
    const result = stmt.run(data)
    return Number(result.lastInsertRowid)
  },

  updateAnswer(id: number, data: Partial<Omit<QAAnswer, 'id' | 'createdAt' | 'questionId' | 'userId' | 'likeCount'>>): boolean {
    const db = getDatabase()
    const fields: string[] = []
    const params: Record<string, unknown> = { id }

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
        fields.push(`${snakeKey} = @${key}`)
        params[key] = value
      }
    }

    if (fields.length === 0) return false

    const stmt = db.prepare(`UPDATE qa_answers SET ${fields.join(', ')} WHERE id = @id`)
    const result = stmt.run(params)
    return result.changes > 0
  },

  incrementLikeCount(id: number): boolean {
    const db = getDatabase()
    const stmt = db.prepare('UPDATE qa_answers SET like_count = like_count + 1 WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  },

  deleteAnswer(id: number): boolean {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM qa_answers WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  }
}

export default qaRepository
