import { db } from '../db/index.js'
import type { Provider, BulkOrder } from '../types/index.js'

export class ProviderRepository {
  private db = db

  findAll(): Provider[] {
    return this.db.prepare('SELECT * FROM providers ORDER BY rating DESC').all() as Provider[]
  }

  findById(id: number): Provider | undefined {
    return this.db.prepare('SELECT * FROM providers WHERE id = ?').get(id) as Provider | undefined
  }

  createBulkOrder(order: Omit<BulkOrder, 'id'>): BulkOrder {
    const stmt = this.db.prepare(`
      INSERT INTO bulk_orders (order_no, user_id, provider_id, item_desc, floors,
        has_elevator, floor_height, disassembly_required, fee, status)
      VALUES (@order_no, @user_id, @provider_id, @item_desc, @floors,
        @has_elevator, @floor_height, @disassembly_required, @fee, @status)
    `)
    const result = stmt.run(order as any)
    return this.findBulkOrderById(Number(result.lastInsertRowid))!
  }

  findBulkOrderById(id: number): BulkOrder | undefined {
    return this.db.prepare(`
      SELECT bo.*, p.name as provider_name
      FROM bulk_orders bo
      LEFT JOIN providers p ON bo.provider_id = p.id
      WHERE bo.id = ?
    `).get(id) as BulkOrder | undefined
  }

  findBulkOrders(userId?: number): (BulkOrder & { provider_name?: string })[] {
    if (userId) {
      return this.db.prepare(`
        SELECT bo.*, p.name as provider_name
        FROM bulk_orders bo
        LEFT JOIN providers p ON bo.provider_id = p.id
        WHERE bo.user_id = ?
        ORDER BY bo.created_at DESC
      `).all(userId) as (BulkOrder & { provider_name?: string })[]
    }
    return this.db.prepare(`
      SELECT bo.*, p.name as provider_name
      FROM bulk_orders bo
      LEFT JOIN providers p ON bo.provider_id = p.id
      ORDER BY bo.created_at DESC
    `).all() as (BulkOrder & { provider_name?: string })[]
  }

  calculateFee(params: {
    floors: number
    has_elevator: boolean
    floor_height?: number
    disassembly_required: boolean
    weight?: number
  }): number {
    const { floors, has_elevator, floor_height = 3, disassembly_required, weight = 50 } = params

    let fee = 0

    if (has_elevator) {
      fee = 50 + Math.max(0, floors - 3) * 10
    } else {
      fee = 80 + floors * 30
    }

    if (floor_height > 3.5) {
      fee += (floor_height - 3.5) * 20
    }

    if (disassembly_required) {
      fee += 200
    }

    if (weight > 50) {
      fee += Math.ceil((weight - 50) / 10) * 30
    }

    return Math.round(fee * 100) / 100
  }

  bookProvider(providerId: number): boolean {
    const result = this.db.prepare(`
      UPDATE providers SET booked_count = booked_count + 1 WHERE id = ?
    `).run(providerId)
    return result.changes > 0
  }
}
