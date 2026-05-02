const db = require('../database');
const { v4: uuidv4 } = require('uuid');

class AMLMonitorEngine {
  constructor() {
    this.ALERT_LEVELS = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };

    this.STR_THRESHOLDS = {
      singleLargeAmount: 200000,
      dailyTotalAmount: 500000,
      multipleTransactions: 10,
      structuringThreshold: 90000
    };
  }

  async monitorTransaction(transaction) {
    const alerts = [];

    const largeAmountAlert = await this.checkLargeAmount(transaction);
    if (largeAmountAlert) {
      alerts.push(largeAmountAlert);
    }

    const structuringAlert = await this.checkStructuring(transaction);
    if (structuringAlert) {
      alerts.push(structuringAlert);
    }

    const highRiskPartyAlert = await this.checkHighRiskParties(transaction);
    if (highRiskPartyAlert) {
      alerts.push(highRiskPartyAlert);
    }

    const unusualPatternAlert = await this.checkUnusualPattern(transaction);
    if (unusualPatternAlert) {
      alerts.push(unusualPatternAlert);
    }

    const sanctionAlert = await this.checkSanctionList(transaction);
    if (sanctionAlert) {
      alerts.push(sanctionAlert);
    }

    if (alerts.length > 0) {
      for (const alert of alerts) {
        await this.createAMLAlert(
          transaction.from_account_id || transaction.userId,
          transaction.id || transaction.transactionId,
          alert.type,
          alert.level,
          alert.description
        );
      }
    }

    const overallStatus = alerts.length === 0 ? 'passed' : 
      alerts.some(a => a.level === this.ALERT_LEVELS.CRITICAL) ? 'suspended' : 
      alerts.some(a => a.level === this.ALERT_LEVELS.HIGH) ? 'review_required' : 'passed';

    return {
      status: overallStatus,
      alerts,
      monitoredAt: new Date().toISOString()
    };
  }

  async checkLargeAmount(transaction) {
    const amount = transaction.amount;

    if (amount >= this.STR_THRESHOLDS.singleLargeAmount) {
      return {
        type: 'large_transaction_report',
        level: this.ALERT_LEVELS.HIGH,
        description: `大额交易报告: 单笔交易 ${amount} 元超过阈值 ${this.STR_THRESHOLDS.singleLargeAmount} 元`,
        requiresReport: true
      };
    }

    return null;
  }

  async checkStructuring(transaction) {
    const userId = transaction.userId || transaction.from_account_id;
    const amount = transaction.amount;

    if (amount >= this.STR_THRESHOLDS.structuringThreshold && 
        amount < this.STR_THRESHOLDS.singleLargeAmount) {
      const recentTransactions = await this.getRecentTransactions(userId, 24);
      const similarTransactions = recentTransactions.filter(t => 
        t.amount >= this.STR_THRESHOLDS.structuringThreshold * 0.8
      );

      if (similarTransactions.length >= 3) {
        return {
          type: 'structuring_suspicion',
          level: this.ALERT_LEVELS.HIGH,
          description: `疑似分拆交易: 24小时内发现 ${similarTransactions.length} 笔大额交易`,
          requiresReview: true
        };
      }
    }

    return null;
  }

  async checkHighRiskParties(transaction) {
    const highRiskCountries = ['KP', 'IR', 'SY', 'CU', 'SD'];
    const highRiskIndustries = ['gambling', 'crypto_exchange', 'precious_metals'];

    return null;
  }

  async checkUnusualPattern(transaction) {
    const userId = transaction.userId || transaction.from_account_id;
    const amount = transaction.amount;

    const userHistory = await this.getUserTransactionHistory(userId, 30);
    
    if (userHistory.length > 0) {
      const avgAmount = userHistory.reduce((sum, t) => sum + t.amount, 0) / userHistory.length;
      
      if (amount > avgAmount * 5) {
        return {
          type: 'unusual_amount_pattern',
          level: this.ALERT_LEVELS.MEDIUM,
          description: `交易金额异常: 当前 ${amount} 元是历史平均 ${Math.round(avgAmount)} 元的 ${Math.round(amount/avgAmount)} 倍`,
          requiresReview: true
        };
      }

      const unusualHour = this.checkUnusualTransactionHour();
      if (unusualHour && amount > avgAmount * 2) {
        return {
          type: 'unusual_time_pattern',
          level: this.ALERT_LEVELS.MEDIUM,
          description: `非工作时间异常交易: 当前时间 ${new Date().getHours()} 时`,
          requiresReview: true
        };
      }
    }

    return null;
  }

  async checkSanctionList(transaction) {
    return null;
  }

  async getRecentTransactions(userId, hours) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    return await db.all(
      `SELECT * FROM transactions 
       WHERE from_account_id IN (SELECT id FROM accounts WHERE user_id = ?)
       AND created_at > ?
       AND status = 'completed'
       ORDER BY created_at DESC`,
      [userId, since]
    );
  }

  async getUserTransactionHistory(userId, days) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    return await db.all(
      `SELECT * FROM transactions 
       WHERE from_account_id IN (SELECT id FROM accounts WHERE user_id = ?)
       AND created_at > ?
       AND status = 'completed'
       ORDER BY created_at DESC`,
      [userId, since]
    );
  }

  checkUnusualTransactionHour() {
    const hour = new Date().getHours();
    return hour < 2 || hour >= 22;
  }

  async createAMLAlert(userId, transactionId, alertType, level, description) {
    const alertId = uuidv4();
    await db.run(
      `INSERT INTO risk_events (
        id, user_id, transaction_id, event_type, risk_level, description, is_handled
      ) VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [alertId, userId, transactionId, alertType, level, description]
    );
    return alertId;
  }

  async generateDailyAMLReport(date) {
    const reportDate = date || new Date().toISOString().split('T')[0];
    
    const stats = await db.get(
      `SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN risk_score >= 50 THEN 1 ELSE 0 END) as high_risk_count,
        SUM(CASE WHEN risk_score >= 25 AND risk_score < 50 THEN 1 ELSE 0 END) as medium_risk_count,
        SUM(amount) as total_volume
       FROM transactions 
       WHERE date(created_at) = ?`,
      [reportDate]
    );

    const pendingAlerts = await db.all(
      `SELECT * FROM risk_events 
       WHERE is_handled = 0 
       AND date(created_at) = ?
       ORDER BY risk_level DESC`,
      [reportDate]
    );

    return {
      reportDate,
      summary: {
        totalTransactions: stats.total_transactions || 0,
        totalVolume: stats.total_volume || 0,
        highRiskCount: stats.high_risk_count || 0,
        mediumRiskCount: stats.medium_risk_count || 0,
        pendingAlerts: pendingAlerts.length
      },
      pendingAlerts,
      generatedAt: new Date().toISOString()
    };
  }

  async updateTransactionAMLStatus(transactionId, status) {
    await db.run(
      `UPDATE transactions 
       SET aml_status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [status, transactionId]
    );
  }

  async getAlertsByLevel(level) {
    return await db.all(
      `SELECT re.*, u.username, u.real_name
       FROM risk_events re
       LEFT JOIN users u ON re.user_id = u.id
       WHERE re.risk_level = ? AND re.is_handled = 0
       ORDER BY re.created_at DESC`,
      [level]
    );
  }

  async handleAlert(alertId, handlerId, action, remark) {
    await db.run(
      `UPDATE risk_events 
       SET is_handled = 1, handled_by = ?, handled_remark = ?, handled_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [handlerId, `${action}: ${remark}`, alertId]
    );

    return {
      success: true,
      alertId,
      action,
      handledAt: new Date().toISOString()
    };
  }
}

module.exports = new AMLMonitorEngine();
