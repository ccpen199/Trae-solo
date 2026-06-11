import db from '../db/database.js';
import { Dispute, DisputeCreateRequest, DisputeResolveRequest, ApiResponse, UserRole, UserStatus } from '../../shared/types.js';
import { parseTask } from './task.service.js';

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

export class DisputeService {
  async createDispute(data: DisputeCreateRequest, userId: number): Promise<ApiResponse<Dispute>> {
    const taskRow = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(data.taskId) as Record<string, unknown> | undefined;
    if (!taskRow) {
      return { success: false, message: '任务不存在' };
    }
    const task = parseTask(taskRow);

    if (task.employerId !== userId && task.providerId !== userId) {
      return { success: false, message: '无权发起争议' };
    }

    if (task.status === 'disputed') {
      return { success: false, message: '该任务已有争议处理中' };
    }

    const respondentId = task.employerId === userId ? task.providerId! : task.employerId;

    const result = db.prepare(`
      INSERT INTO disputes (task_id, initiator_id, respondent_id, reason, description, evidence, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(
      data.taskId,
      userId,
      respondentId,
      data.reason,
      data.description,
      JSON.stringify(data.evidence)
    );

    db.prepare(`
      UPDATE tasks SET status = 'disputed', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(data.taskId);

    const row = db.prepare(`SELECT * FROM disputes WHERE id = ?`).get(result.lastInsertRowid) as Record<string, unknown>;
    const dispute = parseDispute(row);
    dispute.task = task;

    return { success: true, message: '争议已提交，平台将在3个工作日内处理', data: dispute };
  }

  async getDisputeList(query: { page?: number; pageSize?: number; status?: Dispute['status'] }, userId: number, role: UserRole): Promise<ApiResponse<Dispute[]>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (role !== 'admin') {
      conditions.push('(initiator_id = ? OR respondent_id = ?)');
      params.push(userId, userId);
    }

    if (query.status) {
      conditions.push('status = ?');
      params.push(query.status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db.prepare(`
      SELECT COUNT(*) as total FROM disputes ${whereClause}
    `).get(...params) as { total: number };

    const rows = db.prepare(`
      SELECT * FROM disputes ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset) as Record<string, unknown>[];

    const disputes = rows.map(row => {
      const dispute = parseDispute(row);

      const taskRow = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(dispute.taskId) as Record<string, unknown> | undefined;
      if (taskRow) dispute.task = parseTask(taskRow);

      const initiatorRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(dispute.initiatorId) as Record<string, unknown> | undefined;
      dispute.initiator = parseUser(initiatorRow);

      const respondentRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(dispute.respondentId) as Record<string, unknown> | undefined;
      dispute.respondent = parseUser(respondentRow);

      if (dispute.resolvedBy) {
        const resolverRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(dispute.resolvedBy) as Record<string, unknown> | undefined;
        dispute.resolver = parseUser(resolverRow);
      }

      return dispute;
    });

    return {
      success: true,
      data: disputes,
      total: countRow.total,
      page,
      pageSize,
    };
  }

  async resolveDispute(disputeId: number, data: DisputeResolveRequest, adminId: number): Promise<ApiResponse<Dispute>> {
    const row = db.prepare(`SELECT * FROM disputes WHERE id = ?`).get(disputeId) as Record<string, unknown> | undefined;
    if (!row) {
      return { success: false, message: '争议不存在' };
    }
    const dispute = parseDispute(row);

    const taskRow = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(dispute.taskId) as Record<string, unknown> | undefined;
    if (!taskRow) {
      return { success: false, message: '任务不存在' };
    }
    const task = parseTask(taskRow);

    db.prepare(`
      UPDATE disputes
      SET status = ?, resolution = ?, amount_distribution = ?, resolved_by = ?, resolved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.status,
      data.resolution,
      JSON.stringify(data.amountDistribution),
      adminId,
      disputeId
    );

    const totalAmount = Object.values(data.amountDistribution).reduce((sum, val) => sum + val, 0);

    Object.entries(data.amountDistribution).forEach(([uid, amount]) => {
      const userId = Number(uid);
      db.prepare(`
        UPDATE wallets
        SET frozen_balance = frozen_balance - ?, balance = balance + ?, total_income = total_income + ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(amount, amount, amount, userId);

      db.prepare(`
        INSERT INTO transactions (user_id, type, amount, balance, task_id, description, status)
        VALUES (?, 'refund', ?, (SELECT balance FROM wallets WHERE user_id = ?), ?, ?, 'completed')
      `).run(userId, amount, userId, dispute.taskId, `争议裁决分配：${data.resolution}`);
    });

    if (data.status === 'resolved' || data.status === 'closed') {
      db.prepare(`
        UPDATE tasks SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(dispute.taskId);
    }

    const updatedRow = db.prepare(`SELECT * FROM disputes WHERE id = ?`).get(disputeId) as Record<string, unknown>;
    const updated = parseDispute(updatedRow);
    updated.task = task;

    const initiatorRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(updated.initiatorId) as Record<string, unknown> | undefined;
    updated.initiator = parseUser(initiatorRow);

    const respondentRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(updated.respondentId) as Record<string, unknown> | undefined;
    updated.respondent = parseUser(respondentRow);

    const resolverRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(adminId) as Record<string, unknown> | undefined;
    updated.resolver = parseUser(resolverRow);

    return { success: true, message: '争议已处理', data: updated };
  }
}

export default new DisputeService();
