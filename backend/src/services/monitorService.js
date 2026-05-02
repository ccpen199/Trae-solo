const db = require('../database');
const { v4: uuidv4 } = require('uuid');

class MonitorService {
  constructor() {
    this.DAILY_LIMIT_USER = parseInt(process.env.DAILY_LIMIT_USER) || 100000;
    this.DAILY_LIMIT_MERCHANT = parseInt(process.env.DAILY_LIMIT_MERCHANT) || 1000000;
    this.ANOMALY_THRESHOLD = parseInt(process.env.ANOMALY_THRESHOLD) || 5;
  }

  async checkDailyLimit(userId, amount) {
    const account = await db.get('SELECT * FROM accounts WHERE user_id = ?', [userId]);
    if (!account) {
      return { exceeded: false, message: '账户不存在' };
    }

    const today = new Date().toISOString().split('T')[0];
    const dailySpent = await db.get(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM transactions 
       WHERE from_account_id = ? 
       AND status = 'completed'
       AND date(created_at) = ?`,
      [account.id, today]
    );

    const totalAfterTransaction = dailySpent.total + amount;
    const dailyLimit = account.daily_limit || this.DAILY_LIMIT_USER;

    if (totalAfterTransaction > dailyLimit) {
      return {
        exceeded: true,
        currentSpent: dailySpent.total,
        transactionAmount: amount,
        dailyLimit,
        remaining: dailyLimit - dailySpent.total,
        message: `日限额超限: 已使用 ${dailySpent.total}, 限额 ${dailyLimit}, 剩余 ${dailyLimit - dailySpent.total}`
      };
    }

    return {
      exceeded: false,
      currentSpent: dailySpent.total,
      dailyLimit,
      remaining: dailyLimit - dailySpent.total
    };
  }

  async checkAnomalyFrequency(userId) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const recentTransactions = await db.all(
      `SELECT * FROM transactions 
       WHERE from_account_id IN (SELECT id FROM accounts WHERE user_id = ?)
       AND created_at > ?
       ORDER BY created_at DESC`,
      [userId, oneHourAgo]
    );

    const transactionCount = recentTransactions.length;

    const recentFailures = await db.all(
      `SELECT * FROM transactions 
       WHERE from_account_id IN (SELECT id FROM accounts WHERE user_id = ?)
       AND created_at > ?
       AND status != 'completed'
       ORDER BY created_at DESC`,
      [userId, oneHourAgo]
    );

    const failureCount = recentFailures.length;

    if (failureCount >= this.ANOMALY_THRESHOLD) {
      return {
        anomalyDetected: true,
        transactionCount,
        failureCount,
        threshold: this.ANOMALY_THRESHOLD,
        message: `异常频次检测: 1小时内 ${failureCount} 次失败交易, 超过阈值 ${this.ANOMALY_THRESHOLD}`
      };
    }

    const totalAmount = recentTransactions.reduce((sum, t) => sum + t.amount, 0);
    const averageAmount = transactionCount > 0 ? totalAmount / transactionCount : 0;

    if (transactionCount > 20 && averageAmount > 5000) {
      return {
        anomalyDetected: true,
        transactionCount,
        averageAmount,
        message: '异常交易模式: 短时间内高频大额交易'
      };
    }

    return {
      anomalyDetected: false,
      transactionCount,
      failureCount
    };
  }

  async triggerVerification(userId, reason) {
    const verificationId = uuidv4();
    
    await db.run(
      `INSERT INTO operation_logs (
        id, user_id, operation_type, detail
      ) VALUES (?, ?, ?, ?)`,
      [
        verificationId,
        userId,
        'verification_triggered',
        `触发验证请求: ${reason}`
      ]
    );

    return {
      verificationId,
      userId,
      reason,
      triggeredAt: new Date().toISOString()
    };
  }

  async freezeAccount(userId, reason) {
    await db.run(
      `UPDATE accounts 
       SET status = 'frozen', updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = ?`,
      [userId]
    );

    await db.run(
      `INSERT INTO operation_logs (
        id, user_id, operation_type, detail
      ) VALUES (?, ?, ?, ?)`,
      [
        uuidv4(),
        userId,
        'account_freeze',
        `账户自动冻结: ${reason}`
      ]
    );

    await db.run(
      `INSERT INTO risk_events (
        id, user_id, event_type, risk_level, description, is_handled
      ) VALUES (?, ?, ?, 'high', ?, 0)`,
      [
        uuidv4(),
        userId,
        'automatic_freeze',
        `账户自动冻结: ${reason}`
      ]
    );

    return {
      success: true,
      userId,
      reason,
      frozenAt: new Date().toISOString()
    };
  }

  async monitorTransaction(userId, amount) {
    const limitCheck = await this.checkDailyLimit(userId, amount);
    const anomalyCheck = await this.checkAnomalyFrequency(userId);

    const result = {
      limitCheck,
      anomalyCheck,
      actions: [],
      warnings: []
    };

    if (limitCheck.exceeded) {
      result.warnings.push({
        type: 'daily_limit_exceeded',
        message: limitCheck.message
      });
      
      const verification = await this.triggerVerification(userId, limitCheck.message);
      result.actions.push({
        type: 'verification_triggered',
        verificationId: verification.verificationId
      });
    }

    if (anomalyCheck.anomalyDetected) {
      result.warnings.push({
        type: 'anomaly_detected',
        message: anomalyCheck.message
      });

      if (anomalyCheck.failureCount >= this.ANOMALY_THRESHOLD * 2) {
        const freezeResult = await this.freezeAccount(userId, anomalyCheck.message);
        result.actions.push({
          type: 'account_frozen',
          detail: freezeResult
        });
      }
    }

    return result;
  }

  async getSystemStatus() {
    const totalUsers = await db.get('SELECT COUNT(*) as count FROM users');
    const activeUsers = await db.get("SELECT COUNT(*) as count FROM users WHERE status = 'active'");
    const totalTransactions = await db.get('SELECT COUNT(*) as count FROM transactions');
    const todayTransactions = await db.get(
      "SELECT COUNT(*) as count FROM transactions WHERE date(created_at) = date('now')"
    );
    const totalVolume = await db.get('SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = "completed"');
    const todayVolume = await db.get(
      "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = 'completed' AND date(created_at) = date('now')"
    );
    const pendingAlerts = await db.get('SELECT COUNT(*) as count FROM risk_events WHERE is_handled = 0');
    const frozenAccounts = await db.get("SELECT COUNT(*) as count FROM accounts WHERE status = 'frozen'");

    return {
      timestamp: new Date().toISOString(),
      systemHealth: 'healthy',
      users: {
        total: totalUsers.count,
        active: activeUsers.count
      },
      transactions: {
        total: totalTransactions.count,
        today: todayTransactions.count,
        totalVolume: totalVolume.total,
        todayVolume: todayVolume.total
      },
      risk: {
        pendingAlerts: pendingAlerts.count,
        frozenAccounts: frozenAccounts.count
      }
    };
  }

  async getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const todayStats = await db.get(
      `SELECT 
        COUNT(*) as transaction_count,
        COALESCE(SUM(amount), 0) as total_volume,
        COUNT(DISTINCT from_account_id) as active_users
       FROM transactions 
       WHERE date(created_at) = ? AND status = 'completed'`,
      [today]
    );

    const yesterdayStats = await db.get(
      `SELECT 
        COUNT(*) as transaction_count,
        COALESCE(SUM(amount), 0) as total_volume,
        COUNT(DISTINCT from_account_id) as active_users
       FROM transactions 
       WHERE date(created_at) = ? AND status = 'completed'`,
      [yesterday]
    );

    const riskStats = await db.get(
      `SELECT 
        COUNT(*) as total_alerts,
        SUM(CASE WHEN is_handled = 0 THEN 1 ELSE 0 END) as pending_alerts,
        SUM(CASE WHEN risk_level = 'high' AND is_handled = 0 THEN 1 ELSE 0 END) as high_risk,
        SUM(CASE WHEN risk_level = 'critical' AND is_handled = 0 THEN 1 ELSE 0 END) as critical_risk
       FROM risk_events
       WHERE date(created_at) = ?`,
      [today]
    );

    const recentTransactions = await db.all(
      `SELECT t.*, 
              fa.account_number as from_account,
              ta.account_number as to_account,
              fu.username as from_username,
              tu.username as to_username
       FROM transactions t
       LEFT JOIN accounts fa ON t.from_account_id = fa.id
       LEFT JOIN accounts ta ON t.to_account_id = ta.id
       LEFT JOIN users fu ON fa.user_id = fu.id
       LEFT JOIN users tu ON ta.user_id = tu.id
       ORDER BY t.created_at DESC
       LIMIT 10`
    );

    return {
      today: {
        date: today,
        transactionCount: todayStats.transaction_count || 0,
        totalVolume: todayStats.total_volume || 0,
        activeUsers: todayStats.active_users || 0
      },
      yesterday: {
        date: yesterday,
        transactionCount: yesterdayStats.transaction_count || 0,
        totalVolume: yesterdayStats.total_volume || 0,
        activeUsers: yesterdayStats.active_users || 0
      },
      risk: {
        totalAlerts: riskStats.total_alerts || 0,
        pendingAlerts: riskStats.pending_alerts || 0,
        highRisk: riskStats.high_risk || 0,
        criticalRisk: riskStats.critical_risk || 0
      },
      recentTransactions,
      generatedAt: new Date().toISOString()
    };
  }

  async getTransactionTrend(days = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    return await db.all(
      `SELECT 
        date(created_at) as date,
        COUNT(*) as transaction_count,
        COALESCE(SUM(amount), 0) as total_volume,
        COUNT(DISTINCT from_account_id) as unique_users
       FROM transactions 
       WHERE created_at >= ?
       GROUP BY date(created_at)
       ORDER BY date(created_at) DESC`,
      [since]
    );
  }

  async getRiskSummary() {
    const highRiskAlerts = await db.all(
      `SELECT re.*, u.username, u.real_name
       FROM risk_events re
       LEFT JOIN users u ON re.user_id = u.id
       WHERE re.is_handled = 0 
       ORDER BY re.risk_level DESC, re.created_at DESC
       LIMIT 20`
    );

    const riskByLevel = await db.all(
      `SELECT 
        risk_level,
        COUNT(*) as count
       FROM risk_events 
       WHERE is_handled = 0
       GROUP BY risk_level`
    );

    const riskByType = await db.all(
      `SELECT 
        event_type,
        COUNT(*) as count
       FROM risk_events 
       WHERE is_handled = 0
       GROUP BY event_type`
    );

    return {
      pendingAlerts: highRiskAlerts,
      byLevel: riskByLevel,
      byType: riskByType,
      summaryAt: new Date().toISOString()
    };
  }
}

module.exports = new MonitorService();
