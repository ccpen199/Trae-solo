import express, { Application, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, logger, errorHandler, notFoundHandler, requestLogger, authMiddleware, asyncHandler, AuthenticatedRequest, query, execute, generateCode, ApiResponse, buildPagination, InsufficientBalanceError } from '@sms-platform/shared';
import * as net from 'net';

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

const financeRouter = Router();

financeRouter.get(
  '/balance',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.userId;

    const accounts = await query(`
      SELECT * FROM accounts WHERE user_id = ?
    `, [userId]);

    if (accounts.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ACCOUNT_NOT_FOUND',
          message: '账户不存在',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(response);
      return;
    }

    const account = accounts[0];

    const recentConsumptions = await query(`
      SELECT SUM(amount) as total
      FROM consumption_records
      WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `, [userId]);

    const monthlyConsumption = recentConsumptions[0].total || 0;

    const warnings = await query(`
      SELECT * FROM balance_warnings
      WHERE user_id = ? AND notified = 0
      ORDER BY created_at DESC
      LIMIT 5
    `, [userId]);

    const response: ApiResponse = {
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
        monthlyConsumption,
        pendingWarnings: warnings,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

financeRouter.get(
  '/consumptions',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const startTime = req.query.startTime as string;
    const endTime = req.query.endTime as string;

    let whereConditions: string[] = ['user_id = ?'];
    let params: any[] = [userId];

    if (startTime) {
      whereConditions.push('created_at >= ?');
      params.push(new Date(startTime));
    }

    if (endTime) {
      whereConditions.push('created_at <= ?');
      params.push(new Date(endTime));
    }

    const whereClause = whereConditions.join(' AND ');

    const countResult = await query(`
      SELECT COUNT(*) as total FROM consumption_records WHERE ${whereClause}
    `, params);

    const total = countResult[0].total;
    const { offset, limit, totalPages } = buildPagination(page, pageSize, total);

    const records = await query(`
      SELECT 
        cr.*, p.provider_name, t.template_name
      FROM consumption_records cr
      LEFT JOIN providers p ON cr.provider_id = p.id
      LEFT JOIN sms_templates t ON cr.template_id = t.id
      WHERE ${whereClause}
      ORDER BY cr.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    const summary = await query(`
      SELECT 
        COUNT(*) as count,
        SUM(amount) as totalAmount
      FROM consumption_records
      WHERE ${whereClause}
    `, params);

    const response: ApiResponse = {
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
          count: summary[0].count,
          totalAmount: summary[0].totalAmount || 0,
        },
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

financeRouter.get(
  '/recharges',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const countResult = await query(`
      SELECT COUNT(*) as total FROM recharge_records WHERE user_id = ?
    `, [userId]);

    const total = countResult[0].total;
    const { offset, limit, totalPages } = buildPagination(page, pageSize, total);

    const records = await query(`
      SELECT * FROM recharge_records
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);

    const response: ApiResponse = {
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
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.userId;
    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_AMOUNT',
          message: '充值金额必须大于0',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    const rechargeCode = generateCode('REC');

    const accounts = await query(`SELECT * FROM accounts WHERE user_id = ?`, [userId]);
    if (accounts.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ACCOUNT_NOT_FOUND',
          message: '账户不存在',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(response);
      return;
    }

    const account = accounts[0];

    await execute(`
      INSERT INTO recharge_records (
        recharge_code, user_id, amount, payment_method, status, is_auto_recharge, balance_before
      ) VALUES (?, ?, ?, ?, ?, 0, ?)
    `, [rechargeCode, userId, amount, paymentMethod || 'manual', 0, account.balance]);

    const response: ApiResponse = {
      success: true,
      data: {
        rechargeCode,
        amount,
        message: '充值订单已创建，请完成支付',
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

financeRouter.post(
  '/confirm-recharge',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { rechargeCode, paymentTransactionId } = req.body;

    const recharges = await query(`
      SELECT * FROM recharge_records WHERE recharge_code = ? AND status = 0
    `, [rechargeCode]);

    if (recharges.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'RECHARGE_NOT_FOUND',
          message: '充值记录不存在或已确认',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(response);
      return;
    }

    const recharge = recharges[0];
    const accounts = await query(`SELECT * FROM accounts WHERE user_id = ?`, [recharge.user_id]);
    const account = accounts[0];

    const newBalance = account.balance + recharge.amount;

    await execute(`
      UPDATE accounts SET balance = ? WHERE user_id = ?
    `, [newBalance, recharge.user_id]);

    await execute(`
      UPDATE recharge_records 
      SET status = 1, payment_transaction_id = ?, paid_at = NOW(), balance_after = ?
      WHERE id = ?
    `, [paymentTransactionId || null, newBalance, recharge.id]);

    const response: ApiResponse = {
      success: true,
      data: {
        rechargeCode,
        amount: recharge.amount,
        previousBalance: account.balance,
        newBalance,
        message: '充值成功',
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

financeRouter.get(
  '/reports/monthly',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.userId;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || (new Date().getMonth() + 1);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const dailyStats = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        SUM(amount) as totalAmount
      FROM consumption_records
      WHERE user_id = ? AND created_at >= ? AND created_at < ?
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [userId, startDate, endDate]);

    const templateStats = await query(`
      SELECT 
        t.template_name,
        COUNT(cr.id) as count,
        SUM(cr.amount) as totalAmount
      FROM consumption_records cr
      LEFT JOIN sms_templates t ON cr.template_id = t.id
      WHERE cr.user_id = ? AND cr.created_at >= ? AND cr.created_at < ?
      GROUP BY t.id, t.template_name
      ORDER BY totalAmount DESC
    `, [userId, startDate, endDate]);

    const providerStats = await query(`
      SELECT 
        p.provider_name,
        COUNT(cr.id) as count,
        SUM(cr.amount) as totalAmount
      FROM consumption_records cr
      LEFT JOIN providers p ON cr.provider_id = p.id
      WHERE cr.user_id = ? AND cr.created_at >= ? AND cr.created_at < ?
      GROUP BY p.id, p.provider_name
      ORDER BY totalAmount DESC
    `, [userId, startDate, endDate]);

    const monthlySummary = await query(`
      SELECT 
        COUNT(*) as totalCount,
        SUM(amount) as totalAmount
      FROM consumption_records
      WHERE user_id = ? AND created_at >= ? AND created_at < ?
    `, [userId, startDate, endDate]);

    const response: ApiResponse = {
      success: true,
      data: {
        year,
        month,
        summary: {
          totalCount: monthlySummary[0].totalCount || 0,
          totalAmount: monthlySummary[0].totalAmount || 0,
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
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const countResult = await query(`
      SELECT COUNT(*) as total FROM balance_warnings WHERE user_id = ?
    `, [userId]);

    const total = countResult[0].total;
    const { offset, limit, totalPages } = buildPagination(page, pageSize, total);

    const warnings = await query(`
      SELECT * FROM balance_warnings
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);

    const response: ApiResponse = {
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
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.userId;
    const { enabled, amount, triggerAmount } = req.body;

    const accounts = await query(`SELECT * FROM accounts WHERE user_id = ?`, [userId]);

    if (accounts.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ACCOUNT_NOT_FOUND',
          message: '账户不存在',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(response);
      return;
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (enabled !== undefined) {
      updateFields.push('auto_recharge_enabled = ?');
      updateValues.push(enabled ? 1 : 0);
    }
    if (amount !== undefined) {
      updateFields.push('auto_recharge_amount = ?');
      updateValues.push(amount);
    }
    if (triggerAmount !== undefined) {
      updateFields.push('auto_recharge_trigger_amount = ?');
      updateValues.push(triggerAmount);
    }

    if (updateFields.length > 0) {
      updateValues.push(userId);
      await execute(`
        UPDATE accounts SET ${updateFields.join(', ')} WHERE user_id = ?
      `, updateValues);
    }

    const response: ApiResponse = {
      success: true,
      data: {
        message: '自动充值配置已更新',
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

app.use('/api/finance', financeRouter);

app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'finance-service',
    },
    timestamp: new Date().toISOString(),
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

async function findAvailablePort(preferredPort: number): Promise<number> {
  if (await isPortAvailable(preferredPort)) {
    return preferredPort;
  }
  for (let port = 9890; port <= 9900; port++) {
    if (port !== preferredPort && await isPortAvailable(port)) {
      return port;
    }
  }
  return 0;
}

async function startServer() {
  const preferredPort = config.services.finance.port;
  const actualPort = await findAvailablePort(preferredPort);

  if (actualPort === 0) {
    logger.error('无法找到可用的端口');
    process.exit(1);
  }

  if (actualPort !== preferredPort) {
    logger.warn(`端口 ${preferredPort} 已被占用，自动切换到端口 ${actualPort}`);
  }

  app.listen(actualPort, () => {
    logger.info(`=================================================`);
    logger.info(`  财务服务启动成功`);
    logger.info(`  监听端口: ${actualPort}`);
    logger.info(`=================================================`);
  });
}

startServer().catch((err) => {
  logger.error('服务启动失败:', err);
  process.exit(1);
});
