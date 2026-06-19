import { getDb } from '../db';
import { nowTimestamp } from '../utils';
import { adjustCreditScore } from './creditService';
import type { Complaint, ComplaintType, ComplaintStatus } from '../types';

export interface CreateComplaintParams {
  order_id: number;
  rider_id?: number;
  type: ComplaintType;
  reason?: string;
  complainant_type?: string;
  complainant_id?: number;
  has_video_evidence?: boolean;
  video_url?: string;
}

export function createComplaint(params: CreateComplaintParams): Complaint {
  const db = getDb();
  const now = nowTimestamp();

  const result = db
    .prepare(
      `INSERT INTO complaints 
       (order_id, rider_id, type, reason, status, complainant_type, complainant_id,
        has_video_evidence, video_url, penalty_amount, created_at)
       VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, 0, ?)`
    )
    .run(
      params.order_id,
      params.rider_id || null,
      params.type,
      params.reason || null,
      params.complainant_type || null,
      params.complainant_id || null,
      params.has_video_evidence ? 1 : 0,
      params.video_url || null,
      now
    );

  return db
    .prepare('SELECT * FROM complaints WHERE id = ?')
    .get(result.lastInsertRowid) as Complaint;
}

export function getComplaintList(params?: {
  status?: ComplaintStatus;
  type?: ComplaintType;
  rider_id?: number;
  page?: number;
  pageSize?: number;
}): { list: Complaint[]; total: number } {
  const db = getDb();
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 20;
  const offset = (page - 1) * pageSize;

  let whereClauses: string[] = [];
  let queryParams: any[] = [];

  if (params?.status) {
    whereClauses.push('status = ?');
    queryParams.push(params.status);
  }
  if (params?.type) {
    whereClauses.push('type = ?');
    queryParams.push(params.type);
  }
  if (params?.rider_id) {
    whereClauses.push('rider_id = ?');
    queryParams.push(params.rider_id);
  }

  const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

  const total = db
    .prepare(`SELECT COUNT(*) as count FROM complaints ${whereSql}`)
    .get(...queryParams) as { count: number };

  const list = db
    .prepare(
      `SELECT * FROM complaints ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`
    )
    .all(...queryParams, pageSize, offset) as Complaint[];

  return { list, total: total.count };
}

export function getComplaintById(id: number): Complaint | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM complaints WHERE id = ?').get(id) as Complaint | undefined;
}

export function handleComplaint(
  complaintId: number,
  handlerId: number,
  result: string,
  penaltyAmount: number = 0,
  handlerNote?: string
): boolean {
  const db = getDb();
  const now = nowTimestamp();

  const complaint = getComplaintById(complaintId);
  if (!complaint) return false;

  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE complaints 
       SET status = 'resolved', handler_id = ?, handler_note = ?, result = ?, 
           penalty_amount = ?, handled_at = ?, closed_at = ?
       WHERE id = ?`
    ).run(handlerId, handlerNote || null, result, penaltyAmount, now, now, complaintId);

    if (complaint.rider_id && penaltyAmount > 0) {
      const { createIncomeRecord } = require('./incomeService');
      createIncomeRecord({
        rider_id: complaint.rider_id,
        order_id: complaint.order_id,
        type: 'penalty',
        amount: -penaltyAmount,
        description: `申诉处罚 - ${complaint.type}`,
      });

      if (complaint.type === 'timeout') {
        adjustCreditScore(complaint.rider_id, -5, 'complaint', {
          complaint_id: complaintId,
          reason: '超时申诉成立',
        });
      } else if (complaint.type === 'lost') {
        adjustCreditScore(complaint.rider_id, -20, 'complaint', {
          complaint_id: complaintId,
          reason: '丢件申诉成立',
        });
      } else if (complaint.type === 'bad_review') {
        adjustCreditScore(complaint.rider_id, -3, 'complaint', {
          complaint_id: complaintId,
          reason: '差评申诉成立',
        });
      }
    }
  });

  try {
    tx();
    return true;
  } catch (e) {
    return false;
  }
}

export function getComplaintStats(): { pending: number; reviewing: number; resolved: number; closed: number; total: number } {
  const db = getDb();
  const rows = db.prepare(
    `SELECT status, COUNT(*) as count FROM complaints GROUP BY status`
  ).all() as Array<{ status: string; count: number }>;
  const stats = { pending: 0, reviewing: 0, resolved: 0, closed: 0, total: 0 };
  for (const row of rows) {
    if (row.status in stats) {
      (stats as any)[row.status] = row.count;
    }
    stats.total += row.count;
  }
  return stats;
}

export function autoTriggerComplaint(
  orderId: number,
  type: ComplaintType,
  riderId?: number
): Complaint | null {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
  if (!order) return null;

  const reasons: Record<ComplaintType, string> = {
    timeout: '系统检测到订单超时，自动发起申诉',
    lost: '系统检测到丢件风险，自动发起申诉',
    bad_review: '系统检测到差评，自动发起申诉',
    service: '系统自动发起服务质量申诉',
    other: '系统自动发起申诉',
  };

  return createComplaint({
    order_id: orderId,
    rider_id: riderId || order.assigned_rider_id,
    type,
    reason: reasons[type],
    complainant_type: 'system',
    has_video_evidence: true,
    video_url: `/videos/quality/${order.order_no}.mp4`,
  });
}
