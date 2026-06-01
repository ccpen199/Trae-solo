import type { DashboardSummary, TrendPoint, AssetStructureItem, MonthlyReview } from '@shared/types';
import { getDatabase } from '../config/database';
import { AccountTypeLabels } from '@shared/types';

export class DashboardRepository {
  private db = getDatabase();

  getSummary(userId: number): DashboardSummary {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const assetsResult = this.db.prepare(`
      SELECT COALESCE(SUM(v.market_value), 0) as total
      FROM accounts a
      JOIN valuations v ON v.account_id = a.id
      WHERE a.user_id = ? AND a.category = 'asset' AND a.is_active = 1
        AND v.id = (SELECT id FROM valuations WHERE account_id = a.id ORDER BY valuation_date DESC, id DESC LIMIT 1)
    `).get(userId) as { total: number } | undefined;

    const liabilitiesResult = this.db.prepare(`
      SELECT COALESCE(SUM(v.market_value), 0) as total
      FROM accounts a
      JOIN valuations v ON v.account_id = a.id
      WHERE a.user_id = ? AND a.category = 'liability' AND a.is_active = 1
        AND v.id = (SELECT id FROM valuations WHERE account_id = a.id ORDER BY valuation_date DESC, id DESC LIMIT 1)
    `).get(userId) as { total: number } | undefined;

    const incomeResult = this.db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM transactions 
      WHERE user_id = ? AND type = 'income' AND transaction_date BETWEEN ? AND ?
    `).get(userId, startDate, endDate) as { total: number } | undefined;

    const expenseResult = this.db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM transactions 
      WHERE user_id = ? AND type = 'expense' AND transaction_date BETWEEN ? AND ?
    `).get(userId, startDate, endDate) as { total: number } | undefined;

    const totalAssets = assetsResult?.total || 0;
    const totalLiabilities = liabilitiesResult?.total || 0;
    const netWorth = totalAssets - totalLiabilities;
    const debtRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
    const monthlyIncome = incomeResult?.total || 0;
    const monthlyExpense = expenseResult?.total || 0;
    const monthlyCashFlow = monthlyIncome - monthlyExpense;
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100 : 0;

    return {
      totalAssets,
      totalLiabilities,
      netWorth,
      debtRatio,
      monthlyIncome,
      monthlyExpense,
      monthlyCashFlow,
      savingsRate,
    };
  }

  getTrend(userId: number, months: number = 12): TrendPoint[] {
    const result: TrendPoint[] = [];
    const today = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;

      const assetsResult = this.db.prepare<{ total: number }, [number, string]>(`
        SELECT COALESCE(SUM(v.market_value), 0) as total
        FROM accounts a
        JOIN valuations v ON v.account_id = a.id
        WHERE a.user_id = ? AND a.category = 'asset' AND a.is_active = 1
          AND v.valuation_date <= ?
          AND v.id = (SELECT id FROM valuations WHERE account_id = a.id AND valuation_date <= ? ORDER BY valuation_date DESC, id DESC LIMIT 1)
      `).get(userId, endDate, endDate);

      const liabilitiesResult = this.db.prepare<{ total: number }, [number, string]>(`
        SELECT COALESCE(SUM(v.market_value), 0) as total
        FROM accounts a
        JOIN valuations v ON v.account_id = a.id
        WHERE a.user_id = ? AND a.category = 'liability' AND a.is_active = 1
          AND v.valuation_date <= ?
          AND v.id = (SELECT id FROM valuations WHERE account_id = a.id AND valuation_date <= ? ORDER BY valuation_date DESC, id DESC LIMIT 1)
      `).get(userId, endDate, endDate);

      const assets = assetsResult?.total || 0;
      const liabilities = liabilitiesResult?.total || 0;

      result.push({
        date: `${year}-${String(month).padStart(2, '0')}`,
        assets,
        liabilities,
        netWorth: assets - liabilities,
      });
    }

    return result;
  }

  getStructure(userId: number): AssetStructureItem[] {
    const rows = this.db.prepare<{ type: string; total: number }, [number]>(`
      SELECT a.type, COALESCE(SUM(v.market_value), 0) as total
      FROM accounts a
      LEFT JOIN valuations v ON v.account_id = a.id
      WHERE a.user_id = ? AND a.category = 'asset' AND a.is_active = 1
        AND v.id = (SELECT id FROM valuations WHERE account_id = a.id ORDER BY valuation_date DESC, id DESC LIMIT 1)
      GROUP BY a.type
      ORDER BY total DESC
    `).all(userId);

    const totalAssets = rows.reduce((sum, r) => sum + r.total, 0);
    const colors = ['#10B981', '#0EA5E9', '#F59E0B', '#F43F5E', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

    return rows.map((row, index) => ({
      type: row.type,
      name: AccountTypeLabels[row.type as keyof typeof AccountTypeLabels] || row.type,
      value: row.total,
      percentage: totalAssets > 0 ? (row.total / totalAssets) * 100 : 0,
      color: colors[index % colors.length],
    })).filter(item => item.value > 0);
  }

  getMonthlyReview(userId: number, year: number, month: number): MonthlyReview {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
    const prevMonthEnd = new Date(year, month - 1, 0);
    const prevYear = prevMonthEnd.getFullYear();
    const prevMonth = prevMonthEnd.getMonth() + 1;
    const prevEndDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${prevMonthEnd.getDate()}`;

    const currentSummary = this.getSummaryForDate(userId, endDate);
    const prevSummary = this.getSummaryForDate(userId, prevEndDate);
    
    const transactions = this.db.prepare<{ category: string; type: string; total: number }, [number, string, string]>(`
      SELECT category, type, COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = ? AND transaction_date BETWEEN ? AND ?
      GROUP BY category, type
      ORDER BY total DESC
    `).all(userId, startDate, endDate);

    const incomes = transactions.filter(t => t.type === 'income');
    const expenses = transactions.filter(t => t.type === 'expense');
    
    const totalIncome = incomes.reduce((sum, t) => sum + t.total, 0);
    const totalExpense = expenses.reduce((sum, t) => sum + t.total, 0);
    
    const avgExpense = expenses.length > 0 ? totalExpense / expenses.length : 0;
    const threshold = avgExpense * 1.5;
    const abnormalExpenses = expenses
      .filter(e => e.total > threshold)
      .map(e => ({
        category: e.category,
        amount: e.total,
        threshold,
        percentage: totalExpense > 0 ? (e.total / totalExpense) * 100 : 0,
      }));

    const changeReasons: string[] = [];
    const netWorthChange = currentSummary.netWorth - prevSummary.netWorth;
    const netWorthChangePercent = prevSummary.netWorth > 0 ? (netWorthChange / prevSummary.netWorth) * 100 : 0;

    if (netWorthChange > 0) {
      changeReasons.push(`本月净资产增加 ¥${netWorthChange.toLocaleString()}`);
      if (totalIncome > totalExpense) {
        changeReasons.push(`现金流正向，月度结余 ¥${(totalIncome - totalExpense).toLocaleString()}`);
      }
    } else if (netWorthChange < 0) {
      changeReasons.push(`本月净资产减少 ¥${Math.abs(netWorthChange).toLocaleString()}`);
      if (totalExpense > totalIncome) {
        changeReasons.push(`支出超过收入 ¥${(totalExpense - totalIncome).toLocaleString()}`);
      }
    }

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
    const nextActions: string[] = [];

    if (savingsRate < 20) {
      nextActions.push('建议提高储蓄率，目标至少20%');
    }
    if (currentSummary.debtRatio > 50) {
      nextActions.push('负债率偏高，建议优化债务结构');
    }
    if (abnormalExpenses.length > 0) {
      nextActions.push(`发现 ${abnormalExpenses.length} 项异常支出，建议关注`);
    }
    if (nextActions.length === 0) {
      nextActions.push('财务状况良好，继续保持');
    }

    return {
      year,
      month,
      netWorthChange,
      netWorthChangePercent,
      changeReasons,
      abnormalExpenses,
      debtPlan: {
        current: currentSummary.totalLiabilities,
        target: currentSummary.totalLiabilities * 0.9,
        progress: 10,
      },
      savingsRate,
      topExpenses: expenses.slice(0, 5).map(e => ({
        category: e.category,
        amount: e.total,
        percentage: totalExpense > 0 ? (e.total / totalExpense) * 100 : 0,
      })),
      topIncomes: incomes.slice(0, 5).map(i => ({
        category: i.category,
        amount: i.total,
        percentage: totalIncome > 0 ? (i.total / totalIncome) * 100 : 0,
      })),
      nextActions,
    };
  }

  private getSummaryForDate(userId: number, date: string): { totalAssets: number; totalLiabilities: number; netWorth: number; debtRatio: number } {
    const assetsResult = this.db.prepare<{ total: number }, [number, string]>(`
      SELECT COALESCE(SUM(v.market_value), 0) as total
      FROM accounts a
      JOIN valuations v ON v.account_id = a.id
      WHERE a.user_id = ? AND a.category = 'asset' AND a.is_active = 1
        AND v.valuation_date <= ?
        AND v.id = (SELECT id FROM valuations WHERE account_id = a.id AND valuation_date <= ? ORDER BY valuation_date DESC, id DESC LIMIT 1)
    `).get(userId, date, date);

    const liabilitiesResult = this.db.prepare<{ total: number }, [number, string]>(`
      SELECT COALESCE(SUM(v.market_value), 0) as total
      FROM accounts a
      JOIN valuations v ON v.account_id = a.id
      WHERE a.user_id = ? AND a.category = 'liability' AND a.is_active = 1
        AND v.valuation_date <= ?
        AND v.id = (SELECT id FROM valuations WHERE account_id = a.id AND valuation_date <= ? ORDER BY valuation_date DESC, id DESC LIMIT 1)
    `).get(userId, date, date);

    const totalAssets = assetsResult?.total || 0;
    const totalLiabilities = liabilitiesResult?.total || 0;
    const netWorth = totalAssets - totalLiabilities;
    const debtRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;

    return { totalAssets, totalLiabilities, netWorth, debtRatio };
  }

  getAdminStats() {
    const userCount = this.db.prepare<{ count: number }>('SELECT COUNT(*) as count FROM users').get()?.count || 0;
    const accountCount = this.db.prepare<{ count: number }>('SELECT COUNT(*) as count FROM accounts').get()?.count || 0;
    const transactionCount = this.db.prepare<{ count: number }>('SELECT COUNT(*) as count FROM transactions').get()?.count || 0;
    const valuationCount = this.db.prepare<{ count: number }>('SELECT COUNT(*) as count FROM valuations').get()?.count || 0;

    return {
      userCount,
      accountCount,
      transactionCount,
      valuationCount,
    };
  }

  getOperationLogs(page: number = 1, pageSize: number = 50) {
    const offset = (page - 1) * pageSize;
    
    const countResult = this.db.prepare<{ count: number }>('SELECT COUNT(*) as count FROM operation_logs').get();
    const total = countResult?.count || 0;

    const rows = this.db.prepare<{
      id: number;
      user_id: number | null;
      action: string;
      resource_type: string;
      resource_id: number | null;
      details: string | null;
      ip_address: string | null;
      created_at: string;
      username: string | null;
    }>(`
      SELECT o.*, u.username
      FROM operation_logs o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `).all(pageSize, offset);

    const items = rows.map(row => ({
      id: row.id,
      userId: row.user_id || undefined,
      username: row.username || undefined,
      action: row.action,
      resourceType: row.resource_type,
      resourceId: row.resource_id || undefined,
      details: row.details || undefined,
      ipAddress: row.ip_address || undefined,
      createdAt: row.created_at,
    }));

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
