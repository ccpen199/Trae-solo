import db from '../db/index.js'

export const refundService = {
  async requestRefund(orderId: number, ticketId: number, userId: number, reason: string, reasonCategory: string) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId) as any
    if (!order) throw new Error('订单不存在')

    const ticket = db.prepare('SELECT t.*, st.start_time FROM tickets t JOIN showtimes st ON t.showtime_id = st.id WHERE t.id = ? AND t.order_id = ?').get(ticketId, orderId) as any
    if (!ticket) throw new Error('票不存在')
    if (ticket.status !== 'valid') throw new Error('该票无法退票')

    const now = new Date()
    const startTime = new Date(ticket.startTime)
    const diffHours = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    let feeRate = 0
    if (diffHours >= 48) {
      feeRate = 0
    } else if (diffHours >= 24) {
      feeRate = 0.2
    } else {
      throw new Error('演出开始前24小时内不可退票')
    }

    const tier = db.prepare('SELECT price FROM pricing_tiers WHERE id = ?').get(ticket.pricingTierId) as any
    const price = tier?.price || 380
    const feeAmount = Math.round(price * feeRate * 100) / 100
    const refundAmount = Math.round((price - feeAmount) * 100) / 100

    db.prepare('UPDATE tickets SET status = ? WHERE id = ?').run('refunded', ticketId)

    const result = db
      .prepare(
        'INSERT INTO refund_records (ticket_id, order_id, refund_amount, fee_amount, reason, reason_category, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .run(ticketId, orderId, refundAmount, feeAmount, reason, reasonCategory, 'pending')

    db.prepare('UPDATE seats SET status = ? WHERE id = ?').run('available', ticket.seatId)
    db.prepare('UPDATE showtimes SET available_seats = available_seats + 1 WHERE id = ?').run(ticket.showtimeId)
    db.prepare('UPDATE pricing_tiers SET sold = sold - 1 WHERE id = ?').run(ticket.pricingTierId)

    const refund = db.prepare('SELECT * FROM refund_records WHERE id = ?').get(result.lastInsertRowid)
    return { refund, fee: feeAmount }
  },

  async reviewRefund(refundId: number, status: 'approved' | 'rejected', reason?: string) {
    const refund = db.prepare('SELECT * FROM refund_records WHERE id = ?').get(refundId) as any
    if (!refund) throw new Error('退票申请不存在')
    if (refund.status !== 'pending') throw new Error('该申请已处理')

    db.prepare('UPDATE refund_records SET status = ?, reason = COALESCE(?, reason) WHERE id = ?').run(status, reason || null, refundId)

    if (status === 'approved') {
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(refund.orderId) as any
      if (order) {
        const ticketCount = (db.prepare('SELECT COUNT(*) as cnt FROM tickets WHERE order_id = ? AND status = ?').get(order.id, 'valid') as any).cnt
        if (ticketCount === 0) {
          db.prepare('UPDATE orders SET payment_status = ? WHERE id = ?').run('refunded', order.id)
        }
      }
      db.prepare('UPDATE refund_records SET status = ? WHERE id = ?').run('completed', refundId)
    }

    return db.prepare('SELECT * FROM refund_records WHERE id = ?').get(refundId)
  },
}
