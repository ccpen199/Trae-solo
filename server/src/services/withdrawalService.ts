import { getDB } from '../models/database';
import { config } from '../config';
import { evaluateWithdrawalRisk } from './riskService';
import dayjs from 'dayjs';

export function createWithdrawal(userId: number, amount: number, channel: string = 'wechat') {
  const db = getDB();

  if (amount < 1) throw new Error('最低提现金额为1元');
  if (amount > 100) throw new Error('单日最高提现100元');

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) throw new Error('用户不存在');
  if (user.cash_balance < amount) throw new Error('余额不足');

  const todayWithdrawal = (db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM withdrawals
    WHERE user_id = ? AND date(created_at) = date('now') AND status != 'failed'
  `).get(userId) as any).total;

  if (todayWithdrawal + amount > 100) {
    throw new Error('今日提现金额已达上限');
  }

  const risk = evaluateWithdrawalRisk(user, amount);

  const actualAmount = amount;
  const fee = 0;

  const stmt = db.prepare(`
    INSERT INTO withdrawals (user_id, amount, fee, actual_amount, status, channel,
      wx_openid, risk_level, risk_reason)
    VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?)
  `);

  const result = stmt.run(
    userId,
    amount,
    fee,
    actualAmount,
    channel,
    user.openid || null,
    risk.level,
    risk.reason,
  );

  db.prepare('UPDATE users SET cash_balance = cash_balance - ? WHERE id = ?').run(amount, userId);

  db.prepare(`
    INSERT INTO cash_records (user_id, change, balance_after, type, description)
    VALUES (?, -?, ?, 'withdraw', ?)
  `).run(userId, amount, user.cash_balance - amount, `申请提现${amount}元`);

  if (risk.level === 'low') {
    processWithdrawal(result.lastInsertRowid as number);
  }

  return {
    id: result.lastInsertRowid,
    amount,
    actualAmount,
    status: risk.level === 'low' ? 'processing' : 'pending',
    riskLevel: risk.level,
  };
}

function processWithdrawal(withdrawalId: number) {
  const db = getDB();
  const withdrawal = db.prepare('SELECT * FROM withdrawals WHERE id = ?').get(withdrawalId) as any;
  if (!withdrawal) return;

  const transactionId = 'wx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

  db.prepare(`
    UPDATE withdrawals SET status = 'success', transaction_id = ?, paid_at = datetime('now')
    WHERE id = ?
  `).run(transactionId, withdrawalId);
}

export function getWithdrawalList(userId: number, page: number = 1, pageSize: number = 20) {
  const db = getDB();
  const offset = (page - 1) * pageSize;

  const list = db.prepare(`
    SELECT * FROM withdrawals WHERE user_id = ?
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(userId, pageSize, offset);

  const total = (db.prepare('SELECT COUNT(*) as count FROM withdrawals WHERE user_id = ?').get(userId) as any).count;

  return { list, total, page, pageSize };
}

export function getWithdrawalDetail(id: number, userId?: number) {
  const db = getDB();
  let query = 'SELECT * FROM withdrawals WHERE id = ?';
  const params: any[] = [id];
  if (userId) {
    query += ' AND user_id = ?';
    params.push(userId);
  }
  return db.prepare(query).get(...params);
}

export function getAdminWithdrawalList(status?: string, page: number = 1, pageSize: number = 20) {
  const db = getDB();
  const offset = (page - 1) * pageSize;

  let query = 'SELECT w.*, u.nickname, u.phone FROM withdrawals w JOIN users u ON w.user_id = u.id';
  let countQuery = 'SELECT COUNT(*) as count FROM withdrawals';
  const params: any[] = [];

  if (status) {
    query += ' WHERE w.status = ?';
    countQuery += ' WHERE status = ?';
    params.push(status);
  }

  query += ' ORDER BY w.created_at DESC LIMIT ? OFFSET ?';

  const list = db.prepare(query).all(...params, pageSize, offset);
  const total = (db.prepare(countQuery).get(...(status ? [status] : [])) as any).count;

  return { list, total, page, pageSize };
}

export function auditWithdrawal(id: number, status: 'success' | 'failed', reason?: string, auditor?: string) {
  const db = getDB();
  const withdrawal = db.prepare('SELECT * FROM withdrawals WHERE id = ?').get(id) as any;
  if (!withdrawal) throw new Error('提现记录不存在');
  if (withdrawal.status !== 'pending') throw new Error('当前状态不可审核');

  if (status === 'success') {
    const transactionId = 'wx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    db.prepare(`
      UPDATE withdrawals SET status = 'success', transaction_id = ?, paid_at = datetime('now'),
        audited_at = datetime('now'), auditor = ?
      WHERE id = ?
    `).run(transactionId, auditor || 'system', id);
  } else {
    db.prepare(`
      UPDATE withdrawals SET status = 'failed', failed_reason = ?,
        audited_at = datetime('now'), auditor = ?
      WHERE id = ?
    `).run(reason || '', auditor || 'system', id);

    db.prepare('UPDATE users SET cash_balance = cash_balance + ? WHERE id = ?')
      .run(withdrawal.amount, withdrawal.user_id);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(withdrawal.user_id) as any;
    db.prepare(`
      INSERT INTO cash_records (user_id, change, balance_after, type, description)
      VALUES (?, ?, ?, 'withdraw_refund', ?)
    `).run(withdrawal.user_id, withdrawal.amount, user.cash_balance, '提失败退款');
  }

  return db.prepare('SELECT * FROM withdrawals WHERE id = ?').get(id);
}
