import db from '../db/index.js'
import type { QueueEntry } from '../../shared/types.js'

function generateQueueId() {
  return 'Q' + Date.now() + Math.random().toString(36).slice(2, 8).toUpperCase()
}

export const queueService = {
  async joinQueue(userId: number, showtimeId: number, seatIds: number[], priorityBoost?: number) {
    const showtime = db.prepare('SELECT * FROM showtimes WHERE id = ?').get(showtimeId) as any
    if (!showtime) throw new Error('场次不存在')
    if (showtime.status !== 'on_sale' && showtime.status !== 'presale') {
      throw new Error('该场次尚未开售')
    }

    const user = db.prepare('SELECT credit_score FROM users WHERE id = ?').get(userId) as any
    let priorityWeight = 1.0
    if (user && user.creditScore >= 700) priorityWeight += 0.3
    if (user && user.creditScore >= 800) priorityWeight += 0.2
    if (priorityBoost) priorityWeight += priorityBoost

    const maxPosition = (db.prepare('SELECT MAX(position) as max_p FROM queue_entries WHERE showtime_id = ? AND status = ?').get(showtimeId, 'waiting') as any)?.max_p || 0
    const position = maxPosition + 1
    const queueId = generateQueueId()

    db.prepare(
      'INSERT INTO queue_entries (queue_id, user_id, showtime_id, position, priority_weight, seat_holds, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(queueId, userId, showtimeId, position, priorityWeight, JSON.stringify(seatIds), 'waiting')

    const estimatedWait = Math.max(5, Math.floor(position * 0.5))
    return { queueId, position, estimatedWait, priorityWeight }
  },

  async getStatus(queueId: string) {
    const entry = db.prepare('SELECT * FROM queue_entries WHERE queue_id = ?').get(queueId) as QueueEntry | undefined
    if (!entry) throw new Error('队列不存在')

    const aheadCount = (
      db.prepare('SELECT COUNT(*) as cnt FROM queue_entries WHERE showtime_id = ? AND status = ? AND priority_weight >= ? AND position < ?').get(
        entry.showtimeId,
        'waiting',
        entry.priorityWeight,
        entry.position
      ) as { cnt: number }
    ).cnt

    let orderId
    if (entry.status === 'success') {
      const order = db.prepare('SELECT id FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(entry.userId) as any
      orderId = order?.id
    }

    return {
      queueId: entry.queueId,
      position: aheadCount + 1,
      status: entry.status,
      orderId,
      priorityWeight: entry.priorityWeight,
      estimatedWait: Math.max(3, Math.floor((aheadCount + 1) * 0.5)),
    }
  },

  async boostQueue(queueId: string, type: 'member' | 'credit' | 'invite', value: number) {
    const entry = db.prepare('SELECT * FROM queue_entries WHERE queue_id = ?').get(queueId) as QueueEntry | undefined
    if (!entry || entry.status !== 'waiting') throw new Error('无法加速')

    let boost = 0
    if (type === 'member') boost = 0.2
    if (type === 'credit') boost = value >= 700 ? 0.15 : 0.1
    if (type === 'invite') boost = Math.min(0.3, value * 0.05)

    const newPriority = Math.min(2.0, entry.priorityWeight + boost)
    db.prepare('UPDATE queue_entries SET priority_weight = ? WHERE queue_id = ?').run(newPriority, queueId)

    const aheadCount = (
      db.prepare('SELECT COUNT(*) as cnt FROM queue_entries WHERE showtime_id = ? AND status = ? AND priority_weight >= ? AND position < ?').get(
        entry.showtimeId,
        'waiting',
        newPriority,
        entry.position
      ) as { cnt: number }
    ).cnt

    return { newPosition: aheadCount + 1, priority: newPriority }
  },

  async processQueue(showtimeId: number) {
    const entries = db
      .prepare(
        'SELECT * FROM queue_entries WHERE showtime_id = ? AND status = ? ORDER BY priority_weight DESC, position ASC LIMIT 10'
      )
      .all(showtimeId, 'waiting') as QueueEntry[]

    for (const entry of entries) {
      db.prepare('UPDATE queue_entries SET status = ? WHERE id = ?').run('processing', entry.id)

      try {
        const seatIds = JSON.parse(entry.seatHolds || '[]')
        if (seatIds.length === 0) {
          db.prepare('UPDATE queue_entries SET status = ? WHERE id = ?').run('failed', entry.id)
          continue
        }

        const available = db.prepare('SELECT COUNT(*) as cnt FROM seats WHERE id IN (' + seatIds.map(() => '?').join(',') + ') AND status = ?').get(...seatIds, 'available') as { cnt: number }
        if (available.cnt !== seatIds.length) {
          db.prepare('UPDATE queue_entries SET status = ? WHERE id = ?').run('failed', entry.id)
          continue
        }

        db.prepare('UPDATE queue_entries SET status = ? WHERE id = ?').run('success', entry.id)
      } catch (e) {
        db.prepare('UPDATE queue_entries SET status = ? WHERE id = ?').run('failed', entry.id)
      }
    }
  },
}
