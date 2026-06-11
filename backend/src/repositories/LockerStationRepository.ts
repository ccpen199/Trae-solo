import { getDb } from '../database';
import { LockerStation } from '../types';

export class LockerStationRepository {
  findById(id: number): LockerStation | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM locker_stations WHERE id = ?').get(id) as LockerStation | undefined;
  }

  findAll(branchId?: number): LockerStation[] {
    const db = getDb();
    if (branchId) {
      return db.prepare('SELECT * FROM locker_stations WHERE branch_id = ? ORDER BY created_at DESC').all(branchId) as LockerStation[];
    }
    return db.prepare('SELECT * FROM locker_stations ORDER BY created_at DESC').all() as LockerStation[];
  }

  countByType(): { type: string; count: number }[] {
    const db = getDb();
    return db.prepare('SELECT type, COUNT(*) as count FROM locker_stations GROUP BY type').all() as { type: string; count: number }[];
  }

  updateSlots(id: number, totalSlots: number, usedSlots: number): boolean {
    const db = getDb();
    const result = db.prepare('UPDATE locker_stations SET total_slots = ?, used_slots = ? WHERE id = ?').run(totalSlots, usedSlots, id);
    return result.changes > 0;
  }

  create(data: { name: string; code: string; type: string; address?: string; total_slots: number; used_slots: number; branch_id: number }): number {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO locker_stations (name, code, type, address, total_slots, used_slots, branch_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(data.name, data.code, data.type, data.address || null, data.total_slots, data.used_slots, data.branch_id);
    return Number(result.lastInsertRowid);
  }
}
