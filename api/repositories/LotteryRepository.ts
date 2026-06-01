import { BaseRepository } from './BaseRepository.js';
import type { LotteryRecord } from '../../shared/types.js';

export class LotteryRepository extends BaseRepository<LotteryRecord> {
  protected tableName = 'lottery_records';

  protected mapRowToEntity(row: Record<string, unknown>): LotteryRecord {
    return {
      id: row.id as number,
      participationId: row.participation_id as number,
      activityId: row.activity_id as number,
      userId: row.user_id as string,
      prizeId: row.prize_id as number | undefined,
      isWin: !!row.is_win,
      drawTime: row.draw_time as string,
      riskStatus: row.risk_status as LotteryRecord['riskStatus']
    };
  }

  create(record: Omit<LotteryRecord, 'id' | 'drawTime'>): number {
    const result = this.db.prepare(`
      INSERT INTO lottery_records (participation_id, activity_id, user_id, prize_id, is_win, risk_status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      record.participationId,
      record.activityId,
      record.userId,
      record.prizeId || null,
      record.isWin ? 1 : 0,
      record.riskStatus || 'normal'
    );
    return result.lastInsertRowid as number;
  }

  updateRiskStatus(id: number, riskStatus: LotteryRecord['riskStatus']): boolean {
    const result = this.db.prepare(`
      UPDATE lottery_records SET risk_status = ? WHERE id = ?
    `).run(riskStatus, id);
    return result.changes > 0;
  }

  findByActivity(activityId: number, page: number = 1, pageSize: number = 20): { items: LotteryRecord[]; total: number } {
    return this.findPaginated(page, pageSize, 'activity_id = ?', [activityId]);
  }

  findByUser(userId: string, page: number = 1, pageSize: number = 20): { items: LotteryRecord[]; total: number } {
    return this.findPaginated(page, pageSize, 'user_id = ?', [userId]);
  }

  countWinByActivityAndUser(activityId: number, userId: string): number {
    const row = this.db.prepare(`
      SELECT COUNT(*) as count FROM lottery_records 
      WHERE activity_id = ? AND user_id = ? AND is_win = 1 AND risk_status != 'rejected'
    `).get(activityId, userId) as { count: number };
    return row.count;
  }

  countByActivity(activityId: number): { total: number; winCount: number } {
    const totalRow = this.db.prepare(`
      SELECT COUNT(*) as count FROM lottery_records WHERE activity_id = ?
    `).get(activityId) as { count: number };
    
    const winRow = this.db.prepare(`
      SELECT COUNT(*) as count FROM lottery_records WHERE activity_id = ? AND is_win = 1 AND risk_status != 'rejected'
    `).get(activityId) as { count: number };
    
    return { total: totalRow.count, winCount: winRow.count };
  }

  getDrawsInTimeRange(userId: string, startTime: string, endTime: string): number {
    const row = this.db.prepare(`
      SELECT COUNT(*) as count FROM lottery_records 
      WHERE user_id = ? AND draw_time >= ? AND draw_time <= ?
    `).get(userId, startTime, endTime) as { count: number };
    return row.count;
  }

  findWithDetailsByActivity(activityId: number, page: number = 1, pageSize: number = 20): { items: LotteryRecord[]; total: number } {
    const offset = (page - 1) * pageSize;
    
    const totalRow = this.db.prepare(`
      SELECT COUNT(*) as count FROM lottery_records WHERE activity_id = ?
    `).get(activityId) as { count: number };
    
    const rows = this.db.prepare(`
      SELECT lr.*, p.name as prize_name, p.type as prize_type, p.value as prize_value
      FROM lottery_records lr
      LEFT JOIN prizes p ON lr.prize_id = p.id
      WHERE lr.activity_id = ?
      ORDER BY lr.id DESC LIMIT ? OFFSET ?
    `).all(activityId, pageSize, offset);
    
    const items = rows.map(row => {
      const r = row as Record<string, unknown>;
      const record = this.mapRowToEntity(r);
      if (r.prize_id) {
        record.prize = {
          id: r.prize_id as number,
          name: r.prize_name as string,
          type: r.prize_type as LotteryRecord['prize']['type'],
          value: r.prize_value as number,
          totalStock: 0,
          usedStock: 0,
          createdAt: ''
        };
      }
      return record;
    });
    
    return { items, total: totalRow.count };
  }
}
