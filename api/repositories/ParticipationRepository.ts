import { BaseRepository } from './BaseRepository.js';
import type { Participation } from '../../shared/types.js';

export class ParticipationRepository extends BaseRepository<Participation> {
  protected tableName = 'participations';

  protected mapRowToEntity(row: Record<string, unknown>): Participation {
    return {
      id: row.id as number,
      activityId: row.activity_id as number,
      userId: row.user_id as string,
      channel: row.channel as string,
      deviceId: row.device_id as string,
      ip: row.ip as string,
      qualified: !!row.qualified,
      disqualifyReason: row.disqualify_reason as string,
      drawCount: row.draw_count as number,
      tasksCompleted: row.tasks_completed ? JSON.parse(row.tasks_completed as string) : [],
      createdAt: row.created_at as string
    };
  }

  create(participation: Omit<Participation, 'id' | 'createdAt'>): number {
    const result = this.db.prepare(`
      INSERT INTO participations (activity_id, user_id, channel, device_id, ip, qualified, disqualify_reason, draw_count, tasks_completed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      participation.activityId,
      participation.userId,
      participation.channel,
      participation.deviceId || null,
      participation.ip || null,
      participation.qualified ? 1 : 0,
      participation.disqualifyReason || null,
      participation.drawCount || 0,
      JSON.stringify(participation.tasksCompleted || [])
    );
    return result.lastInsertRowid as number;
  }

  update(id: number, participation: Partial<Participation>): boolean {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (participation.qualified !== undefined) { fields.push('qualified = ?'); values.push(participation.qualified ? 1 : 0); }
    if (participation.disqualifyReason !== undefined) { fields.push('disqualify_reason = ?'); values.push(participation.disqualifyReason); }
    if (participation.drawCount !== undefined) { fields.push('draw_count = ?'); values.push(participation.drawCount); }
    if (participation.tasksCompleted !== undefined) { fields.push('tasks_completed = ?'); values.push(JSON.stringify(participation.tasksCompleted)); }
    
    values.push(id);
    const result = this.db.prepare(`UPDATE participations SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return result.changes > 0;
  }

  incrementDrawCount(id: number): boolean {
    const result = this.db.prepare(`
      UPDATE participations SET draw_count = draw_count + 1 WHERE id = ?
    `).run(id);
    return result.changes > 0;
  }

  findByActivityAndUser(activityId: number, userId: string): Participation | null {
    const row = this.db.prepare(`
      SELECT * FROM participations WHERE activity_id = ? AND user_id = ?
    `).get(activityId, userId);
    return row ? this.mapRowToEntity(row as Record<string, unknown>) : null;
  }

  findByUser(userId: string): Participation[] {
    const rows = this.db.prepare(`
      SELECT * FROM participations WHERE user_id = ? ORDER BY id DESC
    `).all(userId);
    return rows.map(row => this.mapRowToEntity(row as Record<string, unknown>));
  }

  countByActivity(activityId: number): { total: number; uniqueUsers: number } {
    const totalRow = this.db.prepare(`
      SELECT COUNT(*) as count FROM participations WHERE activity_id = ?
    `).get(activityId) as { count: number };
    
    const uniqueRow = this.db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count FROM participations WHERE activity_id = ?
    `).get(activityId) as { count: number };
    
    return { total: totalRow.count, uniqueUsers: uniqueRow.count };
  }

  getTodayCount(activityId: number, userId: string): number {
    const row = this.db.prepare(`
      SELECT draw_count FROM participations 
      WHERE activity_id = ? AND user_id = ? AND DATE(created_at) = DATE('now')
    `).get(activityId, userId) as { draw_count: number } | undefined;
    return row?.draw_count || 0;
  }
}
