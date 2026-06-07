import { getDb } from '../db/index.js';
import type { Claim, Order, PaginationParams, PaginatedResponse } from '../../shared/types.js';

interface ClaimRow {
  id: number;
  order_id: string;
  type: 'timeout' | 'damaged' | 'rejected';
  reason: string;
  evidence?: string;
  refund_ratio: number;
  refund_amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

function mapClaimRow(row: ClaimRow): Claim {
  return {
    id: row.id,
    orderId: row.order_id,
    type: row.type,
    reason: row.reason,
    evidence: row.evidence,
    refundRatio: row.refund_ratio,
    refundAmount: row.refund_amount,
    status: row.status,
    createdAt: row.created_at,
  };
}

function calculateTimeoutRefund(order: Order): { ratio: number; amount: number; reason: string } {
  if (!order.actualDeliveryTime || !order.expectedDeliveryTime) {
    return { ratio: 0, amount: 0, reason: '无配送时间数据' };
  }

  const expected = new Date(order.expectedDeliveryTime).getTime();
  const actual = new Date(order.actualDeliveryTime).getTime();
  const delayMinutes = Math.max(0, (actual - expected) / (1000 * 60));

  if (delayMinutes <= 0) {
    return { ratio: 0, amount: 0, reason: '未超时' };
  }

  let ratio: number;
  let reason: string;

  if (delayMinutes <= 30) {
    ratio = 0.3;
    reason = `超时${Math.round(delayMinutes)}分钟，30分钟内退30%`;
  } else if (delayMinutes <= 60) {
    ratio = 0.5;
    reason = `超时${Math.round(delayMinutes)}分钟，1小时内退50%`;
  } else {
    ratio = 1.0;
    reason = `超时${Math.round(delayMinutes)}分钟，2小时以上退100%`;
  }

  return {
    ratio,
    amount: Math.round(order.totalAmount * ratio * 100) / 100,
    reason,
  };
}

export interface AutoClaimResult {
  claim: Claim | null;
  autoApproved: boolean;
  message: string;
  refundAmount: number;
  refundRatio: number;
}

export async function createAutoClaim(orderId: string, type: 'timeout' | 'damaged' | 'rejected', data: {
  reason: string;
  evidence?: string;
  damageRatio?: number;
}): Promise<AutoClaimResult> {
  const db = getDb();

  const orderStmt = db.prepare('SELECT * FROM orders WHERE id = ?');
  const orderRow = orderStmt.get(orderId) as any;

  if (!orderRow) {
    return { claim: null, autoApproved: false, message: '订单不存在', refundAmount: 0, refundRatio: 0 };
  }

  const order: Order = {
    id: orderRow.id,
    userId: orderRow.user_id,
    shopId: orderRow.shop_id,
    totalAmount: orderRow.total_amount,
    status: orderRow.status,
    recipientName: orderRow.recipient_name,
    recipientPhone: orderRow.recipient_phone,
    recipientAddress: orderRow.recipient_address,
    recipientLat: orderRow.recipient_lat,
    recipientLng: orderRow.recipient_lng,
    deliveryType: orderRow.delivery_type,
    expectedDeliveryTime: orderRow.expected_delivery_time,
    actualDeliveryTime: orderRow.actual_delivery_time,
    riderId: orderRow.rider_id,
    createdAt: orderRow.created_at,
  };

  let refundRatio: number;
  let refundAmount: number;
  let finalReason: string;
  let autoApproved = true;

  if (type === 'timeout') {
    const result = calculateTimeoutRefund(order);
    refundRatio = result.ratio;
    refundAmount = result.amount;
    finalReason = `${data.reason}；${result.reason}`;
  } else if (type === 'damaged') {
    const damageRatio = data.damageRatio || 0.5;
    refundRatio = Math.min(1, Math.max(0, damageRatio));
    refundAmount = Math.round(order.totalAmount * refundRatio * 100) / 100;
    finalReason = `${data.reason}；损毁比例${Math.round(refundRatio * 100)}%，按比例退款`;
    autoApproved = damageRatio <= 0.5;
  } else {
    refundRatio = 1.0;
    refundAmount = order.totalAmount;
    finalReason = `${data.reason}；拒收全额退款`;
    autoApproved = false;
  }

  if (refundAmount <= 0) {
    return { claim: null, autoApproved: false, message: '不符合赔付条件', refundAmount: 0, refundRatio: 0 };
  }

  const stmt = db.prepare(`
    INSERT INTO claims (order_id, type, reason, evidence, refund_ratio, refund_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    orderId,
    type,
    finalReason,
    data.evidence || null,
    refundRatio,
    refundAmount,
    autoApproved ? 'approved' : 'pending'
  );

  if (autoApproved) {
    const updateOrder = db.prepare("UPDATE orders SET status = 'refunded' WHERE id = ?");
    updateOrder.run(orderId);
  }

  const claim = await getClaimById(Number(result.lastInsertRowid));

  return {
    claim,
    autoApproved,
    message: autoApproved ? '自动赔付已批准' : '赔付申请已提交，等待审核',
    refundAmount,
    refundRatio,
  };
}

export async function getClaimById(id: number): Promise<Claim | null> {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM claims WHERE id = ?');
  const row = stmt.get(id) as ClaimRow | undefined;
  return row ? mapClaimRow(row) : null;
}

export async function getClaims(
  params: PaginationParams & {
    orderId?: string;
    status?: 'pending' | 'approved' | 'rejected';
    type?: 'timeout' | 'damaged' | 'rejected';
  }
): Promise<PaginatedResponse<Claim>> {
  const db = getDb();
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const values: any[] = [];

  if (params.orderId) {
    conditions.push('order_id = ?');
    values.push(params.orderId);
  }
  if (params.status) {
    conditions.push('status = ?');
    values.push(params.status);
  }
  if (params.type) {
    conditions.push('type = ?');
    values.push(params.type);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM claims ${whereClause}`);
  const { count } = countStmt.get(...values) as { count: number };

  const stmt = db.prepare(`
    SELECT * FROM claims ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);
  const rows = stmt.all(...values, pageSize, offset) as ClaimRow[];

  return {
    items: rows.map(mapClaimRow),
    total: count,
    page,
    pageSize,
  };
}

export async function reviewClaim(id: number, action: 'approve' | 'reject'): Promise<Claim | null> {
  const db = getDb();
  const claim = await getClaimById(id);
  if (!claim) return null;
  if (claim.status !== 'pending') return claim;

  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  const stmt = db.prepare('UPDATE claims SET status = ? WHERE id = ?');
  stmt.run(newStatus, id);

  if (action === 'approve') {
    const updateOrder = db.prepare("UPDATE orders SET status = 'refunded' WHERE id = ?");
    updateOrder.run(claim.orderId);
  }

  return getClaimById(id);
}

export async function createManualClaim(data: Omit<Claim, 'id' | 'createdAt' | 'status'>): Promise<Claim> {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO claims (order_id, type, reason, evidence, refund_ratio, refund_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `);
  const result = stmt.run(
    data.orderId,
    data.type,
    data.reason,
    data.evidence || null,
    data.refundRatio,
    data.refundAmount
  );
  return getClaimById(Number(result.lastInsertRowid)) as Promise<Claim>;
}

export async function getClaimStats(): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalRefundAmount: number;
  timeoutCount: number;
  damagedCount: number;
  rejectedCount: number;
}> {
  const db = getDb();

  const statsStmt = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN status = 'approved' THEN refund_amount ELSE 0 END) as total_refund,
      SUM(CASE WHEN type = 'timeout' THEN 1 ELSE 0 END) as timeout_count,
      SUM(CASE WHEN type = 'damaged' THEN 1 ELSE 0 END) as damaged_count,
      SUM(CASE WHEN type = 'rejected' THEN 1 ELSE 0 END) as rejected_count
    FROM claims
  `);
  const stats = statsStmt.get() as any;

  return {
    total: stats.total || 0,
    pending: stats.pending || 0,
    approved: stats.approved || 0,
    rejected: stats.rejected || 0,
    totalRefundAmount: Math.round((stats.total_refund || 0) * 100) / 100,
    timeoutCount: stats.timeout_count || 0,
    damagedCount: stats.damaged_count || 0,
    rejectedCount: stats.rejected_count || 0,
  };
}
