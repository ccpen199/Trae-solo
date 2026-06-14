import getDatabase from '../config/database.js'
import { toCamelCase } from './utils.js'
import type { AssessmentResult } from '../../shared/types/index.js'

const assessmentRepository = {
  findById(id: number): AssessmentResult | null {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM assessment_results WHERE id = ?')
    const row = stmt.get(id)
    return row ? toCamelCase<AssessmentResult>(row) : null
  },

  findByUserId(userId: number): AssessmentResult | null {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM assessment_results WHERE user_id = ? ORDER BY id DESC LIMIT 1')
    const row = stmt.get(userId)
    return row ? toCamelCase<AssessmentResult>(row) : null
  },

  findAll(): AssessmentResult[] {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM assessment_results ORDER BY id')
    const rows = stmt.all()
    return toCamelCase<AssessmentResult[]>(rows)
  },

  create(data: Omit<AssessmentResult, 'id' | 'createdAt'>): number {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO assessment_results (user_id, holland_scores, mbti_type)
      VALUES (@userId, @holland, @mbti)
    `)
    const result = stmt.run({
      userId: data.userId,
      holland: JSON.stringify(data.holland),
      mbti: data.mbti
    })
    return Number(result.lastInsertRowid)
  },

  update(id: number, data: Partial<Omit<AssessmentResult, 'id' | 'createdAt' | 'userId'>>): boolean {
    const db = getDatabase()
    const fields: string[] = []
    const params: Record<string, unknown> = { id }

    if (data.holland !== undefined) {
      fields.push('holland_scores = @holland')
      params.holland = JSON.stringify(data.holland)
    }
    if (data.mbti !== undefined) {
      fields.push('mbti_type = @mbti')
      params.mbti = data.mbti
    }

    if (fields.length === 0) return false

    const stmt = db.prepare(`UPDATE assessment_results SET ${fields.join(', ')} WHERE id = @id`)
    const result = stmt.run(params)
    return result.changes > 0
  },

  updateByUserId(userId: number, data: Partial<Omit<AssessmentResult, 'id' | 'createdAt' | 'userId'>>): boolean {
    const db = getDatabase()
    const fields: string[] = []
    const params: Record<string, unknown> = { userId }

    if (data.holland !== undefined) {
      fields.push('holland_scores = @holland')
      params.holland = JSON.stringify(data.holland)
    }
    if (data.mbti !== undefined) {
      fields.push('mbti_type = @mbti')
      params.mbti = data.mbti
    }

    if (fields.length === 0) return false

    const stmt = db.prepare(`UPDATE assessment_results SET ${fields.join(', ')} WHERE user_id = @userId`)
    const result = stmt.run(params)
    return result.changes > 0
  },

  delete(id: number): boolean {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM assessment_results WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  },

  deleteByUserId(userId: number): boolean {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM assessment_results WHERE user_id = ?')
    const result = stmt.run(userId)
    return result.changes > 0
  }
}

export default assessmentRepository
