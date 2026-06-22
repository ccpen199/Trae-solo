import { Router, type Response } from 'express';
import type { ApiResponse, AccountBalance, ConsumptionRecord, AccountStatistics, PaginationParams, PaginationResponse } from '@shared/types';
import { getDb } from '../models/db.js';
import { type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/balance', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id || 'user_001';
  const db = getDb();
  
  const account = db.prepare('SELECT * FROM accounts WHERE user_id = ?').get(userId) as any;
  
  if (!account) {
    const response: ApiResponse<null> = {
      code: 404,
      message: '账户信息不存在',
      data: null
    };
    res.status(404).json(response);
    return;
  }
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const monthStart = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
  const monthEnd = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
  
  const monthlyConsumption = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM consumption_records 
    WHERE user_id = ? AND date >= ? AND date <= ?
  `).get(userId, monthStart, monthEnd) as { total: number };
  
  const yearStart = new Date(currentYear, 0, 1).toISOString().split('T')[0];
  const annualConsumption = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM consumption_records 
    WHERE user_id = ? AND date >= ?
  `).get(userId, yearStart) as { total: number };
  
  const balance: AccountBalance = {
    personalAccount: account.personal_balance,
    overallAccount: account.overall_balance,
    annualConsumption: annualConsumption.total,
    monthlyConsumption: monthlyConsumption.total,
    lastUpdated: account.last_updated
  };
  
  const response: ApiResponse<AccountBalance> = {
    code: 0,
    message: '获取成功',
    data: balance
  };
  
  res.json(response);
});

router.get('/records', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id || 'user_001';
  const db = getDb();
  
  const { page = 1, pageSize = 10, type, startDate, endDate } = req.query as PaginationParams & {
    type?: string;
    startDate?: string;
    endDate?: string;
  };
  
  let sql = 'SELECT * FROM consumption_records WHERE user_id = ?';
  const params: any[] = [userId];
  
  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  
  if (startDate) {
    sql += ' AND date >= ?';
    params.push(startDate);
  }
  
  if (endDate) {
    sql += ' AND date <= ?';
    params.push(endDate);
  }
  
  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
  const totalResult = db.prepare(countSql).get(...params) as { count: number };
  const total = totalResult.count;
  
  sql += ' ORDER BY date DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
  
  const records = db.prepare(sql).all(...params) as any[];
  
  const formattedRecords: ConsumptionRecord[] = records.map(r => ({
    id: r.id,
    date: r.date,
    type: r.type as 'hospital' | 'pharmacy' | 'drug',
    merchantName: r.merchant_name,
    amount: r.amount,
    personalPay: r.personal_pay,
    overallPay: r.overall_pay,
    category: r.category,
    details: JSON.parse(r.details || '[]')
  }));
  
  const response: ApiResponse<PaginationResponse<ConsumptionRecord>> = {
    code: 0,
    message: '获取成功',
    data: {
      list: formattedRecords,
      total,
      page: Number(page),
      pageSize: Number(pageSize)
    }
  };
  
  res.json(response);
});

router.get('/records/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id || 'user_001';
  const { id } = req.params;
  const db = getDb();
  
  const record = db.prepare('SELECT * FROM consumption_records WHERE id = ? AND user_id = ?').get(id, userId) as any;
  
  if (!record) {
    const response: ApiResponse<null> = {
      code: 404,
      message: '消费记录不存在',
      data: null
    };
    res.status(404).json(response);
    return;
  }
  
  const formattedRecord: ConsumptionRecord = {
    id: record.id,
    date: record.date,
    type: record.type as 'hospital' | 'pharmacy' | 'drug',
    merchantName: record.merchant_name,
    amount: record.amount,
    personalPay: record.personal_pay,
    overallPay: record.overall_pay,
    category: record.category,
    details: JSON.parse(record.details || '[]')
  };
  
  const response: ApiResponse<ConsumptionRecord> = {
    code: 0,
    message: '获取成功',
    data: formattedRecord
  };
  
  res.json(response);
});

router.get('/statistics', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id || 'user_001';
  const db = getDb();
  
  const now = new Date();
  const currentYear = now.getFullYear();
  
  const monthlyData = [];
  for (let i = 0; i < 12; i++) {
    const monthStart = new Date(currentYear, i, 1).toISOString().split('T')[0];
    const monthEnd = new Date(currentYear, i + 1, 0).toISOString().split('T')[0];
    
    const result = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM consumption_records 
      WHERE user_id = ? AND date >= ? AND date <= ?
    `).get(userId, monthStart, monthEnd) as { total: number };
    
    monthlyData.push({
      month: `${currentYear}-${String(i + 1).padStart(2, '0')}`,
      amount: result.total
    });
  }
  
  const categoryResults = db.prepare(`
    SELECT category, COALESCE(SUM(amount), 0) as total 
    FROM consumption_records 
    WHERE user_id = ? AND date >= ?
    GROUP BY category
    ORDER BY total DESC
  `).all(userId, `${currentYear}-01-01`) as { category: string; total: number }[];
  
  const annualTotal = categoryResults.reduce((sum, c) => sum + c.total, 0);
  
  const categoryData = categoryResults.map(c => ({
    category: c.category,
    amount: c.total,
    percentage: annualTotal > 0 ? Math.round((c.total / annualTotal) * 10000) / 100 : 0
  }));
  
  const statistics: AccountStatistics = {
    monthlyData,
    categoryData
  };
  
  const response: ApiResponse<AccountStatistics> = {
    code: 0,
    message: '获取成功',
    data: statistics
  };
  
  res.json(response);
});

export default router;
