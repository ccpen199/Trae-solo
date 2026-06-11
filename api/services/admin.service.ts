import db from '../db/database.js';
import { ApiResponse, UserRole, UserStatus, Task, Talent, Dispute, AuditLog, TaskStatus, TalentLevel } from '../../shared/types.js';
import { parseTask } from './task.service.js';
import { parseTalent } from './talent.service.js';

function parseUser(row: Record<string, unknown>) {
  if (!row) return undefined;
  return {
    id: row.id as number,
    email: row.email as string,
    phone: (row.phone as string) || '',
    name: row.name as string,
    avatar: (row.avatar as string) || null,
    role: row.role as UserRole,
    status: row.status as UserStatus,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function parseDispute(row: Record<string, unknown>): Dispute {
  return {
    id: row.id as number,
    taskId: row.task_id as number,
    initiatorId: row.initiator_id as number,
    respondentId: row.respondent_id as number,
    reason: row.reason as string,
    description: row.description as string,
    evidence: row.evidence ? JSON.parse(row.evidence as string) : [],
    status: row.status as Dispute['status'],
    resolution: (row.resolution as string) || null,
    amountDistribution: row.amount_distribution ? JSON.parse(row.amount_distribution as string) : null,
    resolvedBy: (row.resolved_by as number) || null,
    resolvedAt: (row.resolved_at as string) || null,
    createdAt: row.created_at as string,
  };
}

function parseAuditLog(row: Record<string, unknown>): AuditLog {
  return {
    id: row.id as number,
    userId: row.user_id as number,
    action: row.action as string,
    resourceType: row.resource_type as string,
    resourceId: (row.resource_id as number) || null,
    ipAddress: (row.ip_address as string) || '',
    userAgent: (row.user_agent as string) || '',
    details: row.details ? JSON.parse(row.details as string) : {},
    createdAt: row.created_at as string,
  };
}

export class AdminService {
  async getTaskBoard(status?: TaskStatus): Promise<ApiResponse<Record<TaskStatus, Task[]>>> {
    const allStatuses: TaskStatus[] = ['draft', 'published', 'bidding', 'selected', 'in_progress', 'submitted', 'reviewing', 'revising', 'completed', 'disputed', 'cancelled'];

    const result: Record<TaskStatus, Task[]> = {} as Record<TaskStatus, Task[]>;

    for (const s of allStatuses) {
      if (status && status !== s) continue;

      const rows = db.prepare(`
        SELECT * FROM tasks WHERE status = ?
        ORDER BY updated_at DESC
        LIMIT 50
      `).all(s) as Record<string, unknown>[];

      const tasks = rows.map(row => {
        const task = parseTask(row);

        const employerRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(task.employerId) as Record<string, unknown> | undefined;
        task.employer = parseUser(employerRow);

        if (task.providerId) {
          const providerRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(task.providerId) as Record<string, unknown> | undefined;
          task.provider = parseUser(providerRow);
        }

        return task;
      });

      result[s] = tasks;
    }

    return { success: true, data: result };
  }

  async updateTaskStatus(taskId: number, status: TaskStatus, adminId: number): Promise<ApiResponse<Task>> {
    const row = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(taskId) as Record<string, unknown> | undefined;
    if (!row) {
      return { success: false, message: '任务不存在' };
    }

    db.prepare(`
      UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(status, taskId);

    const updatedRow = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(taskId) as Record<string, unknown>;
    const task = parseTask(updatedRow);

    const employerRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(task.employerId) as Record<string, unknown> | undefined;
    task.employer = parseUser(employerRow);

    if (task.providerId) {
      const providerRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(task.providerId) as Record<string, unknown> | undefined;
      task.provider = parseUser(providerRow);
    }

    return { success: true, message: '任务状态已更新', data: task };
  }

  async getTalentList(query: { page?: number; pageSize?: number; level?: TalentLevel; verified?: boolean }): Promise<ApiResponse<Talent[]>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (query.level) {
      conditions.push('level = ?');
      params.push(query.level);
    }

    if (query.verified !== undefined) {
      conditions.push('verified = ?');
      params.push(query.verified ? 1 : 0);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db.prepare(`
      SELECT COUNT(*) as total FROM talents ${whereClause}
    `).get(...params) as { total: number };

    const rows = db.prepare(`
      SELECT * FROM talents ${whereClause}
      ORDER BY verified ASC, rating DESC, created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset) as Record<string, unknown>[];

    const talents = rows.map(row => {
      const talent = parseTalent(row);
      const userRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(talent.userId) as Record<string, unknown> | undefined;
      talent.user = parseUser(userRow);
      return talent;
    });

    return {
      success: true,
      data: talents,
      total: countRow.total,
      page,
      pageSize,
    };
  }

  async getAuditLogs(query: { page?: number; pageSize?: number; userId?: number; action?: string; resourceType?: string; startDate?: string; endDate?: string }): Promise<ApiResponse<AuditLog[]>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (query.userId) {
      conditions.push('user_id = ?');
      params.push(query.userId);
    }

    if (query.action) {
      conditions.push('action = ?');
      params.push(query.action);
    }

    if (query.resourceType) {
      conditions.push('resource_type = ?');
      params.push(query.resourceType);
    }

    if (query.startDate) {
      conditions.push('created_at >= ?');
      params.push(query.startDate);
    }

    if (query.endDate) {
      conditions.push('created_at <= ?');
      params.push(query.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db.prepare(`
      SELECT COUNT(*) as total FROM audit_logs ${whereClause}
    `).get(...params) as { total: number };

    const rows = db.prepare(`
      SELECT * FROM audit_logs ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset) as Record<string, unknown>[];

    const logs = rows.map(row => {
      const log = parseAuditLog(row);
      const userRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(log.userId) as Record<string, unknown> | undefined;
      log.user = parseUser(userRow);
      return log;
    });

    return {
      success: true,
      data: logs,
      total: countRow.total,
      page,
      pageSize,
    };
  }

  async getPlatformStats(): Promise<ApiResponse<Record<string, number>>> {
    const userCountRow = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role != 'admin'`).get() as { count: number };
    const taskCountRow = db.prepare(`SELECT COUNT(*) as count FROM tasks`).get() as { count: number };
    const completedTaskRow = db.prepare(`SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'`).get() as { count: number };
    const totalAmountRow = db.prepare(`SELECT COALESCE(SUM(CASE WHEN type = 'fee' THEN amount ELSE 0 END), 0) as total FROM transactions`).get() as { total: number };
    const pendingDisputesRow = db.prepare(`SELECT COUNT(*) as count FROM disputes WHERE status IN ('pending', 'reviewing')`).get() as { count: number };
    const pendingVerificationsRow = db.prepare(`SELECT COUNT(*) as count FROM talents WHERE verified = 0`).get() as { count: number };

    return {
      success: true,
      data: {
        totalUsers: userCountRow.count,
        totalTasks: taskCountRow.count,
        completedTasks: completedTaskRow.count,
        platformRevenue: totalAmountRow.total,
        pendingDisputes: pendingDisputesRow.count,
        pendingVerifications: pendingVerificationsRow.count,
      },
    };
  }
}

export default new AdminService();
