const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const logger = require('../utils/logger');

class BillingCycleEngine {
  constructor() {
    this.db = db;
  }

  calculateNextBillingDate(currentDate, billingCycle) {
    const m = moment(currentDate);
    
    switch (billingCycle) {
      case 'daily':
        return m.add(1, 'day').toDate();
      case 'weekly':
        return m.add(7, 'days').toDate();
      case 'monthly':
        return m.add(1, 'month').toDate();
      case 'quarterly':
        return m.add(3, 'months').toDate();
      case 'yearly':
        return m.add(1, 'year').toDate();
      default:
        return m.add(1, 'month').toDate();
    }
  }

  calculateBillingPeriod(startDate, billingCycle) {
    const m = moment(startDate);
    const periodStart = m.toDate();
    let periodEnd;
    
    switch (billingCycle) {
      case 'daily':
        periodEnd = m.add(1, 'day').subtract(1, 'second').toDate();
        break;
      case 'weekly':
        periodEnd = m.add(7, 'days').subtract(1, 'second').toDate();
        break;
      case 'monthly':
        periodEnd = m.add(1, 'month').subtract(1, 'second').toDate();
        break;
      case 'quarterly':
        periodEnd = m.add(3, 'months').subtract(1, 'second').toDate();
        break;
      case 'yearly':
        periodEnd = m.add(1, 'year').subtract(1, 'second').toDate();
        break;
      default:
        periodEnd = m.add(1, 'month').subtract(1, 'second').toDate();
    }
    
    return { periodStart, periodEnd };
  }

  calculateFirstBillingPeriod(plan, trialDays = 0) {
    const now = moment();
    let startDate = now.toDate();
    let endDate;
    
    if (trialDays > 0) {
      const trialStart = now.toDate();
      const trialEnd = now.add(trialDays, 'days').toDate();
      
      const paidPeriod = this.calculateBillingPeriod(trialEnd, plan.billing_cycle);
      
      return {
        trialStart,
        trialEnd,
        periodStart: paidPeriod.periodStart,
        periodEnd: paidPeriod.periodEnd,
        nextBillingAt: paidPeriod.periodStart
      };
    } else {
      const period = this.calculateBillingPeriod(startDate, plan.billing_cycle);
      return {
        trialStart: null,
        trialEnd: null,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        nextBillingAt: period.periodStart
      };
    }
  }

  async processDailyBilling() {
    logger.info('开始每日账单处理...');
    
    try {
      const now = moment().toISOString();
      
      const subscriptionsToRenew = this.db.all(`
        SELECT s.*, p.name as plan_name, p.price, p.billing_cycle
        FROM subscriptions s
        JOIN plans p ON s.plan_id = p.id
        WHERE s.status = 'active'
        AND s.next_billing_at <= ?
      `, [now]);
      
      logger.info(`发现 ${subscriptionsToRenew.length} 个需要续期的订阅`);
      
      for (const subscription of subscriptionsToRenew) {
        await this.renewSubscription(subscription);
      }
      
      logger.info('每日账单处理完成');
      return { success: true, processed: subscriptionsToRenew.length };
    } catch (error) {
      logger.error('每日账单处理失败:', error);
      return { success: false, error: error.message };
    }
  }

  async renewSubscription(subscription) {
    const { InvoiceAutoGenEngine } = require('./InvoiceAutoGenEngine');
    const invoiceEngine = new InvoiceAutoGenEngine();
    
    const nativeDb = this.db.getDatabase();
    
    try {
      nativeDb.exec('BEGIN TRANSACTION');
      
      const invoice = invoiceEngine.generateInvoiceForRenewal(subscription);
      
      const newNextBillingAt = this.calculateNextBillingDate(
        subscription.current_period_end,
        subscription.billing_cycle || 'monthly'
      );
      
      nativeDb.prepare(`
        UPDATE subscriptions 
        SET current_period_start = ?,
            current_period_end = ?,
            next_billing_at = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        invoice.billing_period_start,
        invoice.billing_period_end,
        newNextBillingAt.toISOString(),
        subscription.id
      );
      
      nativeDb.prepare(`
        INSERT INTO subscription_changes (id, subscription_id, change_type, old_status, new_status, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        uuidv4(),
        subscription.id,
        'renew',
        'active',
        'active'
      );
      
      nativeDb.exec('COMMIT');
      
      const result = { invoice, newNextBillingAt };
      logger.info(`订阅 ${subscription.id} 续期处理完成，生成账单 ${result.invoice.invoice_number}`);
      return result;
    } catch (error) {
      try {
        nativeDb.exec('ROLLBACK');
      } catch (e) {
        // 忽略回滚错误
      }
      logger.error(`订阅 ${subscription.id} 续期处理失败:`, error);
      throw error;
    }
  }

  async handlePaymentFailure(subscription, invoice, failureReason) {
    logger.warn(`处理订阅 ${subscription.id} 的支付失败`);
    
    const nativeDb = this.db.getDatabase();
    
    try {
      nativeDb.exec('BEGIN TRANSACTION');
      
      nativeDb.prepare(`
        UPDATE subscriptions 
        SET status = 'past_due',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(subscription.id);
      
      nativeDb.prepare(`
        UPDATE invoices 
        SET status = 'open'
        WHERE id = ?
      `).run(invoice.id);
      
      nativeDb.prepare(`
        INSERT INTO subscription_changes (id, subscription_id, change_type, old_status, new_status, change_reason, created_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        uuidv4(),
        subscription.id,
        'payment_failed',
        'active',
        'past_due',
        failureReason
      );
      
      nativeDb.exec('COMMIT');
      
      const { NotificationService } = require('../services/NotificationService');
      const notificationService = new NotificationService();
      
      const user = this.db.get('SELECT * FROM users WHERE id = ?', [subscription.user_id]);
      
      if (user) {
        await notificationService.sendNotification({
          userId: user.id,
          type: 'email',
          templateKey: 'payment_failed',
          variables: {
            userName: user.display_name || user.username,
            invoiceNumber: invoice.invoice_number,
            amount: invoice.amount_due.toFixed(2),
            failureReason: failureReason
          }
        });
      }
      
      return { success: true };
    } catch (error) {
      try {
        nativeDb.exec('ROLLBACK');
      } catch (e) {
        // 忽略回滚错误
      }
      logger.error(`处理支付失败时出错:`, error);
      throw error;
    }
  }

  getDaysUntilNextBilling(subscription) {
    if (!subscription.next_billing_at) return null;
    
    const now = moment();
    const nextBilling = moment(subscription.next_billing_at);
    
    return nextBilling.diff(now, 'days');
  }

  isTrialActive(subscription) {
    if (!subscription.trial_end) return false;
    
    const now = moment();
    const trialEnd = moment(subscription.trial_end);
    
    return now.isBefore(trialEnd);
  }
}

module.exports = { BillingCycleEngine };
