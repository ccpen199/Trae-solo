import { nanoid } from 'nanoid'
import db from '../db/index.js'

export interface Artwork {
  id: string
  owner_id: string
  title: string
  category: string
  description?: string
  images?: string
  dimensions?: string
  era?: string
  material?: string
  provenance?: string
  condition?: string
  estimated_value?: number
  status: string
  created_at: string
  updated_at: string
}

export function createArtwork(ownerId: string, data: Omit<Artwork, 'id' | 'owner_id' | 'created_at' | 'updated_at' | 'status'> & { status?: string }): Artwork {
  const id = nanoid()
  const status = data.status || 'draft'
  db.prepare(`
    INSERT INTO artworks (id, owner_id, title, category, description, images, dimensions, era, material, provenance, condition, estimated_value, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, ownerId, data.title, data.category, data.description || '', data.images || JSON.stringify([]), data.dimensions || '', data.era || '', data.material || '', data.provenance || '', data.condition || '', data.estimated_value || 0, status)
  return db.prepare('SELECT * FROM artworks WHERE id = ?').get(id) as Artwork
}

export function getArtworkById(id: string): (Artwork & { username: string }) | undefined {
  return db.prepare(`
    SELECT a.*, u.username
    FROM artworks a
    LEFT JOIN users u ON a.owner_id = u.id
    WHERE a.id = ?
  `).get(id) as (Artwork & { username: string }) | undefined
}

export function getUserArtworks(userId: string, page = 1, pageSize = 10): { list: Artwork[]; total: number } {
  const offset = (page - 1) * pageSize
  const total = (db.prepare('SELECT COUNT(*) as count FROM artworks WHERE owner_id = ?').get(userId) as { count: number }).count
  const list = db.prepare('SELECT * FROM artworks WHERE owner_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').get(userId, pageSize, offset) as Artwork[]
  return { list, total }
}

export function getPublishedArtworks(page = 1, pageSize = 10, category?: string, keyword?: string): { list: (Artwork & { username: string })[]; total: number } {
  const offset = (page - 1) * pageSize
  let where = "WHERE a.status = 'published'"
  const params: any[] = []
  if (category) {
    where += ' AND a.category = ?'
    params.push(category)
  }
  if (keyword) {
    where += ' AND (a.title LIKE ? OR a.description LIKE ?)'
    params.push(`%${keyword}%`, `%${keyword}%`)
  }
  const total = (db.prepare(`SELECT COUNT(*) as count FROM artworks a ${where}`).get(...params) as { count: number }).count
  const list = db.prepare(`
    SELECT a.*, u.username
    FROM artworks a
    LEFT JOIN users u ON a.owner_id = u.id
    ${where}
    ORDER BY a.created_at DESC LIMIT ? OFFSET ?
  `).get(...params, pageSize, offset) as (Artwork & { username: string })[]
  return { list, total }
}

export function updateArtwork(id: string, userId: string, data: Partial<Omit<Artwork, 'id' | 'owner_id' | 'created_at' | 'updated_at'>>): boolean {
  const artwork = db.prepare('SELECT owner_id FROM artworks WHERE id = ?').get(id) as { owner_id: string } | undefined
  if (!artwork || artwork.owner_id !== userId) return false
  const fields: string[] = []
  const values: any[] = []
  const allowed = ['title', 'category', 'description', 'images', 'dimensions', 'era', 'material', 'provenance', 'condition', 'estimated_value', 'status'] as const
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`)
      values.push(data[key])
    }
  }
  if (fields.length === 0) return false
  fields.push("updated_at = datetime('now')")
  values.push(id)
  const info = db.prepare(`UPDATE artworks SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  return info.changes > 0
}

export function deleteArtwork(id: string, userId: string): boolean {
  const artwork = db.prepare('SELECT owner_id FROM artworks WHERE id = ?').get(id) as { owner_id: string } | undefined
  if (!artwork || artwork.owner_id !== userId) return false
  const info = db.prepare('DELETE FROM artworks WHERE id = ?').run(id)
  return info.changes > 0
}

export function getArtworkCategories(): string[] {
  const rows = db.prepare('SELECT DISTINCT category FROM artworks').all() as { category: string }[]
  return rows.map(r => r.category)
}
