import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { authenticateToken, requireRoles, getRoleNames } from '../middleware/auth.js';
import { recordAuditLog, AUDIT_ACTIONS, STATUS_MAP, getInvoiceStatusName } from '../utils/audit.js';
import { validateTaxNo, validateInvoiceTitle, checkAmountRisk, checkDuplicateInvoice, checkQuotaRisk, createRiskAlert, RISK_TYPES, RISK_LEVELS } from '../engines/tax-risk.js';
import { generateInvoice, generateInvoicePDF } from '../engines/invoice-generator.js';
import { storeInvoiceDocument, linkInvoiceToOrder, createDeliveryRecord, getDeliveryHistory } from '../engines/doc-storage.js';
import { createRedCreditRecord, executeRedCredit, submitRedCreditToTax, getRedCreditHistory } from '../engines/red-credit.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', (req, res) => {
  const { status, order_no, start_date, end_date, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let whereConditions = [];
  let params = [];

  if (req.user.role === 'customer') {
    whereConditions.push('customer_id = ?');
    params.push(req.user.id);
  }

  if (status) {
    whereConditions.push('status = ?');
    params.push(status);
  }

  if (order_no) {
    whereConditions.push('order_no LIKE ?');
    params.push(`%${order_no}%`);
  }

  if (start_date) {
    whereConditions.push('created_at >= ?');
    params.push(start_date);
  }

  if (end_date) {
    whereConditions.push('created_at <= ?');
    params.push(end_date + ' 23:59:59');
  }

  const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

  const countStmt = db.prepare(`
    SELECT COUNT(*) as total FROM invoice_requests ${whereClause}
  `);
  const { total } = countStmt.get(...params);

  const stmt = db.prepare(`
    SELECT * FROM invoice_requests 
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);
  
  const invoices = stmt.all(...params, parseInt(limit), offset);
  
  const invoicesWithStatusName = invoices.map(inv => ({
    ...inv,
    status_name: getInvoiceStatusName(inv.status)
  }));

  res.json({
    invoices: invoicesWithStatusName,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      total_pages: Math.ceil(total / limit)
    }
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const invoice = db.prepare('SELECT * FROM invoice_requests WHERE id = ?').get(id);
  
  if (!invoice) {
    return res.status(404).json({ error: '发票申请不存在' });
  }

  if (req.user.role === 'customer' && invoice.customer_id !== req.user.id) {
    return res.status(403).json({ error: '无权访问此发票' });
  }

  const deliveryHistory = getDeliveryHistory(id);
  const redCreditHistory = getRedCreditHistory(id);
  const auditLogs = db.prepare(`
    SELECT * FROM audit_logs 
    WHERE invoice_id = ? 
    ORDER BY created_at DESC
  `).all(id);

  res.json({
    invoice: {
      ...invoice,
      status_name: getInvoiceStatusName(invoice.status)
    },
    delivery_history: deliveryHistory,
    red_credit_history: redCreditHistory,
    audit_logs: auditLogs
  });
});

router.post('/', requireRoles('customer'), (req, res) => {
  const {
    order_no,
    invoice_title,
    tax_no,
    bank_account,
    bank_name,
    address,
    phone,
    amount,
    items
  } = req.body;

  if (!order_no || !invoice_title || !tax_no || !amount || !items) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  const taxValidation = validateTaxNo(tax_no);
  if (!taxValidation.valid) {
    return res.status(400).json({ 
      error: '税号验证失败', 
      detail: taxValidation.risk 
    });
  }

  const titleValidation = validateInvoiceTitle(invoice_title);
  if (!titleValidation.valid) {
    return res.status(400).json({ 
      error: '发票抬头验证失败', 
      detail: titleValidation.risk 
    });
  }

  const duplicateCheck = checkDuplicateInvoice(order_no, amount);
  if (duplicateCheck.isDuplicate) {
    return res.status(400).json({ 
      error: '该订单已存在开票记录',
      existing: duplicateCheck.existingInvoice
    });
  }

  const amountRisks = checkAmountRisk(amount, req.user.id);
  if (amountRisks.length > 0) {
    amountRisks.forEach(risk => {
      createRiskAlert({
        riskType: risk.type,
        riskLevel: risk.level,
        description: risk.description
      });
    });
  }

  const quotaRisk = checkQuotaRisk(amount);
  if (quotaRisk.hasRisk) {
    return res.status(400).json({
      error: '开票额度不足',
      detail: quotaRisk.description
    });
  }

  const invoiceId = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO invoice_requests (
      id, order_no, customer_id, customer_name,
      invoice_title, tax_no, bank_account, bank_name,
      address, phone, amount, items, status,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    invoiceId,
    order_no,
    req.user.id,
    req.user.name,
    invoice_title,
    tax_no,
    bank_account || null,
    bank_name || null,
    address || null,
    phone || null,
    amount,
    JSON.stringify(items),
    'pending',
    now,
    now
  );

  recordAuditLog({
    invoiceId,
    orderNo: order_no,
    action: AUDIT_ACTIONS.SUBMIT_REQUEST,
    operator: req.user,
    toStatus: 'pending',
    details: {
      invoice_title,
      tax_no,
      amount,
      items_count: items.length
    },
    ipAddress: req.ip
  });

  const createdInvoice = db.prepare('SELECT * FROM invoice_requests WHERE id = ?').get(invoiceId);
  
  res.status(201).json({
    invoice: {
      ...createdInvoice,
      status_name: getInvoiceStatusName(createdInvoice.status)
    },
    warnings: amountRisks.length > 0 ? amountRisks : null
  });
});

router.post('/:id/issue', requireRoles('finance'), (req, res) => {
  const { id } = req.params;

  const invoice = db.prepare('SELECT * FROM invoice_requests WHERE id = ?').get(id);
  
  if (!invoice) {
    return res.status(404).json({ error: '发票申请不存在' });
  }

  if (invoice.status !== 'pending') {
    return res.status(400).json({ error: '只能对待开票状态的发票进行开票' });
  }

  const invoiceData = generateInvoice(invoice);
  const pdfContent = generateInvoicePDF(invoice, invoiceData);
  const now = new Date().toISOString();

  const storageResult = storeInvoiceDocument(id, invoiceData, pdfContent);

  db.prepare(`
    UPDATE invoice_requests 
    SET status = ?, 
        invoice_no = ?, 
        invoice_code = ?, 
        invoice_url = ?,
        delivered_at = ?,
        updated_at = ?
    WHERE id = ?
  `).run(
    'delivered',
    invoiceData.invoice_no,
    invoiceData.invoice_code,
    storageResult.access_url,
    now,
    now,
    id
  );

  const period = new Date().toISOString().slice(0, 7);
  const quota = db.prepare('SELECT * FROM invoice_quota WHERE period = ?').get(period);
  if (quota) {
    const newUsed = quota.used_quota + invoice.amount;
    const newRemaining = quota.remaining_quota - invoice.amount;
    db.prepare(`
      UPDATE invoice_quota 
      SET used_quota = ?, remaining_quota = ?, updated_at = ?
      WHERE id = ?
    `).run(newUsed, newRemaining, now, quota.id);
  }

  recordAuditLog({
    invoiceId: id,
    orderNo: invoice.order_no,
    action: AUDIT_ACTIONS.ISSUE_INVOICE,
    operator: req.user,
    fromStatus: 'pending',
    toStatus: 'delivered',
    details: {
      invoice_no: invoiceData.invoice_no,
      invoice_code: invoiceData.invoice_code,
      storage_url: storageResult.access_url
    },
    ipAddress: req.ip
  });

  createDeliveryRecord({
    invoiceId: id,
    channel: 'system',
    recipient: invoice.customer_name,
    operator: req.user
  });

  try {
    linkInvoiceToOrder(id, invoice.order_no);
    
    recordAuditLog({
      invoiceId: id,
      orderNo: invoice.order_no,
      action: AUDIT_ACTIONS.SETTLE,
      operator: req.user,
      fromStatus: 'delivered',
      toStatus: 'settled',
      details: { order_no: invoice.order_no },
      ipAddress: req.ip
    });
  } catch (err) {
    console.error('自动结票失败:', err.message);
  }

  const updatedInvoice = db.prepare('SELECT * FROM invoice_requests WHERE id = ?').get(id);
  
  res.json({
    invoice: {
      ...updatedInvoice,
      status_name: getInvoiceStatusName(updatedInvoice.status)
    },
    invoice_data: invoiceData,
    storage: storageResult
  });
});

router.post('/:id/red-credit', requireRoles('finance', 'tax'), (req, res) => {
  const { id } = req.params;
  const { reason, amount } = req.body;

  if (!reason) {
    return res.status(400).json({ error: '红冲原因不能为空' });
  }

  const invoice = db.prepare('SELECT * FROM invoice_requests WHERE id = ?').get(id);
  
  if (!invoice) {
    return res.status(404).json({ error: '发票不存在' });
  }

  if (invoice.status === 'red_credited') {
    return res.status(400).json({ error: '该发票已红冲' });
  }

  if (invoice.status === 'pending' || invoice.status === 'rejected') {
    return res.status(400).json({ error: '该发票状态不允许红冲' });
  }

  try {
    const redCreditRecord = createRedCreditRecord({
      originalInvoiceId: id,
      reason,
      amount: amount || invoice.amount,
      operator: req.user
    });

    recordAuditLog({
      invoiceId: id,
      orderNo: invoice.order_no,
      action: AUDIT_ACTIONS.RED_CREDIT_REQUEST,
      operator: req.user,
      fromStatus: invoice.status,
      details: {
        reason,
        amount: amount || invoice.amount,
        red_credit_id: redCreditRecord.id
      },
      ipAddress: req.ip
    });

    const result = executeRedCredit(redCreditRecord.id, req.user);

    recordAuditLog({
      invoiceId: id,
      orderNo: invoice.order_no,
      action: AUDIT_ACTIONS.RED_CREDIT_EXECUTE,
      operator: req.user,
      fromStatus: invoice.status,
      toStatus: 'red_credited',
      details: {
        red_invoice_no: result.red_invoice_no,
        red_invoice_code: result.red_invoice_code
      },
      ipAddress: req.ip
    });

    const taxSubmission = submitRedCreditToTax(result.red_credit_id, req.user);

    recordAuditLog({
      invoiceId: id,
      orderNo: invoice.order_no,
      action: AUDIT_ACTIONS.RED_CREDIT_SUBMIT,
      operator: req.user,
      details: {
        confirmation_no: taxSubmission.confirmation_no,
        tax_authority: taxSubmission.tax_authority
      },
      ipAddress: req.ip
    });

    const updatedInvoice = db.prepare('SELECT * FROM invoice_requests WHERE id = ?').get(id);

    res.json({
      invoice: {
        ...updatedInvoice,
        status_name: getInvoiceStatusName(updatedInvoice.status)
      },
      red_credit: result,
      tax_submission: taxSubmission
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/pending/count', (req, res) => {
  let countQuery = 'SELECT COUNT(*) as count FROM invoice_requests WHERE status = ?';
  let params = ['pending'];

  if (req.user.role === 'customer') {
    countQuery += ' AND customer_id = ?';
    params.push(req.user.id);
  }

  const result = db.prepare(countQuery).get(...params);
  res.json({ count: result.count });
});

router.get('/stats/summary', requireRoles('finance', 'tax', 'sales'), (req, res) => {
  const period = new Date().toISOString().slice(0, 7);
  
  const totalInvoices = db.prepare(`
    SELECT COUNT(*) as count, SUM(amount) as total_amount
    FROM invoice_requests
    WHERE strftime('%Y-%m', created_at) = ?
  `).get(period);

  const statusStats = db.prepare(`
    SELECT status, COUNT(*) as count, SUM(amount) as total_amount
    FROM invoice_requests
    WHERE strftime('%Y-%m', created_at) = ?
    GROUP BY status
  `).all(period);

  const quota = db.prepare('SELECT * FROM invoice_quota WHERE period = ?').get(period);

  const recentAudits = db.prepare(`
    SELECT * FROM audit_logs
    ORDER BY created_at DESC
    LIMIT 10
  `).all();

  res.json({
    period,
    total_invoices: totalInvoices.count || 0,
    total_amount: totalInvoices.total_amount || 0,
    status_stats: statusStats.map(s => ({
      status: s.status,
      status_name: getInvoiceStatusName(s.status),
      count: s.count,
      total_amount: s.total_amount
    })),
    quota: quota ? {
      total: quota.total_quota,
      used: quota.used_quota,
      remaining: quota.remaining_quota,
      usage_rate: ((quota.used_quota / quota.total_quota) * 100).toFixed(1) + '%'
    } : null,
    recent_audits: recentAudits
  });
});

export default router;
