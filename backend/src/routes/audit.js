const express = require('express');
const db = require('../database');
const logger = require('../utils/logger');
const { authenticate, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/logs', authenticate, requirePermission(['audit:log', 'finance:audit']), async (req, res) => {
  try {
    const { userId, action, resourceType, limit = 100, offset = 0 } = req.query;
    
    let sql = `
      SELECT 
        al.*,
        u.username as user_username,
        u.display_name as user_display_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (userId) {
      sql += ' AND al.user_id = ?';
      params.push(userId);
    }
    
    if (action) {
      sql += ' AND al.action = ?';
      params.push(action);
    }
    
    if (resourceType) {
      sql += ' AND al.resource_type = ?';
      params.push(resourceType);
    }
    
    sql += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const logs = db.all(sql, params);
    
    let countSql = `
      SELECT COUNT(*) as total
      FROM audit_logs al
      WHERE 1=1
    `;
    const countParams = [];
    
    if (userId) {
      countSql += ' AND al.user_id = ?';
      countParams.push(userId);
    }
    
    if (action) {
      countSql += ' AND al.action = ?';
      countParams.push(action);
    }
    
    if (resourceType) {
      countSql += ' AND al.resource_type = ?';
      countParams.push(resourceType);
    }
    
    const countResult = db.get(countSql, countParams);
    
    res.json({
      success: true,
      data: {
        logs,
        total: countResult?.total || 0
      }
    });
  } catch (error) {
    logger.error('获取审计日志失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.get('/logs/:logId', authenticate, requirePermission(['audit:log', 'finance:audit']), async (req, res) => {
  try {
    const { logId } = req.params;
    
    const log = db.get(`
      SELECT 
        al.*,
        u.username as user_username,
        u.display_name as user_display_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.id = ?
    `, [logId]);
    
    if (!log) {
      return res.status(404).json({
        success: false,
        error: '日志不存在'
      });
    }
    
    res.json({
      success: true,
      data: {
        log
      }
    });
  } catch (error) {
    logger.error('获取审计日志详情失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.get('/actions', authenticate, requirePermission(['audit:log', 'finance:audit']), async (req, res) => {
  try {
    const actions = db.all(`
      SELECT DISTINCT action FROM audit_logs ORDER BY action
    `);
    
    res.json({
      success: true,
      data: {
        actions: actions.map(a => a.action)
      }
    });
  } catch (error) {
    logger.error('获取操作类型失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.get('/resource-types', authenticate, requirePermission(['audit:log', 'finance:audit']), async (req, res) => {
  try {
    const resourceTypes = db.all(`
      SELECT DISTINCT resource_type FROM audit_logs 
      WHERE resource_type IS NOT NULL
      ORDER BY resource_type
    `);
    
    res.json({
      success: true,
      data: {
        resourceTypes: resourceTypes.map(r => r.resource_type)
      }
    });
  } catch (error) {
    logger.error('获取资源类型失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.get('/subscription/:subscriptionId', authenticate, requirePermission(['audit:log', 'finance:audit']), async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const logs = db.all(`
      SELECT 
        al.*,
        u.username as user_username,
        u.display_name as user_display_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.resource_type = 'subscription' 
        AND al.resource_id = ?
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `, [subscriptionId, parseInt(limit), parseInt(offset)]);
    
    const subscription = db.get(`
      SELECT s.*, p.display_name as plan_name, u.display_name as user_name
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [subscriptionId]);
    
    const changes = db.all(`
      SELECT * FROM subscription_changes 
      WHERE subscription_id = ? 
      ORDER BY created_at DESC
    `, [subscriptionId]);
    
    res.json({
      success: true,
      data: {
        subscription,
        logs,
        changes,
        total: logs.length
      }
    });
  } catch (error) {
    logger.error('获取订阅审计记录失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.get('/user/:userId', authenticate, requirePermission(['audit:log', 'finance:audit']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 100, offset = 0 } = req.query;
    
    const logs = db.all(`
      SELECT 
        al.*,
        u.username as user_username,
        u.display_name as user_display_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.user_id = ?
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, parseInt(limit), parseInt(offset)]);
    
    const user = db.get(`
      SELECT * FROM users WHERE id = ?
    `, [userId]);
    
    const userRoles = db.all(`
      SELECT r.* FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ?
    `, [userId]);
    
    const subscriptions = db.all(`
      SELECT s.*, p.display_name as plan_name
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `, [userId]);
    
    res.json({
      success: true,
      data: {
        user,
        roles: userRoles,
        subscriptions,
        logs,
        total: logs.length
      }
    });
  } catch (error) {
    logger.error('获取用户审计记录失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.get('/invoice/:invoiceId', authenticate, requirePermission(['audit:log', 'finance:audit']), async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    const invoice = db.get(`
      SELECT i.*,
             s.status as subscription_status,
             p.display_name as plan_name,
             u.username as user_username,
             u.display_name as user_display_name
      FROM invoices i
      JOIN subscriptions s ON i.subscription_id = s.id
      JOIN plans p ON s.plan_id = p.id
      JOIN users u ON i.user_id = u.id
      WHERE i.id = ?
    `, [invoiceId]);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: '账单不存在'
      });
    }
    
    const items = db.all(`
      SELECT * FROM invoice_items WHERE invoice_id = ?
    `, [invoiceId]);
    
    const payments = db.all(`
      SELECT * FROM payments WHERE invoice_id = ? ORDER BY created_at DESC
    `, [invoiceId]);
    
    const logs = db.all(`
      SELECT * FROM audit_logs 
      WHERE resource_type = 'invoice' AND resource_id = ?
      ORDER BY created_at DESC
    `, [invoiceId]);
    
    res.json({
      success: true,
      data: {
        invoice,
        items,
        payments,
        logs
      }
    });
  } catch (error) {
    logger.error('获取账单审计记录失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

module.exports = router;
