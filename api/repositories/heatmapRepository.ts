import getDatabase from '../config/database.js'
import { toCamelCase } from './utils.js'

interface ProvinceHeatmap {
  id: number
  province: string
  universityId?: number
  searchCount: number
  applicationCount: number
  date: string
  createdAt: string
}

const heatmapRepository = {
  findById(id: number): ProvinceHeatmap | null {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM province_heatmap WHERE id = ?')
    const row = stmt.get(id)
    return row ? toCamelCase<ProvinceHeatmap>(row) : null
  },

  findByDate(date: string): ProvinceHeatmap[] {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM province_heatmap WHERE date = ? ORDER BY search_count DESC')
    const rows = stmt.all(date)
    return toCamelCase<ProvinceHeatmap[]>(rows)
  },

  findByProvince(province: string): ProvinceHeatmap[] {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM province_heatmap WHERE province = ? ORDER BY date DESC')
    const rows = stmt.all(province)
    return toCamelCase<ProvinceHeatmap[]>(rows)
  },

  findByUniversityId(universityId: number): ProvinceHeatmap[] {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM province_heatmap WHERE university_id = ? ORDER BY date DESC')
    const rows = stmt.all(universityId)
    return toCamelCase<ProvinceHeatmap[]>(rows)
  },

  getAggregatedByDate(date: string): Array<{ province: string; totalSearchCount: number; totalApplicationCount: number }> {
    const db = getDatabase()
    const stmt = db.prepare(`
      SELECT 
        province,
        SUM(search_count) as total_search_count,
        SUM(application_count) as total_application_count
      FROM province_heatmap 
      WHERE date = ? 
      GROUP BY province 
      ORDER BY total_search_count DESC
    `)
    const rows = stmt.all(date)
    return toCamelCase<Array<{ province: string; totalSearchCount: number; totalApplicationCount: number }>>(rows)
  },

  getAggregatedByDateRange(startDate: string, endDate: string): Array<{ province: string; totalSearchCount: number; totalApplicationCount: number }> {
    const db = getDatabase()
    const stmt = db.prepare(`
      SELECT 
        province,
        SUM(search_count) as total_search_count,
        SUM(application_count) as total_application_count
      FROM province_heatmap 
      WHERE date >= ? AND date <= ?
      GROUP BY province 
      ORDER BY total_search_count DESC
    `)
    const rows = stmt.all(startDate, endDate)
    return toCamelCase<Array<{ province: string; totalSearchCount: number; totalApplicationCount: number }>>(rows)
  },

  getUniversityHeatmap(universityId: number, date: string): ProvinceHeatmap[] {
    const db = getDatabase()
    const stmt = db.prepare(`
      SELECT * FROM province_heatmap 
      WHERE university_id = ? AND date = ? 
      ORDER BY search_count DESC
    `)
    const rows = stmt.all(universityId, date)
    return toCamelCase<ProvinceHeatmap[]>(rows)
  },

  getUniversityHeatmapByDateRange(universityId: number, startDate: string, endDate: string): Array<{ province: string; totalSearchCount: number; totalApplicationCount: number }> {
    const db = getDatabase()
    const stmt = db.prepare(`
      SELECT 
        province,
        SUM(search_count) as total_search_count,
        SUM(application_count) as total_application_count
      FROM province_heatmap 
      WHERE university_id = ? AND date >= ? AND date <= ?
      GROUP BY province 
      ORDER BY total_search_count DESC
    `)
    const rows = stmt.all(universityId, startDate, endDate)
    return toCamelCase<Array<{ province: string; totalSearchCount: number; totalApplicationCount: number }>>(rows)
  },

  findAll(page: number = 1, pageSize: number = 100): { items: ProvinceHeatmap[]; total: number } {
    const db = getDatabase()
    const countStmt = db.prepare('SELECT COUNT(*) as total FROM province_heatmap')
    const { total } = countStmt.get() as { total: number }

    const offset = (page - 1) * pageSize
    const dataStmt = db.prepare('SELECT * FROM province_heatmap ORDER BY date DESC, search_count DESC LIMIT ? OFFSET ?')
    const rows = dataStmt.all(pageSize, offset)

    return {
      items: toCamelCase<ProvinceHeatmap[]>(rows),
      total
    }
  },

  create(data: Omit<ProvinceHeatmap, 'id' | 'createdAt'>): number {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO province_heatmap (province, university_id, search_count, application_count, date)
      VALUES (@province, @universityId, @searchCount, @applicationCount, @date)
    `)
    const result = stmt.run(data)
    return Number(result.lastInsertRowid)
  },

  incrementSearchCount(province: string, universityId?: number, date?: string): boolean {
    const db = getDatabase()
    const targetDate = date || new Date().toISOString().split('T')[0]

    const existingStmt = db.prepare(`
      SELECT id FROM province_heatmap 
      WHERE province = ? AND COALESCE(university_id, 0) = COALESCE(?, 0) AND date = ?
    `)
    const existing = existingStmt.get(province, universityId || 0, targetDate) as { id: number } | undefined

    if (existing) {
      const updateStmt = db.prepare(`
        UPDATE province_heatmap 
        SET search_count = search_count + 1 
        WHERE id = ?
      `)
      const result = updateStmt.run(existing.id)
      return result.changes > 0
    } else {
      const insertStmt = db.prepare(`
        INSERT INTO province_heatmap (province, university_id, search_count, application_count, date)
        VALUES (?, ?, 1, 0, ?)
      `)
      insertStmt.run(province, universityId || null, targetDate)
      return true
    }
  },

  incrementApplicationCount(province: string, universityId?: number, date?: string): boolean {
    const db = getDatabase()
    const targetDate = date || new Date().toISOString().split('T')[0]

    const existingStmt = db.prepare(`
      SELECT id FROM province_heatmap 
      WHERE province = ? AND COALESCE(university_id, 0) = COALESCE(?, 0) AND date = ?
    `)
    const existing = existingStmt.get(province, universityId || 0, targetDate) as { id: number } | undefined

    if (existing) {
      const updateStmt = db.prepare(`
        UPDATE province_heatmap 
        SET application_count = application_count + 1 
        WHERE id = ?
      `)
      const result = updateStmt.run(existing.id)
      return result.changes > 0
    } else {
      const insertStmt = db.prepare(`
        INSERT INTO province_heatmap (province, university_id, search_count, application_count, date)
        VALUES (?, ?, 0, 1, ?)
      `)
      insertStmt.run(province, universityId || null, targetDate)
      return true
    }
  },

  update(id: number, data: Partial<Omit<ProvinceHeatmap, 'id' | 'createdAt'>>): boolean {
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

    const stmt = db.prepare(`UPDATE province_heatmap SET ${fields.join(', ')} WHERE id = @id`)
    const result = stmt.run(params)
    return result.changes > 0
  },

  delete(id: number): boolean {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM province_heatmap WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  },

  deleteByDate(date: string): boolean {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM province_heatmap WHERE date = ?')
    const result = stmt.run(date)
    return result.changes > 0
  }
}

export default heatmapRepository
