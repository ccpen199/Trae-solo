const express = require('express');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const db = require('../database');
const logger = require('../utils/logger');
const { authenticate, requirePermission } = require('../middleware/auth');
const { BillingCycleEngine } = require('../engines/BillingCycleEngine');
const { EntitlementGateEngine } = require('../engines/EntitlementGateEngine');
const { InvoiceAutoGenEngine } = require('../engines/InvoiceAutoGenEngine');
const { NotificationService } = require('../services/NotificationService');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const isAdmin = req.user.permissions.includes('subscription:manage');
    
    let sql = `
      SELECT s.*, 
             p.display_name as plan_name,
             p.billing_cycle,
             p.price,
             u.username as user_username,
             u.display_name as user_display_name,
             u.email as user_email
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (!isAdmin) {
      sql += ' AND s.user_id = ?';
      params.push(req.user.id);
    }
    
    if (status) {
      sql += ' AND s.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const subscriptions = db.all(sql, params);
    
    let countSql = `
      SELECT COUNT(*) as total
      FROM subscriptions s
      WHERE 1=1
    `;
    const countParams = [];
    
    if (!isAdmin) {
      countSql += ' AND s.user_id = ?';
      countParams.push(req.user.id);
    }
    
    if (status) {
      countSql += ' AND s.status = ?';
      countParams.push(status);
    }
    
    const countResult = db.get(countSql, countParams);
    
    res.json({
      success: true,
      data: {
        subscriptions,
        total: countResult?.total || 0
      }
    });
  } catch (error) {
    logger.error('获取订阅列表失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.get('/:subscriptionId', authenticate, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const isAdmin = req.user.permissions.includes('subscription:manage');
    
    let sql = `
      SELECT s.*, 
             p.display_name as plan_name,
             p.billing_cycle,
             p.price,
             p.description as plan_description,
             u.username as user_username,
             u.display_name as user_display_name,
             u.email as user_email
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `;
    const params = [subscriptionId];
    
    if (!isAdmin) {
      sql += ' AND s.user_id = ?';
      params.push(req.user.id);
    }
    
    const subscription = db.get(sql, params);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: '订阅不存在'
      });
    }
    
    const features = db.all(`
      SELECT * FROM plan_features WHERE plan_id = ? ORDER BY sort_order
    `, [subscription.plan_id]);
    
    const changes = db.all(`
      SELECT * FROM subscription_changes 
      WHERE subscription_id = ? 
      ORDER BY created_at DESC
    `, [subscriptionId]);
    
    res.json({
      success: true,
      data: {
        subscription,
        features,
        changes
      }
    });
  } catch (error) {
    logger.error('获取订阅详情失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.post('/subscribe', authenticate, async (req, res) => {
  try {
    const { planId } = req.body;
    
    if (!planId) {
      return res.status(400).json({
        success: false,
        error: '请选择套餐'
      });
    }
    
    const plan = db.get(`
      SELECT * FROM plans WHERE id = ? AND status = 'active'
    `, [planId]);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: '套餐不存在或已下架'
      });
    }
    
    const existingActive = db.get(`
      SELECT * FROM subscriptions 
      WHERE user_id = ? AND status IN ('active', 'pending')
      LIMIT 1
    `, [req.user.id]);
    
    if (existingActive) {
      return res.status(400).json({
        success: false,
        error: '您已有活跃订阅'
      });
    }
    
    const billingEngine = new BillingCycleEngine();
    const billingPeriod = billingEngine.calculateFirstBillingPeriod(plan, plan.trial_days || 0);
    
    const subscriptionId = uuidv4();
    const now = moment();
    
    const subscription = {
      id: subscriptionId,
      user_id: req.user.id,
      plan_id: planId,
      status: 'pending',
      quantity: 1,
      current_period_start: billingPeriod.periodStart ? now.toISOString() : null,
      current_period_end: billingPeriod.periodEnd ? moment(billingPeriod.periodEnd).toISOString() : null,
      trial_start: billingPeriod.trialStart ? moment(billingPeriod.trialStart).toISOString() : null,
      trial_end: billingPeriod.trialEnd ? moment(billingPeriod.trialEnd).toISOString() : null,
      next_billing_at: billingPeriod.nextBillingAt ? moment(billingPeriod.nextBillingAt).toISOString() : null
    };
    
    db.run(`
      INSERT INTO subscriptions (
        id, user_id, plan_id, status, quantity,
        current_period_start, current_period_end, trial_start, trial_end,
        next_billing_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      subscription.id,
      subscription.user_id,
      subscription.plan_id,
      subscription.status,
      subscription.quantity,
      subscription.current_period_start,
      subscription.current_period_end,
      subscription.trial_start,
      subscription.trial_end,
      subscription.next_billing_at
    ]);
    
    db.run(`
      INSERT INTO subscription_changes (
        id, subscription_id, change_type, old_status, new_status, created_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      uuidv4(),
      subscriptionId,
      'create',
      null,
      'pending'
    ]);
    
    db.run(`
      INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [uuidv4(), req.user.id, 'create', 'subscription', subscriptionId]);
    
    logger.info(`用户 ${req.user.username} 创建订阅: ${subscriptionId}`);
    
    res.json({
      success: true,
      data: {
        subscription,
        plan,
        message: '订阅创建成功，请完成支付'
      }
    });
  } catch (error) {
    logger.error('创建订阅失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.post('/:subscriptionId/pay', authenticate, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { paymentMethod = 'mock' } = req.body;
    
    const subscription = db.get(`
      SELECT s.id, s.user_id, s.plan_id, s.status as subscription_status, s.quantity,
             s.current_period_start, s.current_period_end, s.trial_start, s.trial_end,
             s.cancel_at_period_end, s.cancelled_at, s.cancel_reason, s.next_billing_at,
             s.created_at, s.updated_at,
             p.name as plan_name, p.display_name, p.description, p.billing_cycle,
             p.price, p.currency, p.status as plan_status, p.trial_days
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.id = ? AND s.user_id = ?
    `, [subscriptionId, req.user.id]);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: '订阅不存在'
      });
    }
    
    if (subscription.subscription_status === 'active') {
      return res.status(400).json({
        success: false,
        error: '订阅已激活'
      });
    }
    
    const invoiceEngine = new InvoiceAutoGenEngine();
    const billingEngine = new BillingCycleEngine();
    const entitlementEngine = new EntitlementGateEngine();
    const notificationService = new NotificationService();
    
    const billingPeriod = billingEngine.calculateBillingPeriod(
      moment().toISOString(),
      subscription.billing_cycle
    );
    
    const invoice = invoiceEngine.generateInvoiceForSubscription(
      subscription, 
      { ...subscription, id: subscription.plan_id }
    );
    
    const paymentResult = await invoiceEngine.processInvoicePayment(
      invoice.id,
      paymentMethod,
      subscription.price
    );
    
    const now = moment();
    const nextBillingAt = billingEngine.calculateNextBillingDate(
      now.toISOString(),
      subscription.billing_cycle
    );
    
    const nativeDb = db.getDatabase();
    try {
      nativeDb.exec('BEGIN TRANSACTION');
      
      nativeDb.prepare(`
        UPDATE subscriptions 
        SET status = 'active',
            current_period_start = ?,
            current_period_end = ?,
            next_billing_at = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        moment(billingPeriod.periodStart).toISOString(),
        moment(billingPeriod.periodEnd).toISOString(),
        moment(nextBillingAt).toISOString(),
        subscriptionId
      );
      
      nativeDb.prepare(`
        INSERT INTO subscription_changes (
          id, subscription_id, change_type, old_status, new_status, created_at
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        uuidv4(),
        subscriptionId,
        'activate',
        subscription.subscription_status,
        'active'
      );
      
      nativeDb.exec('COMMIT');
    } catch (error) {
      try {
        nativeDb.exec('ROLLBACK');
      } catch (e) {
        // 忽略回滚错误
      }
      throw error;
    }
    
    const updatedSubscription = db.get('SELECT * FROM subscriptions WHERE id = ?', [subscriptionId]);
    const user = db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    
    entitlementEngine.grantEntitlementsForSubscription(subscriptionId, req.user.id);
    
    await notificationService.sendSubscriptionCreatedNotification(
      updatedSubscription,
      subscription,
      user
    );
    
    db.run(`
      INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [uuidv4(), req.user.id, 'payment', 'subscription', subscriptionId]);
    
    logger.info(`订阅 ${subscriptionId} 支付成功并激活`);
    
    const entitlements = entitlementEngine.getUserEntitlements(req.user.id);
    
    res.json({
      success: true,
      data: {
        subscription: updatedSubscription,
        payment: paymentResult,
        entitlements,
        message: '支付成功，订阅已激活'
      }
    });
  } catch (error) {
    logger.error('支付订阅失败:', error);
    res.status(500).json({
      success: false,
      error: '支付失败: ' + error.message
    });
  }
});

router.post('/:subscriptionId/cancel', authenticate, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { reason } = req.body;
    const isAdmin = req.user.permissions.includes('subscription:manage');
    
    let sql = 'SELECT * FROM subscriptions WHERE id = ?';
    const params = [subscriptionId];
    
    if (!isAdmin) {
      sql += ' AND user_id = ?';
      params.push(req.user.id);
    }
    
    const subscription = db.get(sql, params);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: '订阅不存在'
      });
    }
    
    if (subscription.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: '订阅已取消'
      });
    }
    
    const nativeDb = db.getDatabase();
    try {
      nativeDb.exec('BEGIN TRANSACTION');
      
      nativeDb.prepare(`
        UPDATE subscriptions 
        SET status = 'cancelled',
            cancel_at_period_end = 0,
            cancelled_at = CURRENT_TIMESTAMP,
            cancel_reason = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(reason || '用户主动取消', subscriptionId);
      
      nativeDb.prepare(`
        INSERT INTO subscription_changes (
          id, subscription_id, change_type, old_status, new_status, change_reason, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        uuidv4(),
        subscriptionId,
        'cancel',
        subscription.status,
        'cancelled',
        reason || '用户主动取消'
      );
      
      nativeDb.exec('COMMIT');
    } catch (error) {
      try {
        nativeDb.exec('ROLLBACK');
      } catch (e) {
        // 忽略回滚错误
      }
      throw error;
    }
    
    const entitlementEngine = new EntitlementGateEngine();
    entitlementEngine.suspendEntitlementsForSubscription(subscriptionId);
    
    const notificationService = new NotificationService();
    const user = db.get('SELECT * FROM users WHERE id = ?', [subscription.user_id]);
    const plan = db.get('SELECT * FROM plans WHERE id = ?', [subscription.plan_id]);
    
    if (user && plan) {
      const updatedSubscription = db.get('SELECT * FROM subscriptions WHERE id = ?', [subscriptionId]);
      await notificationService.sendSubscriptionCancelledNotification(
        updatedSubscription,
        plan,
        user
      );
    }
    
    db.run(`
      INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [uuidv4(), req.user.id, 'cancel', 'subscription', subscriptionId]);
    
    logger.info(`订阅 ${subscriptionId} 已取消 by ${req.user.username}`);
    
    res.json({
      success: true,
      message: '订阅已取消'
    });
  } catch (error) {
    logger.error('取消订阅失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.get('/:subscriptionId/entitlements', authenticate, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const isAdmin = req.user.permissions.includes('subscription:manage');
    
    let sql = `
      SELECT s.*
      FROM subscriptions s
      WHERE s.id = ?
    `;
    const params = [subscriptionId];
    
    if (!isAdmin) {
      sql += ' AND s.user_id = ?';
      params.push(req.user.id);
    }
    
    const subscription = db.get(sql, params);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: '订阅不存在'
      });
    }
    
    const entitlementEngine = new EntitlementGateEngine();
    const entitlements = entitlementEngine.getUserEntitlements(subscription.user_id);
    
    res.json({
      success: true,
      data: {
        entitlements
      }
    });
  } catch (error) {
    logger.error('获取订阅权益失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

module.exports = router;
