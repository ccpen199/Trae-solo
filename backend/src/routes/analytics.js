const express = require('express');
const db = require('../database');
const logger = require('../utils/logger');
const { authenticate, requirePermission } = require('../middleware/auth');
const { ChurnModelEngine } = require('../engines/ChurnModelEngine');
const { BillingCycleEngine } = require('../engines/BillingCycleEngine');

const router = express.Router();

router.get('/dashboard', authenticate, requirePermission(['finance:report', 'audit:log']), async (req, res) => {
  try {
    const churnEngine = new ChurnModelEngine();
    
    const mrr = churnEngine.getMRR();
    const churnRate = churnEngine.getChurnRate();
    const retentionStats = churnEngine.getRetentionStats();
    const highRiskSubs = churnEngine.getHighRiskSubscriptions(10);
    
    const activeSubscriptions = db.get(`
      SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'
    `);
    
    const pendingSubscriptions = db.get(`
      SELECT COUNT(*) as count FROM subscriptions WHERE status = 'pending'
    `);
    
    const pastDueSubscriptions = db.get(`
      SELECT COUNT(*) as count FROM subscriptions WHERE status = 'past_due'
    `);
    
    const cancelledSubscriptions = db.get(`
      SELECT COUNT(*) as count FROM subscriptions WHERE status = 'cancelled'
    `);
    
    const totalRevenue = db.get(`
      SELECT SUM(amount) as total FROM payments WHERE status = 'succeeded'
    `);
    
    const monthlyRevenue = db.all(`
      SELECT 
        strftime('%Y-%m', paid_at) as month,
        SUM(amount) as revenue
      FROM payments 
      WHERE status = 'succeeded'
        AND paid_at IS NOT NULL
      GROUP BY strftime('%Y-%m', paid_at)
      ORDER BY month DESC
      LIMIT 12
    `);
    
    const subscriptionByPlan = db.all(`
      SELECT 
        p.display_name as plan_name,
        p.price,
        p.billing_cycle,
        COUNT(s.id) as subscription_count
      FROM plans p
      LEFT JOIN subscriptions s ON p.id = s.plan_id AND s.status = 'active'
      GROUP BY p.id
      ORDER BY subscription_count DESC
    `);
    
    res.json({
      success: true,
      data: {
        mrr,
        churnRate,
        retentionStats,
        highRiskSubscriptions: highRiskSubs,
        subscriptions: {
          active: activeSubscriptions?.count || 0,
          pending: pendingSubscriptions?.count || 0,
          pastDue: pastDueSubscriptions?.count || 0,
          cancelled: cancelledSubscriptions?.count || 0
        },
        revenue: {
          total: totalRevenue?.total || 0,
          monthly: monthlyRevenue
        },
        subscriptionByPlan
      }
    });
  } catch (error) {
    logger.error('获取仪表盘数据失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.get('/mrr', authenticate, requirePermission(['finance:report', 'audit:log']), async (req, res) => {
  try {
    const { date } = req.query;
    const churnEngine = new ChurnModelEngine();
    const mrr = churnEngine.getMRR({ date });
    
    res.json({
      success: true,
      data: mrr
    });
  } catch (error) {
    logger.error('获取MRR失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.get('/churn-rate', authenticate, requirePermission(['finance:report', 'audit:log']), async (req, res) => {
  try {
    const { startDate, endDate, period } = req.query;
    const churnEngine = new ChurnModelEngine();
    const churnRate = churnEngine.getChurnRate({ startDate, endDate, period });
    
    res.json({
      success: true,
      data: churnRate
    });
  } catch (error) {
    logger.error('获取流失率失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.get('/churn-risk', authenticate, requirePermission(['finance:report', 'audit:log']), async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const churnEngine = new ChurnModelEngine();
    const highRiskSubs = churnEngine.getHighRiskSubscriptions(parseInt(limit));
    
    res.json({
      success: true,
      data: {
        highRiskSubscriptions: highRiskSubs,
        total: highRiskSubs.length
      }
    });
  } catch (error) {
    logger.error('获取流失风险失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.post('/evaluate-churn', authenticate, requirePermission(['finance:report', 'audit:log']), async (req, res) => {
  try {
    const churnEngine = new ChurnModelEngine();
    const result = churnEngine.batchEvaluateChurnRisk();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('评估流失风险失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.get('/revenue-trend', authenticate, requirePermission(['finance:report', 'audit:log']), async (req, res) => {
  try {
    const { period = 'month', limit = 12 } = req.query;
    
    let groupFormat;
    switch (period) {
      case 'day':
        groupFormat = '%Y-%m-%d';
        break;
      case 'week':
        groupFormat = '%Y-%W';
        break;
      case 'year':
        groupFormat = '%Y';
        break;
      case 'month':
      default:
        groupFormat = '%Y-%m';
    }
    
    const revenueTrend = db.all(`
      SELECT 
        strftime(?, paid_at) as period,
        SUM(amount) as revenue,
        COUNT(*) as payment_count
      FROM payments 
      WHERE status = 'succeeded'
        AND paid_at IS NOT NULL
      GROUP BY strftime(?, paid_at)
      ORDER BY period DESC
      LIMIT ?
    `, [groupFormat, groupFormat, parseInt(limit)]);
    
    res.json({
      success: true,
      data: {
        revenueTrend,
        period
      }
    });
  } catch (error) {
    logger.error('获取收入趋势失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.get('/subscription-stats', authenticate, requirePermission(['finance:report', 'audit:log']), async (req, res) => {
  try {
    const statusStats = db.all(`
      SELECT 
        status,
        COUNT(*) as count
      FROM subscriptions
      GROUP BY status
    `);
    
    const billingCycleStats = db.all(`
      SELECT 
        p.billing_cycle,
        COUNT(s.id) as count,
        SUM(p.price) as total_price
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.status = 'active'
      GROUP BY p.billing_cycle
    `);
    
    const trialStats = db.get(`
      SELECT 
        COUNT(*) as trial_count
      FROM subscriptions s
      WHERE s.status = 'active'
        AND s.trial_end IS NOT NULL
        AND s.trial_end >= CURRENT_TIMESTAMP
    `);
    
    const upcomingRenewals = db.all(`
      SELECT 
        s.id,
        s.next_billing_at,
        p.display_name as plan_name,
        p.price,
        u.display_name as user_name,
        u.email
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'active'
        AND s.next_billing_at IS NOT NULL
        AND s.next_billing_at >= CURRENT_TIMESTAMP
        AND s.next_billing_at <= datetime('now', '+7 days')
      ORDER BY s.next_billing_at ASC
    `);
    
    res.json({
      success: true,
      data: {
        statusStats,
        billingCycleStats,
        trialStats,
        upcomingRenewals
      }
    });
  } catch (error) {
    logger.error('获取订阅统计失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

module.exports = router;
