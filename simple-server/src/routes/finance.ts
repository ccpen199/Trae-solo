import { Router } from 'express';
import { getDatabase } from '../database';
import { logger } from '../logger';
import { generateCode, buildPagination } from '../utils';
import { asyncHandler, AuthenticatedRequest, authMiddleware, permissionMiddleware } from '../middleware';
import { NotFoundError, BadRequestError } from '../errors';

export const financeRouter = Router();

financeRouter.use(authMiddleware);

financeRouter.get(
  '/balance',
  permissionMiddleware(['finance:balance:view']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.userId;
    const db = getDatabase();

    const account = db.prepare('SELECT * FROM accounts WHERE user_id = ?').get(userId);

    if (!account) {
      throw new NotFoundError('账户不存在');
    }

    const monthlyConsumption = db.prepare(`
      SELECT SUM(amount) as total
      FROM consumption_records
      WHERE user_id = ? AND created_at >= date('now', '-30 days')
    `).get(userId);

    const warnings = db.prepare(`
      SELECT * FROM balance_warnings
      WHERE user_id = ? AND notified = 0
      ORDER BY created_at DESC
      LIMIT 5
    `).all(userId);

    const response = {
      success: true,
      data: {
        balance: account.balance,
        freezeBalance: account.freeze_balance,
        totalUsed: account.total_used,
        creditLimit: account.credit_limit,
        balanceWarningThreshold: account.balance_warning_threshold,
        autoRechargeEnabled: account.auto_recharge_enabled === 1,
        autoRechargeAmount: account.auto_recharge_amount,
        autoRechargeTriggerAmount: account.auto_recharge_trigger_amount,
        monthlyConsumption: monthlyConsumption.total || 0,
        pendingWarnings: warnings,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

financeRouter.get(
  '/consumptions',
  permissionMiddleware(['finance:consumption:view']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const db = getDatabase();

    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM consumption_records WHERE user_id = ?
    `).get(userId);

    const total = countResult.total;
    const { offset, limit, totalPages } = buildPagination(page, pageSize, total);

    const records = db.prepare(`
      SELECT 
        cr.*, p.provider_name, t.template_name
      FROM consumption_records cr
      LEFT JOIN providers p ON cr.provider_id = p.id
      LEFT JOIN sms_templates t ON cr.template_id = t.id
      WHERE cr.user_id = ?
      ORDER BY cr.created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, limit, offset);

    const summary = db.prepare(`
      SELECT 
        COUNT(*) as count,
        SUM(amount) as totalAmount
      FROM consumption_records
      WHERE user_id = ?
    `).get(userId);

    const response = {
      success: true,
      data: {
        list: records.map((r: any) => ({
          id: r.id,
          recordCode: r.record_code,
          phoneNumber: r.phone_number,
          providerName: r.provider_name,
          templateName: r.template_name,
          price: r.price,
          amount: r.amount,
          balanceBefore: r.balance_before,
          balanceAfter: r.balance_after,
          status: r.status,
          createdAt: r.created_at,
        })),
        total,
        page,
        pageSize,
        totalPages,
        summary: {
          count: summary.count || 0,
          totalAmount: summary.totalAmount || 0,
        },
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

financeRouter.get(
  '/recharges',
  permissionMiddleware(['finance:balance:view']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const db = getDatabase();

    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM recharge_records WHERE user_id = ?
    `).get(userId);

    const total = countResult.total;
    const { offset, limit, totalPages } = buildPagination(page, pageSize, total);

    const records = db.prepare(`
      SELECT * FROM recharge_records
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, limit, offset);

    const response = {
      success: true,
      data: {
        list: records.map((r: any) => ({
          id: r.id,
          rechargeCode: r.recharge_code,
          amount: r.amount,
          paymentMethod: r.payment_method,
          status: r.status,
          isAutoRecharge: r.is_auto_recharge === 1,
          balanceBefore: r.balance_before,
          balanceAfter: r.balance_after,
          paidAt: r.paid_at,
          createdAt: r.created_at,
        })),
        total,
        page,
        pageSize,
        totalPages,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

financeRouter.post(
  '/recharge',
  permissionMiddleware(['finance:recharge']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.userId;
    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      throw new BadRequestError('充值金额必须大于0');
    }

    const db = getDatabase();

    const account = db.prepare('SELECT * FROM accounts WHERE user_id = ?').get(userId);
    if (!account) {
      throw new NotFoundError('账户不存在');
    }

    const rechargeCode = generateCode('REC');

    db.prepare(`
      INSERT INTO recharge_records (
        recharge_code, user_id, amount, payment_method, status, is_auto_recharge, balance_before, created_at
      ) VALUES (?, ?, ?, ?, 0, 0, ?, datetime('now'))
    `).run(rechargeCode, userId, amount, paymentMethod || 'manual', account.balance);

    const balanceBefore = account.balance;
    const balanceAfter = balanceBefore + amount;

    db.prepare(`
      UPDATE accounts SET balance = ? WHERE user_id = ?
    `).run(balanceAfter, userId);

    db.prepare(`
      UPDATE recharge_records 
      SET status = 1, paid_at = datetime('now'), balance_after = ?
      WHERE recharge_code = ?
    `).run(balanceAfter, rechargeCode);

    const response = {
      success: true,
      data: {
        rechargeCode,
        amount,
        previousBalance: balanceBefore,
        newBalance: balanceAfter,
        message: '充值成功',
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

financeRouter.get(
  '/reports/monthly',
  permissionMiddleware(['finance:view']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.userId;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || (new Date().getMonth() + 1);

    const db = getDatabase();

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = month === 12 
      ? `${year + 1}-01-01` 
      : `${year}-${String(month + 1).padStart(2, '0')}-01`;

    const monthlySummary = db.prepare(`
      SELECT 
        COUNT(*) as totalCount,
        SUM(amount) as totalAmount
      FROM consumption_records
      WHERE user_id = ? AND created_at >= ? AND created_at < ?
    `).get(userId, startDate, endDate);

    const dailyStats = db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        SUM(amount) as totalAmount
      FROM consumption_records
      WHERE user_id = ? AND created_at >= ? AND created_at < ?
      GROUP BY DATE(created_at)
      ORDER BY date
    `).all(userId, startDate, endDate);

    const templateStats = db.prepare(`
      SELECT 
        t.template_name,
        COUNT(cr.id) as count,
        SUM(cr.amount) as totalAmount
      FROM consumption_records cr
      LEFT JOIN sms_templates t ON cr.template_id = t.id
      WHERE cr.user_id = ? AND cr.created_at >= ? AND cr.created_at < ?
      GROUP BY t.id, t.template_name
      ORDER BY totalAmount DESC
    `).all(userId, startDate, endDate);

    const providerStats = db.prepare(`
      SELECT 
        p.provider_name,
        COUNT(cr.id) as count,
        SUM(cr.amount) as totalAmount
      FROM consumption_records cr
      LEFT JOIN providers p ON cr.provider_id = p.id
      WHERE cr.user_id = ? AND cr.created_at >= ? AND cr.created_at < ?
      GROUP BY p.id, p.provider_name
      ORDER BY totalAmount DESC
    `).all(userId, startDate, endDate);

    const response = {
      success: true,
      data: {
        year,
        month,
        summary: {
          totalCount: monthlySummary.totalCount || 0,
          totalAmount: monthlySummary.totalAmount || 0,
        },
        dailyStats,
        templateStats,
        providerStats,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

financeRouter.get(
  '/warnings',
  permissionMiddleware(['finance:view']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const db = getDatabase();

    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM balance_warnings WHERE user_id = ?
    `).get(userId);

    const total = countResult.total;
    const { offset, limit, totalPages } = buildPagination(page, pageSize, total);

    const warnings = db.prepare(`
      SELECT * FROM balance_warnings
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, limit, offset);

    const response = {
      success: true,
      data: {
        list: warnings,
        total,
        page,
        pageSize,
        totalPages,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

financeRouter.put(
  '/auto-recharge',
  permissionMiddleware(['finance:recharge']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.userId;
    const { enabled, amount, triggerAmount } = req.body;

    const db = getDatabase();

    const account = db.prepare('SELECT * FROM accounts WHERE user_id = ?').get(userId);

    if (!account) {
      throw new NotFoundError('账户不存在');
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (enabled !== undefined) {
      updates.push('auto_recharge_enabled = ?');
      params.push(enabled ? 1 : 0);
    }
    if (amount !== undefined) {
      updates.push('auto_recharge_amount = ?');
      params.push(amount);
    }
    if (triggerAmount !== undefined) {
      updates.push('auto_recharge_trigger_amount = ?');
      params.push(triggerAmount);
    }

    if (updates.length > 0) {
      params.push(userId);
      db.prepare(`
        UPDATE accounts SET ${updates.join(', ')} WHERE user_id = ?
      `).run(...params);
    }

    const response = {
      success: true,
      data: {
        message: '自动充值配置已更新',
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);
