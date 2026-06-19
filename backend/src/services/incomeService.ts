import { getDb } from '../db';
import { nowTimestamp } from '../utils';
import type { IncomeDetail, IncomeType } from '../types';

export interface CreateIncomeParams {
  rider_id: number;
  order_id?: number;
  type: IncomeType;
  amount: number;
  description?: string;
  platform_commission?: number;
  insurance_fee?: number;
  reward_type?: string;
}

export function createIncomeRecord(params: CreateIncomeParams): IncomeDetail {
  const db = getDb();
  const now = nowTimestamp();

  const lastIncome = db
    .prepare(
      'SELECT balance FROM income_details WHERE rider_id = ? ORDER BY id DESC LIMIT 1'
    )
    .get(params.rider_id) as { balance: number } | undefined;

  const currentBalance = lastIncome?.balance || 0;
  const newBalance = currentBalance + params.amount;

  const result = db
    .prepare(
      `INSERT INTO income_details 
       (rider_id, order_id, type, amount, balance, description, 
        platform_commission, insurance_fee, reward_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      params.rider_id,
      params.order_id || null,
      params.type,
      params.amount,
      newBalance,
      params.description || null,
      params.platform_commission || 0,
      params.insurance_fee || 0,
      params.reward_type || null,
      now
    );

  return db
    .prepare('SELECT * FROM income_details WHERE id = ?')
    .get(result.lastInsertRowid) as IncomeDetail;
}

export function getRiderIncomeList(params: {
  rider_id: number;
  type?: IncomeType;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}): { list: IncomeDetail[]; total: number } {
  const db = getDb();
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const offset = (page - 1) * pageSize;

  let whereClauses: string[] = ['rider_id = ?'];
  let queryParams: any[] = [params.rider_id];

  if (params.type) {
    whereClauses.push('type = ?');
    queryParams.push(params.type);
  }
  if (params.startDate) {
    whereClauses.push('created_at >= ?');
    queryParams.push(new Date(params.startDate).getTime() / 1000);
  }
  if (params.endDate) {
    whereClauses.push('created_at <= ?');
    queryParams.push(new Date(params.endDate).getTime() / 1000 + 86400);
  }

  const whereSql = 'WHERE ' + whereClauses.join(' AND ');

  const total = db
    .prepare(`SELECT COUNT(*) as count FROM income_details ${whereSql}`)
    .get(...queryParams) as { count: number };

  const list = db
    .prepare(
      `SELECT * FROM income_details ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`
    )
    .all(...queryParams, pageSize, offset) as IncomeDetail[];

  return { list, total: total.count };
}

export function getRiderBalance(riderId: number): number {
  const db = getDb();
  const result = db
    .prepare(
      'SELECT balance FROM income_details WHERE rider_id = ? ORDER BY id DESC LIMIT 1'
    )
    .get(riderId) as { balance: number } | undefined;
  return result?.balance || 0;
}

export function getRiderIncomeSummary(riderId: number, days: number = 7): {
  total_income: number;
  delivery_fee: number;
  tips: number;
  rewards: number;
  deductions: number;
  order_count: number;
} {
  const db = getDb();
  const since = nowTimestamp() - days * 86400;

  const rows = db
    .prepare(
      `SELECT type, amount, order_id 
       FROM income_details 
       WHERE rider_id = ? AND created_at >= ?`
    )
    .all(riderId, since) as { type: string; amount: number; order_id: number | null }[];

  let totalIncome = 0;
  let deliveryFee = 0;
  let tips = 0;
  let rewards = 0;
  let deductions = 0;
  const orderIds = new Set<number>();

  for (const row of rows) {
    totalIncome += row.amount;
    if (row.type === 'delivery_fee') deliveryFee += row.amount;
    else if (row.type === 'tip') tips += row.amount;
    else if (row.type === 'reward') rewards += row.amount;
    else if (row.amount < 0) deductions += Math.abs(row.amount);
    if (row.order_id) orderIds.add(row.order_id);
  }

  return {
    total_income: totalIncome,
    delivery_fee: deliveryFee,
    tips,
    rewards,
    deductions,
    order_count: orderIds.size,
  };
}

export function settleOrderIncome(orderId: number, riderId: number): void {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
  if (!order) return;

  const platformCommission = order.delivery_fee * 0.2;
  const insuranceFee = 0.5;
  const riderEarning = order.delivery_fee - platformCommission - insuranceFee + order.tip_amount;

  createIncomeRecord({
    rider_id: riderId,
    order_id: orderId,
    type: 'delivery_fee',
    amount: riderEarning,
    description: `订单配送费 - ${order.order_no}`,
    platform_commission: platformCommission,
    insurance_fee: insuranceFee,
  });

  if (order.tip_amount > 0) {
    createIncomeRecord({
      rider_id: riderId,
      order_id: orderId,
      type: 'tip',
      amount: order.tip_amount,
      description: `订单小费 - ${order.order_no}`,
    });
  }
}
