import { BaseRepository } from './BaseRepository.js';
import type { Winner, ShippingInfo } from '../../shared/types.js';

export class WinnerRepository extends BaseRepository<Winner> {
  protected tableName = 'winners';

  protected mapRowToEntity(row: Record<string, unknown>): Winner {
    return {
      id: row.id as number,
      lotteryRecordId: row.lottery_record_id as number,
      activityId: row.activity_id as number,
      userId: row.user_id as string,
      prizeId: row.prize_id as number,
      status: row.status as Winner['status'],
      shippingInfo: row.shipping_info ? JSON.parse(row.shipping_info as string) : undefined,
      distributeTime: row.distribute_time as string,
      redeemTime: row.redeem_time as string,
      createdAt: row.created_at as string
    };
  }

  create(winner: Omit<Winner, 'id' | 'createdAt'>): number {
    const result = this.db.prepare(`
      INSERT INTO winners (lottery_record_id, activity_id, user_id, prize_id, status, shipping_info, distribute_time, redeem_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      winner.lotteryRecordId,
      winner.activityId,
      winner.userId,
      winner.prizeId,
      winner.status || 'pending',
      winner.shippingInfo ? JSON.stringify(winner.shippingInfo) : null,
      winner.distributeTime || null,
      winner.redeemTime || null
    );
    return result.lastInsertRowid as number;
  }

  updateStatus(id: number, status: Winner['status']): boolean {
    const fields: string[] = ['status = ?'];
    const values: unknown[] = [status];
    
    if (status === 'distributed') {
      fields.push('distribute_time = CURRENT_TIMESTAMP');
    }
    if (status === 'redeemed') {
      fields.push('redeem_time = CURRENT_TIMESTAMP');
    }
    
    values.push(id);
    const result = this.db.prepare(`UPDATE winners SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return result.changes > 0;
  }

  updateShippingInfo(id: number, shippingInfo: ShippingInfo): boolean {
    const result = this.db.prepare(`
      UPDATE winners SET shipping_info = ?, status = 'shipped' WHERE id = ?
    `).run(JSON.stringify(shippingInfo), id);
    return result.changes > 0;
  }

  findByStatus(status: Winner['status'], page: number = 1, pageSize: number = 20): { items: Winner[]; total: number } {
    return this.findPaginated(page, pageSize, 'status = ?', [status]);
  }

  findByUser(userId: string, page: number = 1, pageSize: number = 20): { items: Winner[]; total: number } {
    return this.findPaginated(page, pageSize, 'user_id = ?', [userId]);
  }

  findByUserWithDetails(userId: string, page: number = 1, pageSize: number = 20): { items: Winner[]; total: number } {
    const offset = (page - 1) * pageSize;
    
    const totalRow = this.db.prepare(`
      SELECT COUNT(*) as count FROM winners WHERE user_id = ?
    `).get(userId) as { count: number };
    
    const rows = this.db.prepare(`
      SELECT w.*, p.name as prize_name, p.type as prize_type, p.value as prize_value,
             a.name as activity_name
      FROM winners w
      LEFT JOIN prizes p ON w.prize_id = p.id
      LEFT JOIN activities a ON w.activity_id = a.id
      WHERE w.user_id = ?
      ORDER BY w.id DESC LIMIT ? OFFSET ?
    `).all(userId, pageSize, offset);
    
    const items = rows.map(row => {
      const r = row as Record<string, unknown>;
      const winner = this.mapRowToEntity(r);
      winner.prize = {
        id: r.prize_id as number,
        name: r.prize_name as string,
        type: r.prize_type as Winner['prize']['type'],
        value: r.prize_value as number,
        totalStock: 0,
        usedStock: 0,
        createdAt: ''
      };
      winner.activity = {
        id: r.activity_id as number,
        name: r.activity_name as string,
        description: '',
        theme: '',
        startTime: '',
        endTime: '',
        status: 'draft',
        participationRules: { requireLogin: false, dailyLimit: 0, totalLimit: 0, requiredTasks: [], eligibleUserGroups: [] },
        lotteryRules: { type: 'wheel', probabilityMode: 'equal', winLimit: 0, preventDuplicateWin: false },
        pageConfig: {},
        createdAt: '',
        updatedAt: ''
      };
      return winner;
    });
    
    return { items, total: totalRow.count };
  }

  findByActivity(activityId: number, page: number = 1, pageSize: number = 20): { items: Winner[]; total: number } {
    return this.findPaginated(page, pageSize, 'activity_id = ?', [activityId]);
  }

  countByActivity(activityId: number): { total: number; distributed: number; pending: number } {
    const totalRow = this.db.prepare(`
      SELECT COUNT(*) as count FROM winners WHERE activity_id = ?
    `).get(activityId) as { count: number };
    
    const distributedRow = this.db.prepare(`
      SELECT COUNT(*) as count FROM winners WHERE activity_id = ? AND status IN ('distributed', 'shipped', 'delivered', 'redeemed')
    `).get(activityId) as { count: number };
    
    const pendingRow = this.db.prepare(`
      SELECT COUNT(*) as count FROM winners WHERE activity_id = ? AND status = 'pending'
    `).get(activityId) as { count: number };
    
    return { total: totalRow.count, distributed: distributedRow.count, pending: pendingRow.count };
  }

  findWithDetails(page: number = 1, pageSize: number = 20, status?: Winner['status']): { items: Winner[]; total: number } {
    const offset = (page - 1) * pageSize;
    const whereClause = status ? 'WHERE w.status = ?' : '';
    const params: unknown[] = status ? [status] : [];
    
    const totalRow = this.db.prepare(`
      SELECT COUNT(*) as count FROM winners w ${whereClause}
    `).get(...params) as { count: number };
    
    params.push(pageSize, offset);
    
    const rows = this.db.prepare(`
      SELECT w.*, p.name as prize_name, p.type as prize_type, p.value as prize_value,
             a.name as activity_name, u.nickname as user_nickname, u.phone as user_phone
      FROM winners w
      LEFT JOIN prizes p ON w.prize_id = p.id
      LEFT JOIN activities a ON w.activity_id = a.id
      LEFT JOIN users u ON w.user_id = u.id
      ${whereClause}
      ORDER BY w.id DESC LIMIT ? OFFSET ?
    `).all(...params);
    
    const items = rows.map(row => {
      const r = row as Record<string, unknown>;
      const winner = this.mapRowToEntity(r);
      winner.prize = {
        id: r.prize_id as number,
        name: r.prize_name as string,
        type: r.prize_type as Winner['prize']['type'],
        value: r.prize_value as number,
        totalStock: 0,
        usedStock: 0,
        createdAt: ''
      };
      winner.activity = {
        id: r.activity_id as number,
        name: r.activity_name as string,
        description: '',
        theme: '',
        startTime: '',
        endTime: '',
        status: 'draft',
        participationRules: { requireLogin: false, dailyLimit: 0, totalLimit: 0, requiredTasks: [], eligibleUserGroups: [] },
        lotteryRules: { type: 'wheel', probabilityMode: 'equal', winLimit: 0, preventDuplicateWin: false },
        pageConfig: {},
        createdAt: '',
        updatedAt: ''
      };
      winner.user = {
        id: r.user_id as string,
        phone: r.user_phone as string,
        nickname: r.user_nickname as string,
        createdAt: ''
      };
      return winner;
    });
    
    return { items, total: totalRow.count };
  }
}
