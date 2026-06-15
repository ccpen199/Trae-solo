import { db } from '../db/index.ts';
import { v4 as uuidv4 } from 'uuid';
import type { Transaction, Wallet } from '../../shared/types.ts';

const PLATFORM_USER_ID = 'platform';
const PLATFORM_FEE_RATE = 0.15;

export function getWallet(userId: string): Wallet | null {
  const row = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId) as any;
  if (!row) return null;
  return mapWallet(row);
}

export function ensureWallet(userId: string): Wallet {
  let wallet = getWallet(userId);
  if (!wallet) {
    const id = uuidv4();
    db.prepare('INSERT INTO wallets (id, user_id, balance) VALUES (?, ?, 0)').run(id, userId);
    wallet = getWallet(userId)!;
  }
  return wallet;
}

export function getTransactions(params: {
  page: number;
  pageSize: number;
  userId?: string;
  type?: string;
  status?: string;
}): { items: Transaction[]; total: number } {
  const { page, pageSize, userId, type, status } = params;
  const whereClauses: string[] = [];
  const values: any[] = [];

  if (userId) {
    whereClauses.push('(from_user_id = ? OR to_user_id = ?)');
    values.push(userId, userId);
  }
  if (type) {
    whereClauses.push('type = ?');
    values.push(type);
  }
  if (status) {
    whereClauses.push('status = ?');
    values.push(status);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const total = (db.prepare(`SELECT COUNT(*) as count FROM transactions ${whereSql}`).get(...values) as any).count;

  const rows = db.prepare(`
    SELECT * FROM transactions ${whereSql}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...values, pageSize, (page - 1) * pageSize) as any[];

  return { items: rows.map(mapTransaction), total };
}

export function createCoursePayment(userId: string, courseId: string, amount: number, creatorId: string): Transaction {
  const platformFee = amount * PLATFORM_FEE_RATE;
  const creatorAmount = amount - platformFee;
  const id = uuidv4();

  db.prepare('BEGIN').run();
  try {
    db.prepare(`
      INSERT INTO transactions (id, course_id, from_user_id, to_user_id, amount, platform_fee, type, status)
      VALUES (?, ?, ?, ?, ?, ?, 'course_purchase', 'success')
    `).run(id, courseId, userId, creatorId, creatorAmount, platformFee);

    const creatorWallet = ensureWallet(creatorId);
    db.prepare('UPDATE wallets SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(creatorAmount, creatorWallet.id);

    db.prepare('COMMIT').run();
  } catch (e) {
    db.prepare('ROLLBACK').run();
    throw e;
  }

  const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as any;
  return mapTransaction(row);
}

export function createServiceDepositPayment(userId: string, orderId: string, deposit: number, creatorId: string): Transaction {
  const id = uuidv4();

  db.prepare('BEGIN').run();
  try {
    db.prepare(`
      INSERT INTO transactions (id, order_id, from_user_id, to_user_id, amount, platform_fee, type, status)
      VALUES (?, ?, ?, ?, 0, 0, 'service_deposit', 'pending')
    `).run(id, orderId, userId, creatorId);

    const creatorWallet = ensureWallet(creatorId);
    db.prepare('UPDATE wallets SET frozen_balance = frozen_balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(deposit, creatorWallet.id);

    db.prepare('COMMIT').run();
  } catch (e) {
    db.prepare('ROLLBACK').run();
    throw e;
  }

  const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as any;
  return mapTransaction(row);
}

export function settleServicePayment(orderId: string, price: number, deposit: number, creatorId: string, requesterId: string): Transaction {
  const platformFee = price * PLATFORM_FEE_RATE;
  const creatorAmount = price - platformFee;
  const id = uuidv4();

  db.prepare('BEGIN').run();
  try {
    db.prepare(`
      INSERT INTO transactions (id, order_id, from_user_id, to_user_id, amount, platform_fee, type, status)
      VALUES (?, ?, ?, ?, ?, ?, 'service_final', 'success')
    `).run(id, orderId, requesterId, creatorId, creatorAmount, platformFee);

    const creatorWallet = ensureWallet(creatorId);
    db.prepare(`
      UPDATE wallets 
      SET balance = balance + ?, 
          frozen_balance = frozen_balance - ?,
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(creatorAmount, deposit, creatorWallet.id);

    db.prepare('COMMIT').run();
  } catch (e) {
    db.prepare('ROLLBACK').run();
    throw e;
  }

  const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as any;
  return mapTransaction(row);
}

export function withdraw(userId: string, amount: number): { success: boolean; message: string } {
  const wallet = getWallet(userId);
  if (!wallet) return { success: false, message: '钱包不存在' };
  if (wallet.balance < amount) return { success: false, message: '余额不足' };

  const id = uuidv4();

  db.prepare('BEGIN').run();
  try {
    db.prepare('UPDATE wallets SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(amount, userId);

    db.prepare(`
      INSERT INTO transactions (id, from_user_id, to_user_id, amount, platform_fee, type, status)
      VALUES (?, ?, ?, ?, 0, 'settlement', 'success')
    `).run(id, userId, PLATFORM_USER_ID, amount);

    db.prepare('COMMIT').run();
    return { success: true, message: '提现成功' };
  } catch (e) {
    db.prepare('ROLLBACK').run();
    return { success: false, message: '提现失败' };
  }
}

export function getSettlementSummary(userId: string, period = 'month') {
  const dateFilter = period === 'month' 
    ? "AND datetime(created_at) >= datetime('now', 'start of month')"
    : period === 'week' 
    ? "AND datetime(created_at) >= datetime('now', '-7 days')"
    : '';

  const totalEarnings = (db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM transactions 
    WHERE to_user_id = ? AND status = 'success' ${dateFilter}
  `).get(userId) as any).total;

  const totalFees = (db.prepare(`
    SELECT COALESCE(SUM(platform_fee), 0) as total 
    FROM transactions 
    WHERE to_user_id = ? AND status = 'success' ${dateFilter}
  `).get(userId) as any).total;

  const orderCount = (db.prepare(`
    SELECT COUNT(*) as count 
    FROM transactions 
    WHERE to_user_id = ? AND status = 'success' AND type IN ('service_final', 'course_purchase') ${dateFilter}
  `).get(userId) as any).count;

  const wallet = getWallet(userId);

  return {
    totalEarnings: totalEarnings || 0,
    totalFees: totalFees || 0,
    orderCount: orderCount || 0,
    availableBalance: wallet?.balance || 0,
    frozenBalance: wallet?.frozenBalance || 0,
  };
}

export function getPlatformFinanceSummary() {
  const totalRevenue = (db.prepare('SELECT COALESCE(SUM(platform_fee), 0) as total FROM transactions WHERE status = ?').get('success') as any).total;
  
  const totalTransactions = (db.prepare('SELECT COUNT(*) as count FROM transactions').get() as any).count;
  
  const todayRevenue = (db.prepare(`
    SELECT COALESCE(SUM(platform_fee), 0) as total 
    FROM transactions 
    WHERE status = 'success' AND date(created_at) = date('now')
  `).get() as any).total;

  const pendingSettlements = (db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM transactions 
    WHERE status = 'pending'
  `).get() as any).total;

  return {
    totalRevenue,
    totalTransactions,
    todayRevenue,
    pendingSettlements,
  };
}

function mapTransaction(row: any): Transaction {
  return {
    id: row.id,
    orderId: row.order_id || undefined,
    courseId: row.course_id || undefined,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    amount: row.amount,
    platformFee: row.platform_fee,
    type: row.type as Transaction['type'],
    status: row.status as Transaction['status'],
    createdAt: row.created_at,
  };
}

function mapWallet(row: any): Wallet {
  return {
    id: row.id,
    userId: row.user_id,
    balance: row.balance,
    frozenBalance: row.frozen_balance,
    updatedAt: row.updated_at,
  };
}
