const express = require('express');
const db = require('../database');
const logger = require('../utils/logger');
const { authenticate, requirePermission } = require('../middleware/auth');
const { InvoiceAutoGenEngine } = require('../engines/InvoiceAutoGenEngine');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const isFinance = req.user.permissions.includes('finance:report');
    const isAdmin = req.user.permissions.includes('subscription:manage');
    const canViewAll = isFinance || isAdmin;
    
    let sql = `
      SELECT i.*, 
             p.display_name as plan_name,
             u.username as user_username,
             u.display_name as user_display_name
      FROM invoices i
      JOIN subscriptions s ON i.subscription_id = s.id
      JOIN plans p ON s.plan_id = p.id
      JOIN users u ON i.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (!canViewAll) {
      sql += ' AND i.user_id = ?';
      params.push(req.user.id);
    }
    
    if (status) {
      sql += ' AND i.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const invoices = db.all(sql, params);
    
    let countSql = `
      SELECT COUNT(*) as total
      FROM invoices i
      WHERE 1=1
    `;
    const countParams = [];
    
    if (!canViewAll) {
      countSql += ' AND i.user_id = ?';
      countParams.push(req.user.id);
    }
    
    if (status) {
      countSql += ' AND i.status = ?';
      countParams.push(status);
    }
    
    const countResult = db.get(countSql, countParams);
    
    res.json({
      success: true,
      data: {
        invoices,
        total: countResult?.total || 0
      }
    });
  } catch (error) {
    logger.error('获取账单列表失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.get('/:invoiceId', authenticate, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const isFinance = req.user.permissions.includes('finance:report');
    const isAdmin = req.user.permissions.includes('subscription:manage');
    const canViewAll = isFinance || isAdmin;
    
    let sql = `
      SELECT i.*,
             s.status as subscription_status,
             p.display_name as plan_name,
             p.billing_cycle,
             u.username as user_username,
             u.display_name as user_display_name,
             u.email as user_email
      FROM invoices i
      JOIN subscriptions s ON i.subscription_id = s.id
      JOIN plans p ON s.plan_id = p.id
      JOIN users u ON i.user_id = u.id
      WHERE i.id = ?
    `;
    const params = [invoiceId];
    
    if (!canViewAll) {
      sql += ' AND i.user_id = ?';
      params.push(req.user.id);
    }
    
    const invoice = db.get(sql, params);
    
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
    
    res.json({
      success: true,
      data: {
        invoice,
        items,
        payments
      }
    });
  } catch (error) {
    logger.error('获取账单详情失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.post('/:invoiceId/pay', authenticate, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { paymentMethod = 'mock' } = req.body;
    
    const isFinance = req.user.permissions.includes('finance:report');
    const isAdmin = req.user.permissions.includes('subscription:manage');
    const canPayForAll = isFinance || isAdmin;
    
    let sql = 'SELECT * FROM invoices WHERE id = ?';
    const params = [invoiceId];
    
    if (!canPayForAll) {
      sql += ' AND user_id = ?';
      params.push(req.user.id);
    }
    
    const invoice = db.get(sql, params);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: '账单不存在'
      });
    }
    
    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        error: '账单已支付'
      });
    }
    
    const invoiceEngine = new InvoiceAutoGenEngine();
    const result = await invoiceEngine.processInvoicePayment(
      invoiceId,
      paymentMethod,
      invoice.amount_due - (invoice.amount_paid || 0)
    );
    
    const updatedInvoice = db.get('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
    
    logger.info(`账单 ${invoiceId} 支付完成 by ${req.user.username}`);
    
    res.json({
      success: true,
      data: {
        invoice: updatedInvoice,
        payment: result
      }
    });
  } catch (error) {
    logger.error('支付账单失败:', error);
    res.status(500).json({
      success: false,
      error: '支付失败: ' + error.message
    });
  }
});

router.get('/:invoiceId/receipt', authenticate, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const isFinance = req.user.permissions.includes('finance:report');
    const isAdmin = req.user.permissions.includes('subscription:manage');
    const canViewAll = isFinance || isAdmin;
    
    let sql = 'SELECT * FROM invoices WHERE id = ? AND status = ?';
    const params = [invoiceId, 'paid'];
    
    if (!canViewAll) {
      sql += ' AND user_id = ?';
      params.push(req.user.id);
    }
    
    const invoice = db.get(sql, params);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: '账单不存在或未支付'
      });
    }
    
    const invoiceEngine = new InvoiceAutoGenEngine();
    const receipt = invoiceEngine.generateReceipt(invoice);
    
    const items = db.all('SELECT * FROM invoice_items WHERE invoice_id = ?', [invoiceId]);
    
    res.json({
      success: true,
      data: {
        receipt,
        invoice,
        items
      }
    });
  } catch (error) {
    logger.error('获取收据失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.post('/:invoiceId/void', authenticate, requirePermission(['finance:audit', 'finance:report']), async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { reason } = req.body;
    
    const invoice = db.get('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: '账单不存在'
      });
    }
    
    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        error: '已支付账单不能作废'
      });
    }
    
    if (invoice.status === 'void') {
      return res.status(400).json({
        success: false,
        error: '账单已作废'
      });
    }
    
    db.run(`
      UPDATE invoices 
      SET status = 'void',
          voided_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [invoiceId]);
    
    db.run(`
      INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [require('uuid').v4(), req.user.id, 'void', 'invoice', invoiceId]);
    
    logger.info(`账单 ${invoiceId} 已作废 by ${req.user.username}`);
    
    const updatedInvoice = db.get('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
    
    res.json({
      success: true,
      data: {
        invoice: updatedInvoice
      }
    });
  } catch (error) {
    logger.error('作废账单失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

module.exports = router;
