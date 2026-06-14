import { db } from '../db/index.js';
import { getTodayString } from '../utils/index.js';

export interface CoinRecord {
  id: string;
  userId: string;
  amount: number;
  type: 'income' | 'expense';
  source: string;
  description: string;
  createdAt: string;
}

export interface WalletStatistics {
  todayIncome: number;
  todayExpense: number;
  weekIncome: number;
  monthIncome: number;
  totalIncome: number;
  totalExpense: number;
}

function rowToCoinRecord(row: any): CoinRecord {
  return {
    id: row.id,
    userId: row.user_id,
    amount: parseFloat(row.amount),
    type: row.type,
    source: row.source,
    description: row.description,
    createdAt: row.created_at,
  };
}

export function getCoinRecords(
  userId: string,
  type?: 'income' | 'expense',
  page: number = 1,
  pageSize: number = 20
): { records: CoinRecord[]; total: number } {
  let sql = 'SELECT * FROM coin_records WHERE user_id = ?';
  const params: any[] = [userId];

  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(pageSize, (page - 1) * pageSize);

  const rows = db.prepare(sql).all(...params) as any[];

  let countSql = 'SELECT COUNT(*) as count FROM coin_records WHERE user_id = ?';
  const countParams: any[] = [userId];
  if (type) {
    countSql += ' AND type = ?';
    countParams.push(type);
  }
  const total = db.prepare(countSql).get(...countParams) as { count: number };

  return {
    records: rows.map(rowToCoinRecord),
    total: total.count,
  };
}

export function getWalletStatistics(userId: string): WalletStatistics {
  const today = getTodayString();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];

  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const monthAgoStr = monthAgo.toISOString().split('T')[0];

  const getAmount = (sql: string, params: any[] = []): number => {
    const row = db.prepare(sql).get(...params) as { total: number };
    return row ? (row.total || 0) : 0;
  };

  const todayIncome = getAmount(
    "SELECT COALESCE(SUM(amount), 0) as total FROM coin_records WHERE user_id = ? AND type = 'income' AND DATE(created_at) = ?",
    [userId, today]
  );

  const todayExpense = getAmount(
    "SELECT COALESCE(SUM(amount), 0) as total FROM coin_records WHERE user_id = ? AND type = 'expense' AND DATE(created_at) = ?",
    [userId, today]
  );

  const weekIncome = getAmount(
    "SELECT COALESCE(SUM(amount), 0) as total FROM coin_records WHERE user_id = ? AND type = 'income' AND DATE(created_at) >= ?",
    [userId, weekAgoStr]
  );

  const monthIncome = getAmount(
    "SELECT COALESCE(SUM(amount), 0) as total FROM coin_records WHERE user_id = ? AND type = 'income' AND DATE(created_at) >= ?",
    [userId, monthAgoStr]
  );

  const totalIncome = getAmount(
    "SELECT COALESCE(SUM(amount), 0) as total FROM coin_records WHERE user_id = ? AND type = 'income'",
    [userId]
  );

  const totalExpense = getAmount(
    "SELECT COALESCE(SUM(amount), 0) as total FROM coin_records WHERE user_id = ? AND type = 'expense'",
    [userId]
  );

  return {
    todayIncome,
    todayExpense,
    weekIncome,
    monthIncome,
    totalIncome,
    totalExpense,
  };
}
