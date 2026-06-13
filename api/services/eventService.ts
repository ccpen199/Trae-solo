import db from '../db/index.js'
import type { Event, Showtime } from '../../shared/types.js'

export const eventService = {
  async list(params: { category?: string; keyword?: string; page?: number; pageSize?: number }) {
    const { category, keyword, page = 1, pageSize = 10 } = params
    let sql = 'SELECT * FROM events WHERE status != ?'
    const args: any[] = ['draft']

    if (category && category !== 'all') {
      sql += ' AND category = ?'
      args.push(category)
    }
    if (keyword) {
      sql += ' AND (title LIKE ? OR venue LIKE ?)'
      args.push(`%${keyword}%`, `%${keyword}%`)
    }

    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as cnt')
    const total = (db.prepare(countSql).get(...args) as { cnt: number }).cnt

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    args.push(pageSize, (page - 1) * pageSize)

    const events = db.prepare(sql).all(...args) as Event[]
    return { events, total, page, pageSize }
  },

  async detail(id: number) {
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id) as Event | undefined
    if (!event) throw new Error('演出不存在')
    const showtimes = db.prepare('SELECT * FROM showtimes WHERE event_id = ? ORDER BY start_time').all(id) as Showtime[]
    return { event, showtimes }
  },

  async create(data: { organizerId: number; title: string; category: string; description: string; venue: string; poster?: string }) {
    const result = db
      .prepare('INSERT INTO events (organizer_id, title, category, description, venue, poster, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(data.organizerId, data.title, data.category, data.description, data.venue, data.poster || '', 'draft')
    return db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid) as Event
  },

  async update(id: number, data: Partial<Event>) {
    const existing = db.prepare('SELECT id FROM events WHERE id = ?').get(id)
    if (!existing) throw new Error('演出不存在')

    const fields: string[] = []
    const args: any[] = []
    if (data.title) { fields.push('title = ?'); args.push(data.title) }
    if (data.category) { fields.push('category = ?'); args.push(data.category) }
    if (data.description !== undefined) { fields.push('description = ?'); args.push(data.description) }
    if (data.venue) { fields.push('venue = ?'); args.push(data.venue) }
    if (data.status) { fields.push('status = ?'); args.push(data.status) }

    args.push(id)
    db.prepare(`UPDATE events SET ${fields.join(', ')} WHERE id = ?`).run(...args)
    return db.prepare('SELECT * FROM events WHERE id = ?').get(id) as Event
  },
}
