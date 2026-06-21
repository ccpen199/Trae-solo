import { nanoid } from 'nanoid'
import db from '../db/index.js'

export interface Expert {
  id: string
  user_id: string
  name: string
  title?: string
  category: string
  years_of_experience: number
  bio?: string
  avatar?: string
  rating: number
  appraisal_count: number
  price_per_appraisal: number
  status: string
  created_at: string
}

export interface ExpertWithUser extends Expert {
  username: string
  email: string
  phone: string
}

export function getApprovedExperts(page = 1, pageSize = 10, category?: string): { list: Expert[]; total: number } {
  const offset = (page - 1) * pageSize
  let where = "WHERE status = 'approved'"
  const params: any[] = []
  if (category) {
    where += ' AND category = ?'
    params.push(category)
  }
  const total = (db.prepare(`SELECT COUNT(*) as count FROM experts ${where}`).get(...params) as { count: number }).count
  const list = db.prepare(`SELECT * FROM experts ${where} ORDER BY rating DESC LIMIT ? OFFSET ?`).get(...params, pageSize, offset) as Expert[]
  return { list, total }
}

export function getExpertById(id: string): ExpertWithUser | undefined {
  return db.prepare(`
    SELECT e.*, u.username, u.email, u.phone
    FROM experts e
    LEFT JOIN users u ON e.user_id = u.id
    WHERE e.id = ?
  `).get(id) as ExpertWithUser | undefined
}

export function getExpertByUserId(userId: string): Expert | undefined {
  return db.prepare('SELECT * FROM experts WHERE user_id = ?').get(userId) as Expert | undefined
}

export function applyExpert(userId: string, data: {
  name: string
  title?: string
  category: string
  years_of_experience: number
  bio?: string
  avatar?: string
  price_per_appraisal: number
}): Expert | undefined {
  const existing = db.prepare('SELECT id FROM experts WHERE user_id = ?').get(userId)
  if (existing) return undefined
  const id = nanoid()
  db.prepare(`
    INSERT INTO experts (id, user_id, name, title, category, years_of_experience, bio, avatar, price_per_appraisal, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(id, userId, data.name, data.title || '', data.category, data.years_of_experience, data.bio || '', data.avatar || '', data.price_per_appraisal)
  return db.prepare('SELECT * FROM experts WHERE id = ?').get(id) as Expert
}

export function updateExpert(userId: string, data: Partial<Omit<Expert, 'id' | 'user_id' | 'created_at'>>): boolean {
  const fields: string[] = []
  const values: any[] = []
  const allowed = ['name', 'title', 'category', 'years_of_experience', 'bio', 'avatar', 'price_per_appraisal'] as const
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`)
      values.push(data[key])
    }
  }
  if (fields.length === 0) return false
  values.push(userId)
  const info = db.prepare(`UPDATE experts SET ${fields.join(', ')} WHERE user_id = ?`).run(...values)
  return info.changes > 0
}

export function approveExpert(expertId: string): boolean {
  const info = db.prepare("UPDATE experts SET status = 'approved' WHERE id = ?").run(expertId)
  return info.changes > 0
}

export function rejectExpert(expertId: string): boolean {
  const info = db.prepare("UPDATE experts SET status = 'rejected' WHERE id = ?").run(expertId)
  return info.changes > 0
}

export function getPendingExperts(page = 1, pageSize = 10): { list: ExpertWithUser[]; total: number } {
  const offset = (page - 1) * pageSize
  const total = (db.prepare("SELECT COUNT(*) as count FROM experts WHERE status = 'pending'").get() as { count: number }).count
  const list = db.prepare(`
    SELECT e.*, u.username, u.email, u.phone
    FROM experts e
    LEFT JOIN users u ON e.user_id = u.id
    WHERE e.status = 'pending'
    ORDER BY e.created_at DESC LIMIT ? OFFSET ?
  `).get(pageSize, offset) as ExpertWithUser[]
  return { list, total }
}

export function getExpertCategories(): string[] {
  const rows = db.prepare('SELECT DISTINCT category FROM experts WHERE status = ?').get('approved') as { category: string }[] | undefined
  if (!Array.isArray(rows)) return []
  return rows.map(r => r.category)
}
