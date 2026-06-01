import { db } from '../db/index.js'
import type { Rider, ExpressOrder } from '../types/index.js'

export class RiderRepository {
  private db = db

  findById(id: number): Rider | undefined {
    return this.db.prepare('SELECT * FROM riders WHERE id = ?').get(id) as Rider | undefined
  }

  findAll(status?: string): Rider[] {
    if (status) {
      return this.db.prepare('SELECT * FROM riders WHERE status = ?').all(status) as Rider[]
    }
    return this.db.prepare('SELECT * FROM riders').all() as Rider[]
  }

  updateLocation(id: number, latitude: number, longitude: number): Rider | undefined {
    this.db.prepare(`
      UPDATE riders SET latitude = ?, longitude = ?, updated_at = datetime('now') WHERE id = ?
    `).run(latitude, longitude, id)
    return this.findById(id)
  }

  updateStatus(id: number, status: string): Rider | undefined {
    this.db.prepare(`
      UPDATE riders SET status = ?, updated_at = datetime('now') WHERE id = ?
    `).run(status, id)
    return this.findById(id)
  }

  createExpressOrder(order: Omit<ExpressOrder, 'id'>): ExpressOrder {
    const stmt = this.db.prepare(`
      INSERT INTO express_orders (order_no, user_id, rider_id, protocol_id,
        pickup_address, delivery_address, special_items, status, estimated_minutes)
      VALUES (@order_no, @user_id, @rider_id, @protocol_id,
        @pickup_address, @delivery_address, @special_items, @status, @estimated_minutes)
    `)
    const result = stmt.run(order as any)
    return this.findExpressOrderById(Number(result.lastInsertRowid))!
  }

  findExpressOrderById(id: number): ExpressOrder | undefined {
    return this.db.prepare('SELECT * FROM express_orders WHERE id = ?').get(id) as ExpressOrder | undefined
  }

  findExpressOrderByNo(orderNo: string): ExpressOrder | undefined {
    return this.db.prepare('SELECT * FROM express_orders WHERE order_no = ?').get(orderNo) as ExpressOrder | undefined
  }

  findExpressOrders(userId?: number): ExpressOrder[] {
    if (userId) {
      return this.db.prepare(`
        SELECT eo.*, r.name as rider_name
        FROM express_orders eo
        LEFT JOIN riders r ON eo.rider_id = r.id
        WHERE eo.user_id = ?
        ORDER BY eo.created_at DESC
      `).all(userId) as (ExpressOrder & { rider_name?: string })[]
    }
    return this.db.prepare(`
      SELECT eo.*, r.name as rider_name
      FROM express_orders eo
      LEFT JOIN riders r ON eo.rider_id = r.id
      ORDER BY eo.created_at DESC
    `).all() as (ExpressOrder & { rider_name?: string })[]
  }

  updateExpressOrderStatus(id: number, status: string): ExpressOrder | undefined {
    this.db.prepare('UPDATE express_orders SET status = ? WHERE id = ?').run(status, id)
    return this.findExpressOrderById(id)
  }
}
