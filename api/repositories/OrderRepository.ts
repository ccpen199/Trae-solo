import { db } from '../db/index.js'
import type { Order } from '../types/index.js'

export class OrderRepository {
  private db = db

  create(order: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Order {
    const stmt = this.db.prepare(`
      INSERT INTO orders (order_no, user_id, sender_name, sender_phone, sender_address,
        receiver_name, receiver_phone, receiver_address, goods_type, weight, urgency,
        routing_plan, carrier, estimated_delivery, status)
      VALUES (@order_no, @user_id, @sender_name, @sender_phone, @sender_address,
        @receiver_name, @receiver_phone, @receiver_address, @goods_type, @weight, @urgency,
        @routing_plan, @carrier, @estimated_delivery, @status)
    `)
    const result = stmt.run(order as any)
    return this.findById(Number(result.lastInsertRowid))!
  }

  findById(id: number): Order | undefined {
    return this.db.prepare(`
      SELECT *, order_no as tracking_no, 
        CASE 
          WHEN urgency = 'urgent' THEN weight * 15 + 20
          WHEN urgency = 'express' THEN weight * 10 + 15
          ELSE weight * 5 + 10
        END as cost
      FROM orders WHERE id = ?
    `).get(id) as Order | undefined
  }

  findByOrderNo(orderNo: string): Order | undefined {
    return this.db.prepare('SELECT * FROM orders WHERE order_no = ?').get(orderNo) as Order | undefined
  }

  findAll(params: { page?: number; pageSize?: number; status?: string; user_id?: number } = {}): { data: Order[]; total: number } {
    const { page = 1, pageSize = 10, status, user_id } = params
    const where: string[] = []
    const values: any[] = []

    if (status) {
      where.push('status = ?')
      values.push(status)
    }
    if (user_id) {
      where.push('user_id = ?')
      values.push(user_id)
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''
    const totalStmt = this.db.prepare(`SELECT COUNT(*) as count FROM orders ${whereClause}`)
    const totalResult = totalStmt.get(...values) as { count: number }

    const offset = (page - 1) * pageSize
    const dataStmt = this.db.prepare(`
      SELECT *, order_no as tracking_no,
        CASE
          WHEN urgency = 'urgent' THEN weight * 15 + 20
          WHEN urgency = 'express' THEN weight * 10 + 15
          ELSE weight * 5 + 10
        END as cost
      FROM orders ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `)
    const data = dataStmt.all(...values, pageSize, offset) as Order[]

    return { data, total: totalResult.count }
  }

  update(id: number, updates: Partial<Order>): Order | undefined {
    const fields = Object.keys(updates)
      .filter(k => k !== 'id' && k !== 'created_at')
      .map(k => `${k} = @${k}`)
      .join(', ')

    if (fields.length === 0) return this.findById(id)

    const stmt = this.db.prepare(`
      UPDATE orders SET ${fields}, updated_at = datetime('now') WHERE id = @id
    `)
    stmt.run({ ...updates, id })
    return this.findById(id)
  }

  delete(id: number): boolean {
    const result = this.db.prepare('DELETE FROM orders WHERE id = ?').run(id)
    return result.changes > 0
  }

  getStats() {
    const result = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in_transit' THEN 1 ELSE 0 END) as in_transit,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'exception' THEN 1 ELSE 0 END) as exception
      FROM orders
    `).get() as any

    return {
      total: result.total || 0,
      pending: result.pending || 0,
      in_transit: result.in_transit || 0,
      delivered: result.delivered || 0,
      exception: result.exception || 0,
    }
  }
}
