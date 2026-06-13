import crypto from 'crypto'
import db from '../db/index.js'
import type { Order, Ticket } from '../../shared/types.js'

function generateOrderNo() {
  return 'TK' + Date.now() + Math.random().toString(36).slice(2, 6).toUpperCase()
}

function generateAntiFakeCode() {
  return crypto.randomUUID()
}

function blockchainHash(data: string) {
  return crypto.createHash('sha256').update(data + Date.now() + 'TICKET_VAULT_SECRET_2026').digest('hex')
}

export const orderService = {
  async create(userId: number, showtimeId: number, seatIds: number[], paymentMethod: 'direct' | 'credit', zhimaAuthCode?: string) {
    const tx = db.transaction(() => {
      const showtime = db.prepare('SELECT * FROM showtimes WHERE id = ?').get(showtimeId) as any
      if (!showtime) throw new Error('场次不存在')

      if (paymentMethod === 'credit') {
        const user = db.prepare('SELECT credit_score FROM users WHERE id = ?').get(userId) as any
        if (!user || user.creditScore < 600) {
          throw new Error('信用分不足，无法使用先看后付')
        }
      }

      const seats = db.prepare('SELECT * FROM seats WHERE id IN (' + seatIds.map(() => '?').join(',') + ')').all(...seatIds) as any[]
      if (seats.length !== seatIds.length) throw new Error('座位不存在')

      const tiers = db.prepare('SELECT * FROM pricing_tiers WHERE showtime_id = ?').all(showtimeId) as any[]
      const tierMap = new Map(tiers.map((t) => [t.id, t]))

      let totalAmount = 0
      seats.forEach((seat) => {
        const tier = tierMap.get(seat.pricingTierId)
        if (tier) totalAmount += tier.price
        else totalAmount += 380
      })

      const orderNo = generateOrderNo()
      const paymentStatus = paymentMethod === 'credit' ? 'credit_held' : 'paid'

      const orderResult = db
        .prepare('INSERT INTO orders (user_id, order_no, total_amount, payment_method, payment_status, zhima_auth_code) VALUES (?, ?, ?, ?, ?, ?)')
        .run(userId, orderNo, totalAmount, paymentMethod, paymentStatus, zhimaAuthCode || null)
      const orderId = Number(orderResult.lastInsertRowid)

      const tickets: Ticket[] = []
      for (const seat of seats) {
        const antiFakeCode = generateAntiFakeCode()
        const bcHash = blockchainHash(antiFakeCode)

        db.prepare('UPDATE seats SET status = ? WHERE id = ?').run('sold', seat.id)
        db.prepare('UPDATE pricing_tiers SET sold = sold + 1 WHERE id = ?').run(seat.pricingTierId)

        const ticketResult = db
          .prepare(
            'INSERT INTO tickets (order_id, seat_id, showtime_id, user_id, pricing_tier_id, anti_fake_code, blockchain_hash, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
          )
          .run(orderId, seat.id, showtimeId, userId, seat.pricingTierId, antiFakeCode, bcHash, 'valid')

        tickets.push({
          id: Number(ticketResult.lastInsertRowid),
          orderId,
          seatId: seat.id,
          showtimeId,
          userId,
          pricingTierId: seat.pricingTierId,
          antiFakeCode,
          blockchainHash: bcHash,
          status: 'valid',
          createdAt: new Date().toISOString(),
        })
      }

      db.prepare('UPDATE showtimes SET available_seats = available_seats - ? WHERE id = ?').run(seats.length, showtimeId)
      return { orderId, orderNo, totalAmount, paymentStatus, tickets }
    })

    return tx()
  },

  async list(userId: number, status?: string) {
    let sql = 'SELECT * FROM orders WHERE user_id = ?'
    const args: any[] = [userId]
    if (status && status !== 'all') {
      sql += ' AND payment_status = ?'
      args.push(status)
    }
    sql += ' ORDER BY created_at DESC'
    const orders = db.prepare(sql).all(...args) as Order[]

    const result = []
    for (const order of orders) {
      const tickets = db.prepare('SELECT t.*, s.seat_label, z.name as zone_name FROM tickets t JOIN seats s ON t.seat_id = s.id JOIN zones z ON s.zone_id = z.id WHERE t.order_id = ?').all(order.id) as any[]
      const showtime = tickets[0] ? db.prepare('SELECT st.*, e.title, e.venue FROM showtimes st JOIN events e ON st.event_id = e.id WHERE st.id = ?').get(tickets[0].showtimeId) : null
      result.push({ ...order, tickets, showtime })
    }
    return result
  },

  async detail(orderId: number, userId: number) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId) as Order | undefined
    if (!order) throw new Error('订单不存在')

    const tickets = db.prepare('SELECT t.*, s.seat_label, z.name as zone_name FROM tickets t JOIN seats s ON t.seat_id = s.id JOIN zones z ON s.zone_id = z.id WHERE t.order_id = ?').all(orderId)
    return { order, tickets }
  },
}
