import { BaseRepository } from './BaseRepository.js';
import { AuditLog } from '../types/index.js';
import db from '../db.js';

export class AuditLogRepository extends BaseRepository<AuditLog> {
  constructor() {
    super('audit_logs');
  }

  create(log: Omit<AuditLog, 'id' | 'createdAt'>): number {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, application_id, action, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      log.userId,
      log.applicationId,
      log.action,
      log.details,
      log.ipAddress,
      log.userAgent
    );
    return Number(result.lastInsertRowid);
  }

  findByUserId(userId: number, page: number = 1, pageSize: number = 20) {
    return this.paginate(page, pageSize, 'user_id = ?', [userId]);
  }

  findByApplicationId(applicationId: number, page: number = 1, pageSize: number = 20) {
    return this.paginate(page, pageSize, 'application_id = ?', [applicationId]);
  }

  search(filters: { userId?: number; applicationId?: number; action?: string; startDate?: string; endDate?: string }, page: number = 1, pageSize: number = 20) {
    const conditions: string[] = [];
    const params: any[] = [];
    
    if (filters.userId) {
      conditions.push('user_id = ?');
      params.push(filters.userId);
    }
    if (filters.applicationId) {
      conditions.push('application_id = ?');
      params.push(filters.applicationId);
    }
    if (filters.action) {
      conditions.push('action = ?');
      params.push(filters.action);
    }
    if (filters.startDate) {
      conditions.push('created_at >= ?');
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      conditions.push('created_at <= ?');
      params.push(filters.endDate);
    }
    
    const where = conditions.length > 0 ? conditions.join(' AND ') : undefined;
    return this.paginate(page, pageSize, where, params);
  }
}
