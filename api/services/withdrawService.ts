import { db } from '../db/index.js';
import { generateId, getTodayString, SINGLE_WITHDRAW_MIN, SINGLE_WITHDRAW_MAX, DAILY_WITHDRAW_LIMIT } from '../utils/index.js';
import { getUserById, deductCoins } from './authService.js';

export interface WithdrawRecord {
  id: string;
  userId: string;
  amount: number;
  method: 'alipay' | 'wechat' | 'bank';
  account: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  createdAt: string;
}

function rowToWithdrawRecord(row: any): WithdrawRecord {
  return {
    id: row.id,
    userId: row.user_id,
    amount: parseFloat(row.amount),
    method: row.method,
    account: row.account,
    status: row.status,
    reason: row.reason || undefined,
    createdAt: row.created_at,
  };
}

export function getWithdrawRecords(
  userId: string,
  page: number = 1,
  pageSize: number = 20
): { records: WithdrawRecord[]; total: number } {
  const rows = db.prepare(`
    SELECT * FROM withdraw_records 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `).all(userId, pageSize, (page - 1) * pageSize) as any[];

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM withdraw_records WHERE user_id = ?
  `).get(userId) as { count: number };

  return {
    records: rows.map(rowToWithdrawRecord),
    total: total.count,
  };
}

export function getTodayWithdrawAmount(userId: string): number {
  const today = getTodayString();
  const row = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM withdraw_records 
    WHERE user_id = ? AND DATE(created_at) = ? AND status != 'rejected'
  `).get(userId, today) as { total: number };

  return row.total || 0;
}

export function applyWithdraw(
  userId: string,
  amount: number,
  method: 'alipay' | 'wechat' | 'bank'
): {
  success: boolean;
  record?: WithdrawRecord;
  message?: string;
} {
  const user = getUserById(userId);
  if (!user) {
    return { success: false, message: '用户不存在' };
  }

  if (!user.isVerified) {
    return { success: false, message: '请先完成实名认证' };
  }

  if (amount < SINGLE_WITHDRAW_MIN) {
    return { success: false, message: `最低提现金额为 ${SINGLE_WITHDRAW_MIN} 金币` };
  }

  if (amount > SINGLE_WITHDRAW_MAX) {
    return { success: false, message: `单次提现上限为 ${SINGLE_WITHDRAW_MAX} 金币` };
  }

  const todayAmount = getTodayWithdrawAmount(userId);
  if (todayAmount + amount > DAILY_WITHDRAW_LIMIT) {
    return { success: false, message: `今日已提现 ${todayAmount} 金币，单日提现上限为 ${DAILY_WITHDRAW_LIMIT} 金币` };
  }

  if (user.coins < amount) {
    return { success: false, message: '金币余额不足' };
  }

  let account = '';
  if (method === 'alipay') {
    account = user.alipayAccount || '';
  } else if (method === 'wechat') {
    account = user.wechatAccount || '';
  } else if (method === 'bank') {
    account = user.bankCard || '';
  }

  if (!account) {
    return { success: false, message: '请先绑定提现账户' };
  }

  const success = deductCoins(userId, amount, 'withdraw', `提现-${method === 'alipay' ? '支付宝' : method === 'wechat' ? '微信' : '银行卡'}`);

  if (!success) {
    return { success: false, message: '提现申请失败，请稍后重试' };
  }

  const recordId = generateId('wd-');
  db.prepare(`
    INSERT INTO withdraw_records (id, user_id, amount, method, account, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `).run(recordId, userId, amount, method, account);

  const row = db.prepare('SELECT * FROM withdraw_records WHERE id = ?').get(recordId) as any;

  return {
    success: true,
    record: rowToWithdrawRecord(row),
  };
}

export function getWithdrawMethods(): {
  id: string;
  name: string;
  icon: string;
  minAmount: number;
  maxAmount: number;
}[] {
  return [
    { id: 'alipay', name: '支付宝', icon: 'alipay', minAmount: SINGLE_WITHDRAW_MIN, maxAmount: SINGLE_WITHDRAW_MAX },
    { id: 'wechat', name: '微信支付', icon: 'wechat', minAmount: SINGLE_WITHDRAW_MIN, maxAmount: SINGLE_WITHDRAW_MAX },
    { id: 'bank', name: '银行卡', icon: 'bank', minAmount: SINGLE_WITHDRAW_MIN, maxAmount: SINGLE_WITHDRAW_MAX },
  ];
}
