const db = require('../database');
const { v4: uuidv4 } = require('uuid');

class AntiFraudEngine {
  constructor() {
    this.RISK_LEVELS = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };
  }

  async analyzeTransaction(transactionData) {
    const { userId, amount, toAccountId, transactionType } = transactionData;
    
    let riskScore = 0;
    let riskReasons = [];

    if (amount > 50000) {
      riskScore += 30;
      riskReasons.push('大额交易');
    } else if (amount > 10000) {
      riskScore += 10;
      riskReasons.push('较高金额');
    }

    const transactionFrequency = await this.checkTransactionFrequency(userId);
    if (transactionFrequency > 10) {
      riskScore += 25;
      riskReasons.push('交易频次异常');
    } else if (transactionFrequency > 5) {
      riskScore += 10;
      riskReasons.push('交易频次较高');
    }

    const newRecipient = await this.checkNewRecipient(userId, toAccountId);
    if (newRecipient) {
      riskScore += 15;
      riskReasons.push('首次交易对方');
    }

    const timeRisk = this.checkTransactionTime();
    if (timeRisk) {
      riskScore += 10;
      riskReasons.push('非工作时间交易');
    }

    const abnormalPattern = await this.checkAbnormalPattern(userId, amount);
    if (abnormalPattern) {
      riskScore += 20;
      riskReasons.push('交易模式异常');
    }

    let riskLevel;
    let status = 'passed';

    if (riskScore >= 70) {
      riskLevel = this.RISK_LEVELS.CRITICAL;
      status = 'blocked';
    } else if (riskScore >= 50) {
      riskLevel = this.RISK_LEVELS.HIGH;
      status = 'review_required';
    } else if (riskScore >= 25) {
      riskLevel = this.RISK_LEVELS.MEDIUM;
      status = 'passed';
    } else {
      riskLevel = this.RISK_LEVELS.LOW;
      status = 'passed';
    }

    const result = {
      riskScore,
      riskLevel,
      status,
      reasons: riskReasons,
      timestamp: new Date().toISOString()
    };

    if (riskScore >= 25) {
      await this.createRiskEvent(userId, null, 'transaction_risk', riskLevel, JSON.stringify(riskReasons));
    }

    return result;
  }

  async checkTransactionFrequency(userId) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const result = await db.get(
      `SELECT COUNT(*) as count 
       FROM transactions 
       WHERE from_account_id IN (SELECT id FROM accounts WHERE user_id = ?)
       AND created_at > ?
       AND status = 'completed'`,
      [userId, oneHourAgo]
    );
    return result.count || 0;
  }

  async checkNewRecipient(userId, toAccountId) {
    const result = await db.get(
      `SELECT COUNT(*) as count 
       FROM transactions 
       WHERE from_account_id IN (SELECT id FROM accounts WHERE user_id = ?)
       AND to_account_id = ?
       AND status = 'completed'`,
      [userId, toAccountId]
    );
    return result.count === 0;
  }

  checkTransactionTime() {
    const hour = new Date().getHours();
    return hour < 6 || hour >= 23;
  }

  async checkAbnormalPattern(userId, amount) {
    const userAccount = await db.get(
      'SELECT id FROM accounts WHERE user_id = ? LIMIT 1',
      [userId]
    );
    
    if (!userAccount) return false;

    const avgResult = await db.get(
      `SELECT AVG(amount) as avg_amount 
       FROM transactions 
       WHERE from_account_id = ?
       AND status = 'completed'
       AND created_at > date('now', '-30 days')`,
      [userAccount.id]
    );

    const avgAmount = avgResult.avg_amount || 5000;
    return amount > avgAmount * 3;
  }

  async createRiskEvent(userId, transactionId, eventType, riskLevel, description) {
    const eventId = uuidv4();
    await db.run(
      `INSERT INTO risk_events (
        id, user_id, transaction_id, event_type, risk_level, description, is_handled
      ) VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [eventId, userId, transactionId, eventType, riskLevel, description]
    );
    return eventId;
  }

  async getRiskEvents(userId, includeHandled = false) {
    let query = `SELECT * FROM risk_events WHERE user_id = ?`;
    const params = [userId];
    
    if (!includeHandled) {
      query += ' AND is_handled = 0';
    }
    query += ' ORDER BY created_at DESC';
    
    return await db.all(query, params);
  }

  async handleRiskEvent(eventId, handlerId, remark) {
    await db.run(
      `UPDATE risk_events 
       SET is_handled = 1, handled_by = ?, handled_remark = ?, handled_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [handlerId, remark, eventId]
    );
  }

  async detectLargeTransaction(accountId, amount) {
    const largeThreshold = 50000;
    if (amount > largeThreshold) {
      return {
        detected: true,
        message: `单笔交易超过大额阈值 ${largeThreshold}`,
        requireVerification: true
      };
    }
    return { detected: false };
  }

  async detectAbnormalVelocity(userId) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const result = await db.get(
      `SELECT COUNT(*) as count, SUM(amount) as total
       FROM transactions t
       JOIN accounts a ON t.from_account_id = a.id
       WHERE a.user_id = ?
       AND t.created_at > ?
       AND t.status = 'completed'`,
      [userId, oneDayAgo]
    );

    const countThreshold = 50;
    const amountThreshold = 500000;

    if (result.count > countThreshold || result.total > amountThreshold) {
      return {
        detected: true,
        message: `交易速度异常: 24小时内 ${result.count} 笔, 总额 ${result.total}`,
        requireAction: true
      };
    }
    return { detected: false };
  }

  async updateTransactionRisk(transactionId, riskScore, status) {
    await db.run(
      `UPDATE transactions 
       SET risk_score = ?, anti_fraud_status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [riskScore, status, transactionId]
    );
  }
}

module.exports = new AntiFraudEngine();
