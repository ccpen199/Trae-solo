import getDatabase from '../config/database.js'
import { toCamelCase } from './utils.js'
import type { Major } from '../../shared/types/index.js'

const majorRepository = {
  findById(id: number): Major | null {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM majors WHERE id = ?')
    const row = stmt.get(id)
    return row ? toCamelCase<Major>(row) : null
  },

  findAll(): Major[] {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM majors ORDER BY id')
    const rows = stmt.all()
    return toCamelCase<Major[]>(rows)
  },

  findByUniversityId(universityId: number): Major[] {
    const db = getDatabase()
    const stmt = db.prepare(`
      SELECT DISTINCT m.* FROM majors m
      INNER JOIN admission_scores s ON m.id = s.major_id
      WHERE s.university_id = ?
      ORDER BY m.id
    `)
    const rows = stmt.all(universityId)
    return toCamelCase<Major[]>(rows)
  },

  findByCategory(category: string): Major[] {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM majors WHERE category = ? ORDER BY id')
    const rows = stmt.all(category)
    return toCamelCase<Major[]>(rows)
  },

  search(keyword?: string, category?: string, page: number = 1, pageSize: number = 20): { items: Major[]; total: number } {
    const db = getDatabase()
    const conditions: string[] = []
    const params: unknown[] = []

    if (keyword) {
      conditions.push('(name LIKE ? OR code LIKE ?)')
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    if (category) {
      conditions.push('category = ?')
      params.push(category)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM majors ${whereClause}`)
    const { total } = countStmt.get(...params) as { total: number }

    const offset = (page - 1) * pageSize
    const dataStmt = db.prepare(`SELECT * FROM majors ${whereClause} ORDER BY id LIMIT ? OFFSET ?`)
    const rows = dataStmt.all(...params, pageSize, offset)

    return {
      items: toCamelCase<Major[]>(rows),
      total
    }
  },

  create(data: Omit<Major, 'id' | 'createdAt'>): number {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO majors (name, code, category, subject_requirements, employment_rate, avg_salary, courses, description)
      VALUES (@name, @code, @category, @subjectRequirements, @employmentRate, @avgSalary, @courses, @description)
    `)
    const result = stmt.run({
      ...data,
      subjectRequirements: JSON.stringify(data.subjectRequirements),
      courses: JSON.stringify(data.courses)
    })
    return Number(result.lastInsertRowid)
  },

  update(id: number, data: Partial<Omit<Major, 'id' | 'createdAt'>>): boolean {
    const db = getDatabase()
    const fields: string[] = []
    const params: Record<string, unknown> = { id }

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
        fields.push(`${snakeKey} = @${key}`)
        if ((key === 'subjectRequirements' || key === 'courses') && Array.isArray(value)) {
          params[key] = JSON.stringify(value)
        } else {
          params[key] = value
        }
      }
    }

    if (fields.length === 0) return false

    const stmt = db.prepare(`UPDATE majors SET ${fields.join(', ')} WHERE id = @id`)
    const result = stmt.run(params)
    return result.changes > 0
  },

  delete(id: number): boolean {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM majors WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  }
}

export default majorRepository
