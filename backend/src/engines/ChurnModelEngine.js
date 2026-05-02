const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const logger = require('../utils/logger');

class ChurnModelEngine {
  constructor() {
    this.db = db;
    this.riskWeights = {
      paymentFailures: 25,
      subscriptionAge: 15,
      usageDecline: 20,
      supportTickets: 10,
      paymentMethodAge: 10,
      inactivity: 20
    };
  }

  calculateChurnRisk(subscriptionId) {
    logger.info(`计算订阅 ${subscriptionId} 的流失风险`);
    
    const subscription = this.db.get(`
      SELECT s.*, u.id as user_id, u.created_at as user_created_at
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [subscriptionId]);
    
    if (!subscription) {
      throw new Error(`订阅 ${subscriptionId} 不存在`);
    }
    
    const factors = [];
    let totalScore = 0;
    
    const paymentFailures = this.getPaymentFailureCount(subscription.id);
    if (paymentFailures > 0) {
      const score = Math.min(paymentFailures * 15, this.riskWeights.paymentFailures);
      totalScore += score;
      factors.push({
        factor: 'payment_failures',
        description: `历史支付失败次数: ${paymentFailures}`,
        score
      });
    }
    
    const subscriptionAge = this.getSubscriptionAge(subscription);
    if (subscriptionAge < 90) {
      const score = Math.round((90 - subscriptionAge) / 90 * this.riskWeights.subscriptionAge);
      totalScore += score;
      factors.push({
        factor: 'subscription_age',
        description: `订阅时长: ${subscriptionAge} 天（<90天高风险期）`,
        score
      });
    }
    
    const usageDecline = this.checkUsageDecline(subscription.user_id);
    if (usageDecline > 0.5) {
      const score = Math.round(usageDecline * this.riskWeights.usageDecline);
      totalScore += score;
      factors.push({
        factor: 'usage_decline',
        description: `使用率下降: ${Math.round(usageDecline * 100)}%`,
        score
      });
    }
    
    const inactivityDays = this.getInactivityDays(subscription.user_id);
    if (inactivityDays > 14) {
      const score = Math.min(Math.round(inactivityDays / 2), this.riskWeights.inactivity);
      totalScore += score;
      factors.push({
        factor: 'inactivity',
        description: `用户不活跃天数: ${inactivityDays} 天`,
        score
      });
    }
    
    let riskLevel = 'low';
    if (totalScore >= 60) {
      riskLevel = 'high';
    } else if (totalScore >= 30) {
      riskLevel = 'medium';
    }
    
    const prediction = {
      id: uuidv4(),
      subscription_id: subscription.id,
      user_id: subscription.user_id,
      risk_score: totalScore,
      risk_level: riskLevel,
      factors: JSON.stringify(factors),
      predicted_at: moment().toISOString()
    };
    
    this.db.run(`
      INSERT INTO churn_predictions (
        id, subscription_id, user_id, risk_score, 
        risk_level, factors, predicted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      prediction.id,
      prediction.subscription_id,
      prediction.user_id,
      prediction.risk_score,
      prediction.risk_level,
      prediction.factors,
      prediction.predicted_at
    ]);
    
    logger.info(`订阅 ${subscriptionId} 流失风险评估完成: ${riskLevel} (${totalScore}分)`);
    
    return {
      ...prediction,
      factorsArray: factors
    };
  }

  getPaymentFailureCount(subscriptionId) {
    const result = this.db.get(`
      SELECT COUNT(*) as count
      FROM payments
      WHERE subscription_id = ?
        AND status = 'failed'
        AND created_at >= datetime('now', '-90 days')
    `, [subscriptionId]);
    
    return result?.count || 0;
  }

  getSubscriptionAge(subscription) {
    const startDate = moment(subscription.created_at);
    const now = moment();
    return now.diff(startDate, 'days');
  }

  checkUsageDecline(userId) {
    const recentUsage = this.db.get(`
      SELECT COUNT(*) as count
      FROM entitlement_usage
      WHERE user_id = ?
        AND created_at >= datetime('now', '-7 days')
    `, [userId]);
    
    const previousUsage = this.db.get(`
      SELECT COUNT(*) as count
      FROM entitlement_usage
      WHERE user_id = ?
        AND created_at >= datetime('now', '-14 days')
        AND created_at < datetime('now', '-7 days')
    `, [userId]);
    
    const recent = recentUsage?.count || 0;
    const previous = previousUsage?.count || 0;
    
    if (previous === 0) return 0;
    
    return Math.max(0, 1 - (recent / previous));
  }

  getInactivityDays(userId) {
    const lastActivity = this.db.get(`
      SELECT MAX(created_at) as last_activity
      FROM entitlement_usage
      WHERE user_id = ?
    `, [userId]);
    
    if (!lastActivity || !lastActivity.last_activity) {
      return 999;
    }
    
    const lastActive = moment(lastActivity.last_activity);
    const now = moment();
    return now.diff(lastActive, 'days');
  }

  batchEvaluateChurnRisk() {
    logger.info('开始批量评估流失风险');
    
    const activeSubscriptions = this.db.all(`
      SELECT s.id
      FROM subscriptions s
      WHERE s.status = 'active'
    `);
    
    const results = [];
    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let lowRiskCount = 0;
    
    for (const sub of activeSubscriptions) {
      try {
        const prediction = this.calculateChurnRisk(sub.id);
        results.push(prediction);
        
        if (prediction.risk_level === 'high') {
          highRiskCount++;
        } else if (prediction.risk_level === 'medium') {
          mediumRiskCount++;
        } else {
          lowRiskCount++;
        }
      } catch (error) {
        logger.error(`评估订阅 ${sub.id} 风险时出错:`, error);
      }
    }
    
    logger.info(`批量流失风险评估完成: 高风险=${highRiskCount}, 中风险=${mediumRiskCount}, 低风险=${lowRiskCount}`);
    
    return {
      total: activeSubscriptions.length,
      highRisk: highRiskCount,
      mediumRisk: mediumRiskCount,
      lowRisk: lowRiskCount,
      results
    };
  }

  getChurnRate(options = {}) {
    const { startDate, endDate, period = 'month' } = options;
    
    const periodFormat = {
      'day': '%Y-%m-%d',
      'week': '%Y-%W',
      'month': '%Y-%m',
      'quarter': '%Y-Q%q',
      'year': '%Y'
    };
    
    let sql = `
      SELECT 
        COUNT(DISTINCT CASE 
          WHEN s.status IN ('cancelled', 'expired') 
          AND (s.cancelled_at IS NOT NULL OR s.current_period_end < CURRENT_TIMESTAMP)
          THEN s.id 
        END) as churned,
        COUNT(DISTINCT s.id) as total
      FROM subscriptions s
      WHERE 1=1
    `;
    
    const params = [];
    
    if (startDate) {
      sql += ' AND s.created_at >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ' AND s.created_at <= ?';
      params.push(endDate);
    }
    
    const result = this.db.get(sql, params);
    
    const total = result?.total || 0;
    const churned = result?.churned || 0;
    const churnRate = total > 0 ? (churned / total) : 0;
    
    return {
      totalSubscriptions: total,
      churnedSubscriptions: churned,
      churnRate: churnRate,
      churnRatePercent: (churnRate * 100).toFixed(2)
    };
  }

  getMRR(options = {}) {
    const { date = moment().toISOString() } = options;
    
    const activeSubscriptions = this.db.all(`
      SELECT s.id, p.price, p.billing_cycle
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.status = 'active'
        AND s.current_period_end >= ?
    `, [date]);
    
    let mrr = 0;
    
    for (const sub of activeSubscriptions) {
      let monthlyEquivalent = sub.price;
      
      switch (sub.billing_cycle) {
        case 'daily':
          monthlyEquivalent = sub.price * 30;
          break;
        case 'weekly':
          monthlyEquivalent = sub.price * 4.33;
          break;
        case 'monthly':
          monthlyEquivalent = sub.price;
          break;
        case 'quarterly':
          monthlyEquivalent = sub.price / 3;
          break;
        case 'yearly':
          monthlyEquivalent = sub.price / 12;
          break;
      }
      
      mrr += monthlyEquivalent;
    }
    
    return {
      mrr: Math.round(mrr * 100) / 100,
      mrrFormatted: `¥${(Math.round(mrr * 100) / 100).toFixed(2)}`,
      activeSubscriptions: activeSubscriptions.length
    };
  }

  getHighRiskSubscriptions(limit = 50) {
    const subscriptions = this.db.all(`
      SELECT 
        cp.*,
        s.status as subscription_status,
        p.display_name as plan_name,
        u.display_name as user_name,
        u.email as user_email
      FROM churn_predictions cp
      JOIN subscriptions s ON cp.subscription_id = s.id
      JOIN plans p ON s.plan_id = p.id
      JOIN users u ON cp.user_id = u.id
      WHERE cp.risk_level = 'high'
        AND s.status = 'active'
      ORDER BY cp.risk_score DESC
      LIMIT ?
    `, [limit]);
    
    return subscriptions;
  }

  recordChurnAction(predictionId, action) {
    logger.info(`记录流失干预措施: ${predictionId} -> ${action}`);
    
    const result = this.db.run(`
      UPDATE churn_predictions 
      SET action_taken = ?,
          action_taken_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [action, predictionId]);
    
    return { success: result.success, updated: result.changes };
  }

  getRetentionStats() {
    const cohorts = this.db.all(`
      SELECT
        strftime('%Y-%m', s.created_at) as cohort_month,
        COUNT(DISTINCT s.id) as total_subscriptions,
        COUNT(DISTINCT CASE 
          WHEN s.status = 'active' OR 
               (s.status = 'cancelled' AND date(s.current_period_end) > date('now'))
          THEN s.id 
        END) as retained
      FROM subscriptions s
      GROUP BY cohort_month
      ORDER BY cohort_month DESC
    `);
    
    return cohorts.map(c => ({
      cohort: c.cohort_month,
      total: c.total_subscriptions,
      retained: c.retained,
      retentionRate: c.total_subscriptions > 0 
        ? (c.retained / c.total_subscriptions) 
        : 0
    }));
  }
}

module.exports = { ChurnModelEngine };
