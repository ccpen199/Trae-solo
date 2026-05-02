const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const logger = require('../utils/logger');

class InvoiceAutoGenEngine {
  constructor() {
    this.db = db;
  }

  generateInvoiceNumber() {
    const prefix = 'INV';
    const date = moment().format('YYYYMMDD');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${date}-${random}`;
  }

  generateInvoiceForSubscription(subscription, plan) {
    logger.info(`为订阅 ${subscription.id} 生成账单`);
    
    const billingCycle = plan.billing_cycle;
    const now = moment();
    const periodStart = now.toDate();
    let periodEnd;
    
    switch (billingCycle) {
      case 'daily':
        periodEnd = moment(periodStart).add(1, 'day').subtract(1, 'second').toDate();
        break;
      case 'weekly':
        periodEnd = moment(periodStart).add(7, 'days').subtract(1, 'second').toDate();
        break;
      case 'monthly':
        periodEnd = moment(periodStart).add(1, 'month').subtract(1, 'second').toDate();
        break;
      case 'quarterly':
        periodEnd = moment(periodStart).add(3, 'months').subtract(1, 'second').toDate();
        break;
      case 'yearly':
        periodEnd = moment(periodStart).add(1, 'year').subtract(1, 'second').toDate();
        break;
      default:
        periodEnd = moment(periodStart).add(1, 'month').subtract(1, 'second').toDate();
    }
    
    const dueAt = moment().add(1, 'day').toDate();
    const invoiceNumber = this.generateInvoiceNumber();
    
    const invoice = {
      id: uuidv4(),
      subscription_id: subscription.id,
      user_id: subscription.user_id,
      invoice_number: invoiceNumber,
      status: 'open',
      amount_due: plan.price,
      amount_paid: 0,
      currency: plan.currency || 'CNY',
      billing_period_start: periodStart,
      billing_period_end: periodEnd,
      due_at: dueAt,
      period_start: periodStart,
      period_end: periodEnd,
      total_amount: plan.price
    };
    
    this.db.run(`
      INSERT INTO invoices (
        id, subscription_id, user_id, invoice_number, status, 
        amount_due, amount_paid, currency, billing_period_start, 
        billing_period_end, due_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      invoice.id,
      invoice.subscription_id,
      invoice.user_id,
      invoice.invoice_number,
      invoice.status,
      invoice.amount_due,
      invoice.amount_paid,
      invoice.currency,
      moment(invoice.billing_period_start).toISOString(),
      moment(invoice.billing_period_end).toISOString(),
      moment(invoice.due_at).toISOString()
    ]);
    
    this.db.run(`
      INSERT INTO invoice_items (id, invoice_id, description, unit_price, quantity, amount, plan_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      uuidv4(),
      invoice.id,
      `${plan.display_name} - ${this.getCycleDisplayName(plan.billing_cycle)}`,
      plan.price,
      1,
      plan.price,
      plan.id
    ]);
    
    logger.info(`账单 ${invoice.invoice_number} 已创建`);
    return invoice;
  }

  generateInvoiceForRenewal(subscription) {
    logger.info(`为订阅 ${subscription.id} 生成续期账单`);
    
    const plan = this.db.get('SELECT * FROM plans WHERE id = ?', [subscription.plan_id]);
    
    if (!plan) {
      throw new Error(`套餐 ${subscription.plan_id} 不存在`);
    }
    
    const currentEnd = moment(subscription.current_period_end);
    const periodStart = currentEnd.toDate();
    let periodEnd;
    
    switch (plan.billing_cycle) {
      case 'daily':
        periodEnd = moment(periodStart).add(1, 'day').subtract(1, 'second').toDate();
        break;
      case 'weekly':
        periodEnd = moment(periodStart).add(7, 'days').subtract(1, 'second').toDate();
        break;
      case 'monthly':
        periodEnd = moment(periodStart).add(1, 'month').subtract(1, 'second').toDate();
        break;
      case 'quarterly':
        periodEnd = moment(periodStart).add(3, 'months').subtract(1, 'second').toDate();
        break;
      case 'yearly':
        periodEnd = moment(periodStart).add(1, 'year').subtract(1, 'second').toDate();
        break;
      default:
        periodEnd = moment(periodStart).add(1, 'month').subtract(1, 'second').toDate();
    }
    
    const dueAt = moment(periodStart).add(1, 'day').toDate();
    const invoiceNumber = this.generateInvoiceNumber();
    
    const invoice = {
      id: uuidv4(),
      subscription_id: subscription.id,
      user_id: subscription.user_id,
      invoice_number: invoiceNumber,
      status: 'draft',
      amount_due: plan.price,
      amount_paid: 0,
      currency: plan.currency || 'CNY',
      billing_period_start: periodStart,
      billing_period_end: periodEnd,
      due_at: dueAt
    };
    
    this.db.run(`
      INSERT INTO invoices (
        id, subscription_id, user_id, invoice_number, status, 
        amount_due, amount_paid, currency, billing_period_start, 
        billing_period_end, due_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      invoice.id,
      invoice.subscription_id,
      invoice.user_id,
      invoice.invoice_number,
      invoice.status,
      invoice.amount_due,
      invoice.amount_paid,
      invoice.currency,
      invoice.billing_period_start.toISOString(),
      invoice.billing_period_end.toISOString(),
      invoice.due_at.toISOString()
    ]);
    
    this.db.run(`
      INSERT INTO invoice_items (id, invoice_id, description, unit_amount, quantity, amount, plan_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      uuidv4(),
      invoice.id,
      `${plan.display_name} - ${this.getCycleDisplayName(plan.billing_cycle)}`,
      plan.price,
      1,
      plan.price,
      plan.id
    ]);
    
    logger.info(`账单 ${invoice.invoice_number} 已创建`);
    return invoice;
  }

  getCycleDisplayName(cycle) {
    const names = {
      'daily': '日付',
      'weekly': '周付',
      'monthly': '月付',
      'quarterly': '季付',
      'yearly': '年付'
    };
    return names[cycle] || '月付';
  }

  generateReceipt(invoice) {
    logger.info(`为账单 ${invoice.invoice_number} 生成电子收据`);
    
    const receipt = {
      receiptNumber: `RCP-${invoice.invoice_number}`,
      invoiceNumber: invoice.invoice_number,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      paidAt: invoice.paid_at,
      issuedAt: moment().toISOString(),
      details: {
        subscriptionId: invoice.subscription_id,
        billingPeriod: {
          start: invoice.billing_period_start,
          end: invoice.billing_period_end
        }
      }
    };
    
    return receipt;
  }

  async processInvoicePayment(invoiceId, paymentMethod, amount) {
    logger.info(`处理账单 ${invoiceId} 的支付`);
    
    const nativeDb = this.db.getDatabase();
    
    try {
      nativeDb.exec('BEGIN TRANSACTION');
      
      const invoice = nativeDb.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
      
      if (!invoice) {
        nativeDb.exec('ROLLBACK');
        throw new Error(`账单 ${invoiceId} 不存在`);
      }
      
      if (invoice.status === 'paid') {
        nativeDb.exec('ROLLBACK');
        throw new Error(`账单 ${invoiceId} 已支付`);
      }
      
      const paymentId = uuidv4();
      const paidAt = moment().toISOString();
      
      nativeDb.prepare(`
        INSERT INTO payments (
          id, invoice_id, subscription_id, user_id, 
          payment_method, amount, currency, status, 
          paid_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        paymentId,
        invoice.id,
        invoice.subscription_id,
        invoice.user_id,
        paymentMethod,
        amount,
        invoice.currency,
        'succeeded',
        paidAt
      );
      
      const newAmountPaid = (invoice.amount_paid || 0) + amount;
      const isFullyPaid = newAmountPaid >= invoice.amount_due;
      
      nativeDb.prepare(`
        UPDATE invoices 
        SET amount_paid = ?,
            status = ?,
            paid_at = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        newAmountPaid,
        isFullyPaid ? 'paid' : invoice.status,
        isFullyPaid ? paidAt : invoice.paid_at,
        invoice.id
      );
      
      const subscription = nativeDb.prepare('SELECT * FROM subscriptions WHERE id = ?').get(invoice.subscription_id);
      
      if (subscription && subscription.status === 'past_due') {
        nativeDb.prepare(`
          UPDATE subscriptions 
          SET status = 'active',
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(subscription.id);
        
        nativeDb.prepare(`
          INSERT INTO subscription_changes (id, subscription_id, change_type, old_status, new_status, created_at)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(
          uuidv4(),
          subscription.id,
          'reactivate',
          'past_due',
          'active'
        );
        
        const { EntitlementGateEngine } = require('./EntitlementGateEngine');
        const entitlementEngine = new EntitlementGateEngine();
        entitlementEngine.restoreEntitlementsForSubscription(subscription.id);
      }
      
      nativeDb.exec('COMMIT');
      
      const result = {
        paymentId,
        invoiceId,
        amount,
        paidAt,
        isFullyPaid
      };
      
      const { NotificationService } = require('../services/NotificationService');
      const notificationService = new NotificationService();
      
      const user = this.db.get('SELECT * FROM users WHERE id = ?', [
        this.db.get('SELECT user_id FROM invoices WHERE id = ?', [invoiceId]).user_id
      ]);
      
      if (user && result.isFullyPaid) {
        const invoiceData = this.db.get('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
        await notificationService.sendNotification({
          userId: user.id,
          type: 'email',
          templateKey: 'payment_success',
          variables: {
            userName: user.display_name || user.username,
            invoiceNumber: invoiceData.invoice_number,
            amount: invoiceData.amount_due.toFixed(2),
            paymentTime: moment().format('YYYY-MM-DD HH:mm:ss'),
            billingPeriod: `${moment(invoiceData.billing_period_start).format('YYYY-MM-DD')} 至 ${moment(invoiceData.billing_period_end).format('YYYY-MM-DD')}`
          }
        });
      }
      
      logger.info(`账单 ${invoiceId} 支付处理完成`);
      return result;
    } catch (error) {
      try {
        nativeDb.exec('ROLLBACK');
      } catch (e) {
        // 忽略回滚错误
      }
      logger.error(`处理账单支付失败:`, error);
      throw error;
    }
  }

  getInvoiceWithDetails(invoiceId) {
    const invoice = this.db.get('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
    
    if (!invoice) return null;
    
    const items = this.db.all('SELECT * FROM invoice_items WHERE invoice_id = ?', [invoiceId]);
    const payments = this.db.all('SELECT * FROM payments WHERE invoice_id = ?', [invoiceId]);
    const subscription = this.db.get(`
      SELECT s.*, p.display_name as plan_name
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.id = ?
    `, [invoice.subscription_id]);
    
    return {
      ...invoice,
      items,
      payments,
      subscription
    };
  }

  getInvoicesByUser(userId, options = {}) {
    const { status, limit = 50, offset = 0 } = options;
    
    let sql = `
      SELECT i.*, p.display_name as plan_name
      FROM invoices i
      JOIN subscriptions s ON i.subscription_id = s.id
      JOIN plans p ON s.plan_id = p.id
      WHERE i.user_id = ?
    `;
    const params = [userId];
    
    if (status) {
      sql += ' AND i.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    return this.db.all(sql, params);
  }
}

module.exports = { InvoiceAutoGenEngine };
