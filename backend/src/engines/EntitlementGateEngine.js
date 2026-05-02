const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const logger = require('../utils/logger');

class EntitlementGateEngine {
  constructor() {
    this.db = db;
  }

  grantEntitlementsForSubscription(subscriptionId, userId) {
    logger.info(`为订阅 ${subscriptionId} 授予权益`);
    
    const subscription = this.db.get(`
      SELECT s.*, p.id as plan_id
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.id = ?
    `, [subscriptionId]);
    
    if (!subscription) {
      throw new Error(`订阅 ${subscriptionId} 不存在`);
    }
    
    const features = this.db.all(`
      SELECT * FROM plan_features WHERE plan_id = ? ORDER BY sort_order
    `, [subscription.plan_id]);
    
    const validFrom = moment().toISOString();
    let validTo = subscription.current_period_end;
    
    if (!validTo && subscription.next_billing_at) {
      validTo = subscription.next_billing_at;
    }
    
    const nativeDb = this.db.getDatabase();
    
    try {
      nativeDb.exec('BEGIN TRANSACTION');
      
      for (const feature of features) {
        const existing = nativeDb.prepare(`
          SELECT * FROM entitlements 
          WHERE user_id = ? AND subscription_id = ? AND feature_key = ?
        `).get(userId, subscriptionId, feature.feature_key);
        
        if (existing) {
          nativeDb.prepare(`
            UPDATE entitlements 
            SET feature_value = ?, is_active = 1, valid_from = ?, valid_to = ?
            WHERE id = ?
          `).run(feature.feature_value, validFrom, validTo, existing.id);
        } else {
          nativeDb.prepare(`
            INSERT INTO entitlements (
              id, user_id, subscription_id, feature_key, 
              feature_value, is_active, valid_from, valid_to
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            uuidv4(),
            userId,
            subscriptionId,
            feature.feature_key,
            feature.feature_value,
            1,
            validFrom,
            validTo
          );
        }
      }
      
      nativeDb.exec('COMMIT');
      
      const result = { granted: features.length };
      logger.info(`订阅 ${subscriptionId} 权益授予完成，共 ${result.granted} 项`);
      return result;
    } catch (error) {
      try {
        nativeDb.exec('ROLLBACK');
      } catch (e) {
        // 忽略回滚错误
      }
      logger.error(`授予权益失败:`, error);
      throw error;
    }
  }

  suspendEntitlementsForSubscription(subscriptionId) {
    logger.warn(`暂停订阅 ${subscriptionId} 的权益`);
    
    const result = this.db.run(`
      UPDATE entitlements 
      SET is_active = 0 
      WHERE subscription_id = ?
    `, [subscriptionId]);
    
    logger.info(`已暂停 ${result.changes} 项权益`);
    
    const subscription = this.db.get('SELECT * FROM subscriptions WHERE id = ?', [subscriptionId]);
    if (subscription) {
      const { NotificationService } = require('../services/NotificationService');
      const notificationService = new NotificationService();
      
      notificationService.sendNotification({
        userId: subscription.user_id,
        type: 'in_app',
        templateKey: 'entitlement_suspended',
        variables: {}
      }).catch(e => logger.error('发送通知失败', e));
    }
    
    return { suspended: result.changes };
  }

  restoreEntitlementsForSubscription(subscriptionId) {
    logger.info(`恢复订阅 ${subscriptionId} 的权益`);
    
    const subscription = this.db.get(`
      SELECT s.*, p.id as plan_id
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.id = ?
    `, [subscriptionId]);
    
    if (!subscription) {
      throw new Error(`订阅 ${subscriptionId} 不存在`);
    }
    
    const result = this.db.run(`
      UPDATE entitlements 
      SET is_active = 1 
      WHERE subscription_id = ?
    `, [subscriptionId]);
    
    if (result.changes === 0) {
      return this.grantEntitlementsForSubscription(subscriptionId, subscription.user_id);
    }
    
    logger.info(`已恢复 ${result.changes} 项权益`);
    return { restored: result.changes };
  }

  checkUserEntitlement(userId, featureKey) {
    const entitlement = this.db.get(`
      SELECT e.*, s.status as subscription_status
      FROM entitlements e
      LEFT JOIN subscriptions s ON e.subscription_id = s.id
      WHERE e.user_id = ? 
        AND e.feature_key = ? 
        AND e.is_active = 1
        AND (e.valid_to IS NULL OR e.valid_to >= CURRENT_TIMESTAMP)
      ORDER BY e.created_at DESC
      LIMIT 1
    `, [userId, featureKey]);
    
    if (!entitlement) {
      return {
        hasEntitlement: false,
        reason: 'No active entitlement found'
      };
    }
    
    if (entitlement.subscription_status && 
        ['past_due', 'cancelled', 'expired'].includes(entitlement.subscription_status)) {
      return {
        hasEntitlement: false,
        reason: 'Subscription is not active',
        subscriptionStatus: entitlement.subscription_status
      };
    }
    
    return {
      hasEntitlement: true,
      entitlement: {
        featureKey: entitlement.feature_key,
        featureValue: entitlement.feature_value,
        validFrom: entitlement.valid_from,
        validTo: entitlement.valid_to
      }
    };
  }

  getUserEntitlements(userId) {
    const entitlements = this.db.all(`
      SELECT e.*, p.display_name as plan_name, s.status as subscription_status
      FROM entitlements e
      LEFT JOIN subscriptions s ON e.subscription_id = s.id
      LEFT JOIN plans p ON s.plan_id = p.id
      WHERE e.user_id = ?
      ORDER BY e.is_active DESC, e.created_at DESC
    `, [userId]);
    
    return entitlements;
  }

  recordEntitlementUsage(entitlementId, userId, details = {}) {
    const entitlement = this.db.get('SELECT * FROM entitlements WHERE id = ?', [entitlementId]);
    
    if (!entitlement) {
      throw new Error(`权益 ${entitlementId} 不存在`);
    }
    
    const result = this.db.run(`
      INSERT INTO entitlement_usage (id, entitlement_id, user_id, usage_count, usage_details, created_at)
      VALUES (?, ?, ?, 1, ?, CURRENT_TIMESTAMP)
    `, [
      uuidv4(),
      entitlementId,
      userId,
      JSON.stringify(details)
    ]);
    
    logger.debug(`记录权益使用: ${entitlementId}`);
    return { success: true, usageId: result.lastInsertRowid };
  }

  validateRequest(userId, featureKey, requiredValue = null) {
    const check = this.checkUserEntitlement(userId, featureKey);
    
    if (!check.hasEntitlement) {
      return {
        allowed: false,
        reason: check.reason,
        subscriptionStatus: check.subscriptionStatus
      };
    }
    
    if (requiredValue !== null) {
      const actualValue = check.entitlement.featureValue;
      
      if (actualValue === '无限制' || actualValue === '支持') {
        return {
          allowed: true,
          entitlement: check.entitlement
        };
      }
      
      const actualNumeric = parseFloat(actualValue);
      const requiredNumeric = parseFloat(requiredValue);
      
      if (!isNaN(actualNumeric) && !isNaN(requiredNumeric)) {
        if (actualNumeric < requiredNumeric) {
          return {
            allowed: false,
            reason: `Insufficient entitlement: required ${requiredValue}, has ${actualValue}`
          };
        }
      }
    }
    
    return {
      allowed: true,
      entitlement: check.entitlement
    };
  }

  getEntitlementUsageStats(userId, featureKey, startDate, endDate) {
    const usage = this.db.all(`
      SELECT 
        COUNT(*) as total_uses,
        DATE(eu.created_at) as usage_date
      FROM entitlement_usage eu
      JOIN entitlements e ON eu.entitlement_id = e.id
      WHERE e.user_id = ? 
        AND e.feature_key = ?
        AND eu.created_at >= ?
        AND eu.created_at <= ?
      GROUP BY DATE(eu.created_at)
      ORDER BY usage_date
    `, [userId, featureKey, startDate, endDate]);
    
    return usage;
  }

  revokeExpiredEntitlements() {
    logger.info('清理过期权益');
    
    const result = this.db.run(`
      UPDATE entitlements 
      SET is_active = 0 
      WHERE is_active = 1 
        AND valid_to IS NOT NULL 
        AND valid_to < CURRENT_TIMESTAMP
    `);
    
    if (result.changes > 0) {
      logger.info(`已停用 ${result.changes} 个过期权益`);
    }
    
    return { revoked: result.changes };
  }
}

module.exports = { EntitlementGateEngine };
