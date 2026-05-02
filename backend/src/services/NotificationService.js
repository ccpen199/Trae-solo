const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.db = db;
  }

  renderTemplate(template, variables) {
    if (!template) return null;
    
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      result = result.split(placeholder).join(String(value));
    }
    
    return result;
  }

  async sendNotification(options) {
    const { userId, roleId, type, templateKey, variables = {} } = options;
    
    logger.info(`发送通知: template=${templateKey}, user=${userId || roleId}`);
    
    const template = this.db.get(`
      SELECT * FROM notification_templates 
      WHERE template_key = ? AND is_active = 1
    `, [templateKey]);
    
    if (!template) {
      logger.warn(`通知模板不存在: ${templateKey}`);
      return { success: false, error: 'Template not found' };
    }
    
    const title = this.renderTemplate(template.title_template, variables);
    const content = this.renderTemplate(template.content_template, variables);
    
    const notification = {
      id: uuidv4(),
      user_id: userId || null,
      role_id: roleId || null,
      type: type || template.type,
      template_key: templateKey,
      title,
      content,
      status: 'pending',
      created_at: moment().toISOString()
    };
    
    const result = this.db.run(`
      INSERT INTO notifications (
        id, user_id, role_id, type, template_key, 
        title, content, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      notification.id,
      notification.user_id,
      notification.role_id,
      notification.type,
      notification.template_key,
      notification.title,
      notification.content,
      notification.status,
      notification.created_at
    ]);
    
    await this.simulateSend(notification.id);
    
    return {
      success: true,
      notificationId: notification.id,
      title: notification.title,
      content: notification.content
    };
  }

  async simulateSend(notificationId) {
    const notification = this.db.get('SELECT * FROM notifications WHERE id = ?', [notificationId]);
    
    if (!notification) return;
    
    const isSuccess = Math.random() > 0.01;
    
    if (isSuccess) {
      this.db.run(`
        UPDATE notifications 
        SET status = 'sent', 
            sent_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [notificationId]);
      
      logger.debug(`通知 ${notificationId} 发送成功`);
    } else {
      this.db.run(`
        UPDATE notifications 
        SET status = 'failed', 
            failure_reason = ?
        WHERE id = ?
      `, ['模拟发送失败', notificationId]);
      
      logger.warn(`通知 ${notificationId} 发送失败`);
    }
  }

  getNotifications(userId, options = {}) {
    const { status, limit = 50, offset = 0, unreadOnly = false } = options;
    
    let sql = `
      SELECT * FROM notifications 
      WHERE (user_id = ? OR role_id IN (
        SELECT ur.role_id FROM user_roles ur WHERE ur.user_id = ?
      ))
    `;
    const params = [userId, userId];
    
    if (unreadOnly) {
      sql += " AND (read_at IS NULL OR status != 'read')";
    }
    
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    return this.db.all(sql, params);
  }

  markAsRead(notificationId, userId) {
    const result = this.db.run(`
      UPDATE notifications 
      SET status = 'read', 
          read_at = CURRENT_TIMESTAMP
      WHERE id = ? AND (user_id = ? OR role_id IN (
        SELECT ur.role_id FROM user_roles ur WHERE ur.user_id = ?
      ))
    `, [notificationId, userId, userId]);
    
    return { success: result.success, marked: result.changes };
  }

  markAllAsRead(userId) {
    const result = this.db.run(`
      UPDATE notifications 
      SET status = 'read', 
          read_at = CURRENT_TIMESTAMP
      WHERE (user_id = ? OR role_id IN (
        SELECT ur.role_id FROM user_roles ur WHERE ur.user_id = ?
      ))
      AND (read_at IS NULL OR status != 'read')
    `, [userId, userId]);
    
    return { success: result.success, marked: result.changes };
  }

  getUnreadCount(userId) {
    const result = this.db.get(`
      SELECT COUNT(*) as count
      FROM notifications 
      WHERE (user_id = ? OR role_id IN (
        SELECT ur.role_id FROM user_roles ur WHERE ur.user_id = ?
      ))
      AND (read_at IS NULL OR status != 'read')
    `, [userId, userId]);
    
    return result?.count || 0;
  }

  sendRenewalReminder(subscription) {
    const user = this.db.get('SELECT * FROM users WHERE id = ?', [subscription.user_id]);
    const plan = this.db.get('SELECT * FROM plans WHERE id = ?', [subscription.plan_id]);
    
    if (!user || !plan) return { success: false, error: 'User or Plan not found' };
    
    const nextBillingDate = moment(subscription.next_billing_at);
    const expiryDate = moment(subscription.current_period_end);
    
    return this.sendNotification({
      userId: user.id,
      type: 'email',
      templateKey: 'renewal_reminder',
      variables: {
        userName: user.display_name || user.username,
        planName: plan.display_name,
        expiryDate: expiryDate.format('YYYY-MM-DD'),
        amount: plan.price.toFixed(2),
        nextBillingDate: nextBillingDate.format('YYYY-MM-DD')
      }
    });
  }

  sendSubscriptionCreatedNotification(subscription, plan, user) {
    const startDate = moment(subscription.current_period_start);
    const endDate = moment(subscription.current_period_end);
    
    return this.sendNotification({
      userId: user.id,
      type: 'email',
      templateKey: 'subscription_created',
      variables: {
        userName: user.display_name || user.username,
        planName: plan.display_name,
        price: plan.price.toFixed(2),
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD')
      }
    });
  }

  sendSubscriptionCancelledNotification(subscription, plan, user) {
    const cancelledAt = moment(subscription.cancelled_at || moment());
    const endDate = moment(subscription.current_period_end);
    
    return this.sendNotification({
      userId: user.id,
      type: 'email',
      templateKey: 'subscription_cancelled',
      variables: {
        userName: user.display_name || user.username,
        planName: plan.display_name,
        cancelledAt: cancelledAt.format('YYYY-MM-DD HH:mm'),
        endDate: endDate.format('YYYY-MM-DD')
      }
    });
  }
}

module.exports = { NotificationService };
