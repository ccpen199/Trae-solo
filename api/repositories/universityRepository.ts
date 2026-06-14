import getDatabase from '../config/database.js'
import { toCamelCase } from './utils.js'
import type { University } from '../../shared/types/index.js'

const universityRepository = {
  findById(id: number): University | null {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM universities WHERE id = ?')
    const row = stmt.get(id)
    return row ? toCamelCase<University>(row) : null
  },

  findAll(): University[] {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM universities ORDER BY id')
    const rows = stmt.all()
    return toCamelCase<University[]>(rows)
  },

  search(
    keyword?: string,
    level?: string,
    province?: string,
    type?: string,
    page: number = 1,
    pageSize: number = 20
  ): { items: University[]; total: number } {
    const db = getDatabase()
    const conditions: string[] = []
    const params: unknown[] = []

    if (keyword) {
      conditions.push('(name LIKE ? OR short_name LIKE ?)')
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    if (level) {
      conditions.push('level = ?')
      params.push(level)
    }
    if (province) {
      conditions.push('province = ?')
      params.push(province)
    }
    if (type) {
      conditions.push('type = ?')
      params.push(type)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM universities ${whereClause}`)
    const { total } = countStmt.get(...params) as { total: number }

    const offset = (page - 1) * pageSize
    const dataStmt = db.prepare(`SELECT * FROM universities ${whereClause} ORDER BY id LIMIT ? OFFSET ?`)
    const rows = dataStmt.all(...params, pageSize, offset)

    return {
      items: toCamelCase<University[]>(rows),
      total
    }
  },

  create(data: Omit<University, 'id' | 'createdAt'>): number {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO universities (name, short_name, province, city, level, type, subjects, master_points, doctor_points, employment_rate, logo_url, description)
      VALUES (@name, @shortName, @province, @city, @level, @type, @subjects, @masterPoints, @doctorPoints, @employmentRate, @logoUrl, @description)
    `)
    const result = stmt.run({
      ...data,
      subjects: JSON.stringify(data.subjects)
    })
    return Number(result.lastInsertRowid)
  },

  update(id: number, data: Partial<Omit<University, 'id' | 'createdAt'>>): boolean {
    const db = getDatabase()
    const fields: string[] = []
    const params: Record<string, unknown> = { id }

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
        fields.push(`${snakeKey} = @${key}`)
        if (key === 'subjects' && Array.isArray(value)) {
          params[key] = JSON.stringify(value)
        } else {
          params[key] = value
        }
      }
    }

    if (fields.length === 0) return false

    const stmt = db.prepare(`UPDATE universities SET ${fields.join(', ')} WHERE id = @id`)
    const result = stmt.run(params)
    return result.changes > 0
  },

  delete(id: number): boolean {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM universities WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  }
}

export default universityRepository
