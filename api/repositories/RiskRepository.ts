import { BaseRepository } from './BaseRepository.js';
import type { RiskItem, RiskEvidence } from '../../shared/types.js';

export class RiskRepository extends BaseRepository<RiskItem> {
  protected tableName = 'risk_items';

  protected mapRowToEntity(row: Record<string, unknown>): RiskItem {
    return {
      id: row.id as number,
      type: row.type as RiskItem['type'],
      level: row.level as RiskItem['level'],
      lotteryRecordId: row.lottery_record_id as number | undefined,
      userId: row.user_id as string | undefined,
      evidence: JSON.parse(row.evidence as string),
      status: row.status as RiskItem['status'],
      processedBy: row.processed_by as number | undefined,
      processedAt: row.processed_at as string,
      processNote: row.process_note as string,
      createdAt: row.created_at as string
    };
  }

  create(riskItem: Omit<RiskItem, 'id' | 'createdAt'>): number {
    const result = this.db.prepare(`
      INSERT INTO risk_items (type, level, lottery_record_id, user_id, evidence, status, processed_by, processed_at, process_note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      riskItem.type,
      riskItem.level || 'medium',
      riskItem.lotteryRecordId || null,
      riskItem.userId || null,
      JSON.stringify(riskItem.evidence),
      riskItem.status || 'pending',
      riskItem.processedBy || null,
      riskItem.processedAt || null,
      riskItem.processNote || null
    );
    return result.lastInsertRowid as number;
  }

  process(id: number, status: RiskItem['status'], processedBy: number, processNote: string): boolean {
    const result = this.db.prepare(`
      UPDATE risk_items 
      SET status = ?, processed_by = ?, processed_at = CURRENT_TIMESTAMP, process_note = ?
      WHERE id = ?
    `).run(status, processedBy, processNote, id);
    return result.changes > 0;
  }

  findPending(page: number = 1, pageSize: number = 20): { items: RiskItem[]; total: number } {
    return this.findPaginated(page, pageSize, 'status = ?', ['pending']);
  }

  findByLevel(level: RiskItem['level'], page: number = 1, pageSize: number = 20): { items: RiskItem[]; total: number } {
    return this.findPaginated(page, pageSize, 'level = ?', [level]);
  }

  findByType(type: RiskItem['type'], page: number = 1, pageSize: number = 20): { items: RiskItem[]; total: number } {
    return this.findPaginated(page, pageSize, 'type = ?', [type]);
  }

  findWithDetails(page: number = 1, pageSize: number = 20, status?: RiskItem['status']): { items: RiskItem[]; total: number } {
    const offset = (page - 1) * pageSize;
    const whereClause = status ? 'WHERE r.status = ?' : '';
    const params: unknown[] = status ? [status] : [];
    
    const totalRow = this.db.prepare(`
      SELECT COUNT(*) as count FROM risk_items r ${whereClause}
    `).get(...params) as { count: number };
    
    params.push(pageSize, offset);
    
    const rows = this.db.prepare(`
      SELECT r.*, lr.is_win, lr.draw_time, lr.prize_id,
             p.name as prize_name, u.nickname as user_nickname, u.phone as user_phone,
             a.username as processed_by_name
      FROM risk_items r
      LEFT JOIN lottery_records lr ON r.lottery_record_id = lr.id
      LEFT JOIN prizes p ON lr.prize_id = p.id
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN admins a ON r.processed_by = a.id
      ${whereClause}
      ORDER BY r.id DESC LIMIT ? OFFSET ?
    `).all(...params);
    
    const items = rows.map(row => {
      const r = row as Record<string, unknown>;
      const riskItem = this.mapRowToEntity(r);
      if (r.lottery_record_id) {
        riskItem.lotteryRecord = {
          id: r.lottery_record_id as number,
          participationId: 0,
          activityId: 0,
          userId: r.user_id as string,
          prizeId: r.prize_id as number,
          isWin: !!r.is_win,
          drawTime: r.draw_time as string,
          riskStatus: 'normal'
        };
        if (r.prize_id) {
          riskItem.lotteryRecord.prize = {
            id: r.prize_id as number,
            name: r.prize_name as string,
            type: 'virtual',
            value: 0,
            totalStock: 0,
            usedStock: 0,
            createdAt: ''
          };
        }
      }
      if (r.user_id) {
        riskItem.user = {
          id: r.user_id as string,
          phone: r.user_phone as string,
          nickname: r.user_nickname as string,
          createdAt: ''
        };
      }
      return riskItem;
    });
    
    return { items, total: totalRow.count };
  }

  countPending(): number {
    const row = this.db.prepare(`
      SELECT COUNT(*) as count FROM risk_items WHERE status = 'pending'
    `).get() as { count: number };
    return row.count;
  }

  findByLotteryRecord(lotteryRecordId: number): RiskItem | null {
    const row = this.db.prepare(`
      SELECT * FROM risk_items WHERE lottery_record_id = ?
    `).get(lotteryRecordId);
    return row ? this.mapRowToEntity(row as Record<string, unknown>) : null;
  }

  getEvidence(id: number): RiskEvidence | null {
    const row = this.db.prepare(`
      SELECT evidence FROM risk_items WHERE id = ?
    `).get(id) as { evidence: string } | undefined;
    return row ? JSON.parse(row.evidence) : null;
  }
}
