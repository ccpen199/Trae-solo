import { db } from '../db/index.js'
import type { TrackingEvent, Exception } from '../types/index.js'

export class TrackingRepository {
  private db = db

  addEvent(event: Omit<TrackingEvent, 'id'>): TrackingEvent {
    const stmt = this.db.prepare(`
      INSERT INTO tracking_events (order_id, location, description, status, event_time)
      VALUES (@order_id, @location, @description, @status, @event_time)
    `)
    const result = stmt.run(event as any)
    return this.db.prepare('SELECT * FROM tracking_events WHERE id = ?').get(result.lastInsertRowid) as TrackingEvent
  }

  getTracking(orderId: number): TrackingEvent[] {
    return this.db.prepare(`
      SELECT * FROM tracking_events
      WHERE order_id = ?
      ORDER BY event_time ASC
    `).all(orderId) as TrackingEvent[]
  }

  createException(exception: Omit<Exception, 'id'>): Exception {
    const stmt = this.db.prepare(`
      INSERT INTO exceptions (order_id, type, level, description, response_status, detected_at)
      VALUES (@order_id, @type, @level, @description, @response_status, @detected_at)
    `)
    const result = stmt.run(exception as any)
    return this.findExceptionById(Number(result.lastInsertRowid))!
  }

  findExceptionById(id: number): Exception | undefined {
    return this.db.prepare('SELECT * FROM exceptions WHERE id = ?').get(id) as Exception | undefined
  }

  getExceptions(params: { page?: number; pageSize?: number; level?: number; status?: string } = {}): { data: Exception[]; total: number } {
    const { page = 1, pageSize = 10, level, status: response_status } = params
    const where: string[] = []
    const values: any[] = []

    if (level) {
      where.push('level = ?')
      values.push(level)
    }
    if (response_status) {
      where.push('response_status = ?')
      values.push(response_status)
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''
    const totalStmt = this.db.prepare(`SELECT COUNT(*) as count FROM exceptions ${whereClause}`)
    const totalResult = totalStmt.get(...values) as { count: number }

    const offset = (page - 1) * pageSize
    const dataStmt = this.db.prepare(`
      SELECT e.*, o.order_no, o.order_no as tracking_no, o.receiver_name, o.receiver_phone
      FROM exceptions e
      LEFT JOIN orders o ON e.order_id = o.id
      ${whereClause}
      ORDER BY e.detected_at DESC
      LIMIT ? OFFSET ?
    `)
    const data = dataStmt.all(...values, pageSize, offset) as (Exception & { order_no: string; tracking_no: string; receiver_name: string; receiver_phone: string })[]

    return { data, total: totalResult.count }
  }

  updateException(id: number, updates: Partial<Exception>): Exception | undefined {
    const fields = Object.keys(updates)
      .filter(k => k !== 'id' && k !== 'detected_at')
      .map(k => `${k} = @${k}`)
      .join(', ')

    if (fields.length === 0) return this.findExceptionById(id)

    const stmt = this.db.prepare(`
      UPDATE exceptions SET ${fields} WHERE id = @id
    `)
    stmt.run({ ...updates, id })
    return this.findExceptionById(id)
  }

  getExceptionStats() {
    const result = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN level = 1 THEN 1 ELSE 0 END) as level1,
        SUM(CASE WHEN level = 2 THEN 1 ELSE 0 END) as level2,
        SUM(CASE WHEN level = 3 THEN 1 ELSE 0 END) as level3,
        SUM(CASE WHEN response_status = 'alert' THEN 1 ELSE 0 END) as status_alert,
        SUM(CASE WHEN response_status = 'called' THEN 1 ELSE 0 END) as status_called,
        SUM(CASE WHEN response_status = 'manager_intervened' THEN 1 ELSE 0 END) as status_manager,
        SUM(CASE WHEN response_status = 'resolved' THEN 1 ELSE 0 END) as status_resolved
      FROM exceptions
    `).get() as any

    return {
      total: result.total || 0,
      level1: result.level1 || 0,
      level2: result.level2 || 0,
      level3: result.level3 || 0,
      status_alert: result.status_alert || 0,
      status_called: result.status_called || 0,
      status_manager: result.status_manager || 0,
      status_resolved: result.status_resolved || 0,
    }
  }
}
