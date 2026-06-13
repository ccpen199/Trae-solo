import crypto from 'crypto'
import db from '../db/index.js'
import type { Ticket } from '../../shared/types.js'

export const ticketService = {
  async detail(ticketId: number, userId: number) {
    const ticket = db.prepare(
      'SELECT t.*, s.seat_label, z.name as zone_name, st.start_time, e.title, e.venue FROM tickets t ' +
        'JOIN seats s ON t.seat_id = s.id ' +
        'JOIN zones z ON s.zone_id = z.id ' +
        'JOIN showtimes st ON t.showtime_id = st.id ' +
        'JOIN events e ON st.event_id = e.id ' +
        'WHERE t.id = ? AND t.user_id = ?'
    ).get(ticketId, userId)
    if (!ticket) throw new Error('票不存在')
    return ticket
  },

  async verify(antiFakeCode: string) {
    const ticket = db.prepare(
      'SELECT t.*, s.seat_label, z.name as zone_name, st.start_time, e.title FROM tickets t ' +
        'JOIN seats s ON t.seat_id = s.id ' +
        'JOIN zones z ON s.zone_id = z.id ' +
        'JOIN showtimes st ON t.showtime_id = st.id ' +
        'JOIN events e ON st.event_id = e.id ' +
        'WHERE t.anti_fake_code = ?'
    ).get(antiFakeCode) as Ticket | undefined

    if (!ticket) return { valid: false, reason: '防伪码无效' }
    if (ticket.status === 'used') return { valid: false, reason: '该票已使用' }
    if (ticket.status === 'refunded') return { valid: false, reason: '该票已退票' }
    if (ticket.status === 'expired') return { valid: false, reason: '该票已过期' }

    const expectedHash = crypto.createHash('sha256').update(antiFakeCode + 'TICKET_VAULT_SECRET_2026').digest('hex')
    const hashPrefix = ticket.blockchainHash?.slice(0, 16) || ''
    const expectedPrefix = expectedHash.slice(0, 16)
    if (hashPrefix !== expectedPrefix) return { valid: false, reason: '区块链存证验证失败' }

    return { valid: true, ticket }
  },

  async checkin(ticketId: number, gateId?: string) {
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId) as Ticket | undefined
    if (!ticket) throw new Error('票不存在')
    if (ticket.status !== 'valid') throw new Error('该票无法核验')

    db.prepare('UPDATE tickets SET status = ? WHERE id = ?').run('used', ticketId)
    const result = db.prepare('INSERT INTO checkin_records (ticket_id, gate_id) VALUES (?, ?)').run(ticketId, gateId || null)

    const checkin = db.prepare('SELECT * FROM checkin_records WHERE id = ?').get(result.lastInsertRowid) as any
    return { success: true, checkedInAt: checkin.checked_in_at }
  },
}
