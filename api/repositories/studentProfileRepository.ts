import getDatabase from '../config/database.js'
import { toCamelCase } from './utils.js'
import type { StudentProfile } from '../../shared/types/index.js'

const studentProfileRepository = {
  findById(id: number): StudentProfile | null {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM student_profiles WHERE id = ?')
    const row = stmt.get(id)
    return row ? toCamelCase<StudentProfile>(row) : null
  },

  findByUserId(userId: number): StudentProfile | null {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM student_profiles WHERE user_id = ? ORDER BY id DESC LIMIT 1')
    const row = stmt.get(userId)
    return row ? toCamelCase<StudentProfile>(row) : null
  },

  findAll(): StudentProfile[] {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM student_profiles ORDER BY id')
    const rows = stmt.all()
    return toCamelCase<StudentProfile[]>(rows)
  },

  create(data: Omit<StudentProfile, 'id' | 'createdAt'>): number {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO student_profiles (user_id, score, rank, province, subjects, batch, target_cities)
      VALUES (@userId, @score, @rank, @province, @subjects, @batch, @targetCities)
    `)
    const result = stmt.run({
      ...data,
      subjects: JSON.stringify(data.subjects),
      targetCities: JSON.stringify(data.targetCities)
    })
    return Number(result.lastInsertRowid)
  },

  update(id: number, data: Partial<Omit<StudentProfile, 'id' | 'createdAt' | 'userId'>>): boolean {
    const db = getDatabase()
    const fields: string[] = []
    const params: Record<string, unknown> = { id }

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
        fields.push(`${snakeKey} = @${key}`)
        if ((key === 'subjects' || key === 'targetCities') && Array.isArray(value)) {
          params[key] = JSON.stringify(value)
        } else {
          params[key] = value
        }
      }
    }

    if (fields.length === 0) return false

    const stmt = db.prepare(`UPDATE student_profiles SET ${fields.join(', ')} WHERE id = @id`)
    const result = stmt.run(params)
    return result.changes > 0
  },

  updateByUserId(userId: number, data: Partial<Omit<StudentProfile, 'id' | 'createdAt' | 'userId'>>): boolean {
    const db = getDatabase()
    const fields: string[] = []
    const params: Record<string, unknown> = { userId }

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
        fields.push(`${snakeKey} = @${key}`)
        if ((key === 'subjects' || key === 'targetCities') && Array.isArray(value)) {
          params[key] = JSON.stringify(value)
        } else {
          params[key] = value
        }
      }
    }

    if (fields.length === 0) return false

    const stmt = db.prepare(`UPDATE student_profiles SET ${fields.join(', ')} WHERE user_id = @userId`)
    const result = stmt.run(params)
    return result.changes > 0
  },

  delete(id: number): boolean {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM student_profiles WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  },

  deleteByUserId(userId: number): boolean {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM student_profiles WHERE user_id = ?')
    const result = stmt.run(userId)
    return result.changes > 0
  }
}

export default studentProfileRepository
