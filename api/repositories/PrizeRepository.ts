import { BaseRepository } from './BaseRepository.js';
import type { Prize } from '../../shared/types.js';

export class PrizeRepository extends BaseRepository<Prize> {
  protected tableName = 'prizes';

  protected mapRowToEntity(row: Record<string, unknown>): Prize {
    return {
      id: row.id as number,
      name: row.name as string,
      type: row.type as Prize['type'],
      value: row.value as number,
      totalStock: row.total_stock as number,
      usedStock: row.used_stock as number,
      imageUrl: row.image_url as string,
      expireTime: row.expire_time as string,
      createdAt: row.created_at as string
    };
  }

  create(prize: Omit<Prize, 'id' | 'createdAt'>): number {
    const result = this.db.prepare(`
      INSERT INTO prizes (name, type, value, total_stock, used_stock, image_url, expire_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      prize.name,
      prize.type,
      prize.value,
      prize.totalStock,
      prize.usedStock || 0,
      prize.imageUrl || null,
      prize.expireTime || null
    );
    return result.lastInsertRowid as number;
  }

  update(id: number, prize: Partial<Prize>): boolean {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (prize.name !== undefined) { fields.push('name = ?'); values.push(prize.name); }
    if (prize.type !== undefined) { fields.push('type = ?'); values.push(prize.type); }
    if (prize.value !== undefined) { fields.push('value = ?'); values.push(prize.value); }
    if (prize.totalStock !== undefined) { fields.push('total_stock = ?'); values.push(prize.totalStock); }
    if (prize.usedStock !== undefined) { fields.push('used_stock = ?'); values.push(prize.usedStock); }
    if (prize.imageUrl !== undefined) { fields.push('image_url = ?'); values.push(prize.imageUrl); }
    if (prize.expireTime !== undefined) { fields.push('expire_time = ?'); values.push(prize.expireTime); }
    
    values.push(id);
    const result = this.db.prepare(`UPDATE prizes SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return result.changes > 0;
  }

  decrementStock(id: number, quantity: number = 1): boolean {
    const result = this.db.prepare(`
      UPDATE prizes SET used_stock = used_stock + ? 
      WHERE id = ? AND (total_stock - used_stock) >= ?
    `).run(quantity, id, quantity);
    return result.changes > 0;
  }

  findByType(type: Prize['type']): Prize[] {
    const rows = this.db.prepare(`SELECT * FROM prizes WHERE type = ? ORDER BY id DESC`).all(type);
    return rows.map(row => this.mapRowToEntity(row as Record<string, unknown>));
  }

  findAvailable(): Prize[] {
    const rows = this.db.prepare(`
      SELECT * FROM prizes 
      WHERE (total_stock - used_stock) > 0 
      AND (expire_time IS NULL OR expire_time > CURRENT_TIMESTAMP)
      ORDER BY id DESC
    `).all();
    return rows.map(row => this.mapRowToEntity(row as Record<string, unknown>));
  }
}
