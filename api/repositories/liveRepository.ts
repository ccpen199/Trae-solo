import getDatabase from '../config/database.js'
import { toCamelCase } from './utils.js'
import type { LiveSession, LiveReservation } from '../../shared/types/index.js'

interface SessionWithReservations extends LiveSession {
  reservations: LiveReservation[]
  reservationCount: number
}

const liveRepository = {
  findSessionById(id: number): LiveSession | null {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM live_sessions WHERE id = ?')
    const row = stmt.get(id)
    return row ? toCamelCase<LiveSession>(row) : null
  },

  findSessionByIdWithReservations(id: number): SessionWithReservations | null {
    const db = getDatabase()
    const sessionStmt = db.prepare('SELECT * FROM live_sessions WHERE id = ?')
    const sessionRow = sessionStmt.get(id)
    if (!sessionRow) return null

    const reservationStmt = db.prepare('SELECT * FROM live_reservations WHERE session_id = ? ORDER BY id')
    const reservationRows = reservationStmt.all(id)

    const countStmt = db.prepare('SELECT COUNT(*) as count FROM live_reservations WHERE session_id = ?')
    const { count } = countStmt.get(id) as { count: number }

    const session = toCamelCase<LiveSession>(sessionRow)
    const reservations = toCamelCase<LiveReservation[]>(reservationRows)

    return {
      ...session,
      reservations,
      reservationCount: count
    }
  },

  findAllSessions(page: number = 1, pageSize: number = 20): { items: LiveSession[]; total: number } {
    const db = getDatabase()
    const countStmt = db.prepare('SELECT COUNT(*) as total FROM live_sessions')
    const { total } = countStmt.get() as { total: number }

    const offset = (page - 1) * pageSize
    const dataStmt = db.prepare('SELECT * FROM live_sessions ORDER BY scheduled_at DESC LIMIT ? OFFSET ?')
    const rows = dataStmt.all(pageSize, offset)

    return {
      items: toCamelCase<LiveSession[]>(rows),
      total
    }
  },

  findSessionsByExpertId(expertId: number): LiveSession[] {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM live_sessions WHERE expert_id = ? ORDER BY scheduled_at DESC')
    const rows = stmt.all(expertId)
    return toCamelCase<LiveSession[]>(rows)
  },

  findSessionsByStatus(status: string, page: number = 1, pageSize: number = 20): { items: LiveSession[]; total: number } {
    const db = getDatabase()
    const countStmt = db.prepare('SELECT COUNT(*) as total FROM live_sessions WHERE status = ?')
    const { total } = countStmt.get(status) as { total: number }

    const offset = (page - 1) * pageSize
    const dataStmt = db.prepare('SELECT * FROM live_sessions WHERE status = ? ORDER BY scheduled_at DESC LIMIT ? OFFSET ?')
    const rows = dataStmt.all(status, pageSize, offset)

    return {
      items: toCamelCase<LiveSession[]>(rows),
      total
    }
  },

  findUpcomingSessions(limit: number = 10): LiveSession[] {
    const db = getDatabase()
    const stmt = db.prepare(`
      SELECT * FROM live_sessions 
      WHERE status IN ('scheduled', 'live') 
      ORDER BY scheduled_at ASC 
      LIMIT ?
    `)
    const rows = stmt.all(limit)
    return toCamelCase<LiveSession[]>(rows)
  },

  searchSessions(keyword?: string, status?: string, page: number = 1, pageSize: number = 20): { items: LiveSession[]; total: number } {
    const db = getDatabase()
    const conditions: string[] = []
    const params: unknown[] = []

    if (keyword) {
      conditions.push('(title LIKE ? OR description LIKE ?)')
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    if (status) {
      conditions.push('status = ?')
      params.push(status)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM live_sessions ${whereClause}`)
    const { total } = countStmt.get(...params) as { total: number }

    const offset = (page - 1) * pageSize
    const dataStmt = db.prepare(`SELECT * FROM live_sessions ${whereClause} ORDER BY scheduled_at DESC LIMIT ? OFFSET ?`)
    const rows = dataStmt.all(...params, pageSize, offset)

    return {
      items: toCamelCase<LiveSession[]>(rows),
      total
    }
  },

  createSession(data: Omit<LiveSession, 'id' | 'createdAt'>): number {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO live_sessions (expert_id, title, description, scheduled_at, duration, status, stream_url, playback_url)
      VALUES (@expertId, @title, @description, @scheduledAt, @duration, @status, @streamUrl, @playbackUrl)
    `)
    const result = stmt.run({
      expertId: data.expertId,
      title: data.title,
      description: data.description || null,
      scheduledAt: data.scheduledAt,
      duration: data.duration || 60,
      status: data.status || 'scheduled',
      streamUrl: data.streamUrl || null,
      playbackUrl: data.playbackUrl || null
    })
    return Number(result.lastInsertRowid)
  },

  updateSession(id: number, data: Partial<Omit<LiveSession, 'id' | 'createdAt' | 'expertId'>>): boolean {
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

    const stmt = db.prepare(`UPDATE live_sessions SET ${fields.join(', ')} WHERE id = @id`)
    const result = stmt.run(params)
    return result.changes > 0
  },

  deleteSession(id: number): boolean {
    const db = getDatabase()
    const deleteReservations = db.prepare('DELETE FROM live_reservations WHERE session_id = ?')
    const deleteSession = db.prepare('DELETE FROM live_sessions WHERE id = ?')

    const deleteTransaction = db.transaction((sessionId: number) => {
      deleteReservations.run(sessionId)
      deleteSession.run(sessionId)
    })

    deleteTransaction(id)
    return true
  },

  createReservation(data: Omit<LiveReservation, 'id' | 'createdAt'>): number {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO live_reservations (session_id, user_id)
      VALUES (@sessionId, @userId)
    `)
    const result = stmt.run(data)
    return Number(result.lastInsertRowid)
  },

  findReservationsBySessionId(sessionId: number): LiveReservation[] {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM live_reservations WHERE session_id = ? ORDER BY id')
    const rows = stmt.all(sessionId)
    return toCamelCase<LiveReservation[]>(rows)
  },

  findReservationsByUserId(userId: number): LiveReservation[] {
    const db = getDatabase()
    const stmt = db.prepare(`
      SELECT lr.* FROM live_reservations lr
      INNER JOIN live_sessions ls ON lr.session_id = ls.id
      WHERE lr.user_id = ?
      ORDER BY ls.scheduled_at DESC
    `)
    const rows = stmt.all(userId)
    return toCamelCase<LiveReservation[]>(rows)
  },

  findReservation(sessionId: number, userId: number): LiveReservation | null {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM live_reservations WHERE session_id = ? AND user_id = ?')
    const row = stmt.get(sessionId, userId)
    return row ? toCamelCase<LiveReservation>(row) : null
  },

  deleteReservation(id: number): boolean {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM live_reservations WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  },

  deleteReservationByUserAndSession(sessionId: number, userId: number): boolean {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM live_reservations WHERE session_id = ? AND user_id = ?')
    const result = stmt.run(sessionId, userId)
    return result.changes > 0
  },

  getReservationCount(sessionId: number): number {
    const db = getDatabase()
    const stmt = db.prepare('SELECT COUNT(*) as count FROM live_reservations WHERE session_id = ?')
    const { count } = stmt.get(sessionId) as { count: number }
    return count
  }
}

export default liveRepository
