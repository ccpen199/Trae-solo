import { BaseRepository } from './BaseRepository.js';
import type { Activity, PrizeConfig } from '../../shared/types.js';

export class ActivityRepository extends BaseRepository<Activity> {
  protected tableName = 'activities';

  protected mapRowToEntity(row: Record<string, unknown>): Activity {
    return {
      id: row.id as number,
      name: row.name as string,
      description: row.description as string,
      theme: row.theme as string,
      startTime: row.start_time as string,
      endTime: row.end_time as string,
      status: row.status as Activity['status'],
      participationRules: JSON.parse(row.participation_rules as string),
      lotteryRules: JSON.parse(row.lottery_rules as string),
      pageConfig: row.page_config ? JSON.parse(row.page_config as string) : {},
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string
    };
  }

  create(activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>): number {
    const result = this.db.prepare(`
      INSERT INTO activities (name, description, theme, start_time, end_time, status, participation_rules, lottery_rules, page_config)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      activity.name,
      activity.description,
      activity.theme || 'default',
      activity.startTime,
      activity.endTime,
      activity.status || 'draft',
      JSON.stringify(activity.participationRules),
      JSON.stringify(activity.lotteryRules),
      JSON.stringify(activity.pageConfig || {})
    );
    return result.lastInsertRowid as number;
  }

  update(id: number, activity: Partial<Activity>): boolean {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (activity.name !== undefined) { fields.push('name = ?'); values.push(activity.name); }
    if (activity.description !== undefined) { fields.push('description = ?'); values.push(activity.description); }
    if (activity.theme !== undefined) { fields.push('theme = ?'); values.push(activity.theme); }
    if (activity.startTime !== undefined) { fields.push('start_time = ?'); values.push(activity.startTime); }
    if (activity.endTime !== undefined) { fields.push('end_time = ?'); values.push(activity.endTime); }
    if (activity.status !== undefined) { fields.push('status = ?'); values.push(activity.status); }
    if (activity.participationRules !== undefined) { fields.push('participation_rules = ?'); values.push(JSON.stringify(activity.participationRules)); }
    if (activity.lotteryRules !== undefined) { fields.push('lottery_rules = ?'); values.push(JSON.stringify(activity.lotteryRules)); }
    if (activity.pageConfig !== undefined) { fields.push('page_config = ?'); values.push(JSON.stringify(activity.pageConfig)); }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = this.db.prepare(`UPDATE activities SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return result.changes > 0;
  }

  findByStatus(status: Activity['status']): Activity[] {
    const rows = this.db.prepare(`SELECT * FROM activities WHERE status = ? ORDER BY id DESC`).all(status);
    return rows.map(row => this.mapRowToEntity(row as Record<string, unknown>));
  }

  findPublished(): Activity[] {
    const now = new Date().toISOString();
    const rows = this.db.prepare(`
      SELECT * FROM activities 
      WHERE status = 'published' AND start_time <= ? AND end_time >= ?
      ORDER BY id DESC
    `).all(now, now);
    return rows.map(row => this.mapRowToEntity(row as Record<string, unknown>));
  }

  addPrizeConfig(activityId: number, prizeId: number, probability: number, position: number): number {
    const result = this.db.prepare(`
      INSERT INTO prize_configs (activity_id, prize_id, probability, position)
      VALUES (?, ?, ?, ?)
    `).run(activityId, prizeId, probability, position);
    return result.lastInsertRowid as number;
  }

  updatePrizeConfig(id: number, probability: number, position: number): boolean {
    const result = this.db.prepare(`
      UPDATE prize_configs SET probability = ?, position = ? WHERE id = ?
    `).run(probability, position, id);
    return result.changes > 0;
  }

  removePrizeConfig(id: number): boolean {
    const result = this.db.prepare(`DELETE FROM prize_configs WHERE id = ?`).run(id);
    return result.changes > 0;
  }

  getPrizeConfigs(activityId: number): PrizeConfig[] {
    const rows = this.db.prepare(`
      SELECT pc.*, p.* FROM prize_configs pc
      LEFT JOIN prizes p ON pc.prize_id = p.id
      WHERE pc.activity_id = ?
      ORDER BY pc.position
    `).all(activityId);
    
    return rows.map(row => {
      const r = row as Record<string, unknown>;
      return {
        id: r.id as number,
        activityId: r.activity_id as number,
        prizeId: r.prize_id as number,
        probability: r.probability as number,
        position: r.position as number,
        prize: {
          id: r.prize_id as number,
          name: r.name as string,
          type: r.type as PrizeConfig['prize']['type'],
          value: r.value as number,
          totalStock: r.total_stock as number,
          usedStock: r.used_stock as number,
          imageUrl: r.image_url as string,
          expireTime: r.expire_time as string,
          createdAt: r.created_at as string
        }
      };
    });
  }

  clearPrizeConfigs(activityId: number): void {
    this.db.prepare(`DELETE FROM prize_configs WHERE activity_id = ?`).run(activityId);
  }
}
