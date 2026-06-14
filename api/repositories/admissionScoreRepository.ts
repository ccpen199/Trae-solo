import getDatabase from '../config/database.js'
import { toCamelCase } from './utils.js'
import type { AdmissionScore, Major } from '../../shared/types/index.js'

const admissionScoreRepository = {
  findById(id: number): AdmissionScore | null {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM admission_scores WHERE id = ?')
    const row = stmt.get(id)
    return row ? toCamelCase<AdmissionScore>(row) : null
  },

  findAll(): AdmissionScore[] {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM admission_scores ORDER BY id')
    const rows = stmt.all()
    return toCamelCase<AdmissionScore[]>(rows)
  },

  getByUniversityAndProvince(universityId: number, province: string): AdmissionScore[] {
    const db = getDatabase()
    const stmt = db.prepare(`
      SELECT * FROM admission_scores 
      WHERE university_id = ? AND province = ? 
      ORDER BY year DESC, major_id
    `)
    const rows = stmt.all(universityId, province)
    return toCamelCase<AdmissionScore[]>(rows)
  },

  getByMajorAndProvince(majorId: number, province: string): AdmissionScore[] {
    const db = getDatabase()
    const stmt = db.prepare(`
      SELECT * FROM admission_scores 
      WHERE major_id = ? AND province = ? 
      ORDER BY year DESC, university_id
    `)
    const rows = stmt.all(majorId, province)
    return toCamelCase<AdmissionScore[]>(rows)
  },

  getByUniversityMajorAndProvince(universityId: number, majorId: number, province: string): AdmissionScore[] {
    const db = getDatabase()
    const stmt = db.prepare(`
      SELECT * FROM admission_scores 
      WHERE university_id = ? AND major_id = ? AND province = ? 
      ORDER BY year DESC
    `)
    const rows = stmt.all(universityId, majorId, province)
    return toCamelCase<AdmissionScore[]>(rows)
  },

  getTrend(
    universityId: number,
    majorId?: number,
    province?: string
  ): Array<{ year: number; major: Major; minScore: number; minRank?: number }> {
    const db = getDatabase()
    const conditions: string[] = ['s.university_id = ?']
    const params: unknown[] = [universityId]

    if (majorId) {
      conditions.push('s.major_id = ?')
      params.push(majorId)
    }
    if (province) {
      conditions.push('s.province = ?')
      params.push(province)
    }

    const whereClause = conditions.join(' AND ')

    const stmt = db.prepare(`
      SELECT s.year, s.min_score, s.min_rank,
             m.id as major_id, m.name as major_name, m.code as major_code, 
             m.category as major_category, m.subject_requirements as major_subject_requirements,
             m.employment_rate as major_employment_rate, m.avg_salary as major_avg_salary,
             m.courses as major_courses, m.description as major_description
      FROM admission_scores s
      INNER JOIN majors m ON s.major_id = m.id
      WHERE ${whereClause}
      ORDER BY s.year DESC, m.id
    `)

    const rows = stmt.all(...params) as Array<Record<string, unknown>>

    return rows.map((row) => ({
      year: row.year as number,
      minScore: row.min_score as number,
      minRank: row.min_rank as number | undefined,
      major: {
        id: row.major_id as number,
        name: row.major_name as string,
        code: row.major_code as string,
        category: row.major_category as string,
        subjectRequirements: JSON.parse(row.major_subject_requirements as string),
        employmentRate: row.major_employment_rate as number,
        avgSalary: row.major_avg_salary as number,
        courses: JSON.parse(row.major_courses as string),
        description: row.major_description as string,
        createdAt: ''
      }
    }))
  },

  search(
    universityId?: number,
    majorId?: number,
    province?: string,
    year?: number,
    page: number = 1,
    pageSize: number = 50
  ): { items: AdmissionScore[]; total: number } {
    const db = getDatabase()
    const conditions: string[] = []
    const params: unknown[] = []

    if (universityId) {
      conditions.push('university_id = ?')
      params.push(universityId)
    }
    if (majorId) {
      conditions.push('major_id = ?')
      params.push(majorId)
    }
    if (province) {
      conditions.push('province = ?')
      params.push(province)
    }
    if (year) {
      conditions.push('year = ?')
      params.push(year)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM admission_scores ${whereClause}`)
    const { total } = countStmt.get(...params) as { total: number }

    const offset = (page - 1) * pageSize
    const dataStmt = db.prepare(`SELECT * FROM admission_scores ${whereClause} ORDER BY year DESC, id LIMIT ? OFFSET ?`)
    const rows = dataStmt.all(...params, pageSize, offset)

    return {
      items: toCamelCase<AdmissionScore[]>(rows),
      total
    }
  },

  create(data: Omit<AdmissionScore, 'id' | 'createdAt'>): number {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO admission_scores (university_id, major_id, year, province, min_score, max_score, avg_score, min_rank, plan_count)
      VALUES (@universityId, @majorId, @year, @province, @minScore, @maxScore, @avgScore, @minRank, @planCount)
    `)
    const result = stmt.run(data)
    return Number(result.lastInsertRowid)
  },

  update(id: number, data: Partial<Omit<AdmissionScore, 'id' | 'createdAt'>>): boolean {
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

    const stmt = db.prepare(`UPDATE admission_scores SET ${fields.join(', ')} WHERE id = @id`)
    const result = stmt.run(params)
    return result.changes > 0
  },

  delete(id: number): boolean {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM admission_scores WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  }
}

export default admissionScoreRepository
