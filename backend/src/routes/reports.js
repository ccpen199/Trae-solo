import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { authenticateToken, requireRoles } from '../middleware/auth.js';
import { recordAuditLog, AUDIT_ACTIONS, getInvoiceStatusName } from '../utils/audit.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRoles('finance', 'tax'));

router.get('/compliance/summary', (req, res) => {
  const { period } = req.query;
  const targetPeriod = period || new Date().toISOString().slice(0, 7);
  
  const invoiceStats = db.prepare(`
    SELECT 
      status,
      COUNT(*) as count,
      SUM(amount) as total_amount
    FROM invoice_requests
    WHERE strftime('%Y-%m', created_at) = ?
    GROUP BY status
  `).all(targetPeriod);

  const redCreditStats = db.prepare(`
    SELECT 
      COUNT(*) as count,
      SUM(amount) as total_amount
    FROM red_credit_records
    WHERE strftime('%Y-%m', created_at) = ?
  `).get(targetPeriod);

  const quota = db.prepare(`
    SELECT * FROM invoice_quota WHERE period = ?
  `).get(targetPeriod);

  const riskAlerts = db.prepare(`
    SELECT 
      risk_level,
      COUNT(*) as count,
      COUNT(CASE WHEN is_resolved = 1 THEN 1 END) as resolved_count
    FROM risk_alerts
    WHERE strftime('%Y-%m', created_at) = ?
    GROUP BY risk_level
  `).all(targetPeriod);

  const topCustomers = db.prepare(`
    SELECT 
      customer_name,
      COUNT(*) as invoice_count,
      SUM(amount) as total_amount
    FROM invoice_requests
    WHERE strftime('%Y-%m', created_at) = ?
    GROUP BY customer_name
    ORDER BY total_amount DESC
    LIMIT 10
  `).all(targetPeriod);

  res.json({
    period: targetPeriod,
    generated_at: new Date().toISOString(),
    invoice_summary: invoiceStats.map(s => ({
      status: s.status,
      status_name: getInvoiceStatusName(s.status),
      count: s.count,
      total_amount: s.total_amount
    })),
    red_credit_summary: {
      count: redCreditStats.count || 0,
      total_amount: redCreditStats.total_amount || 0
    },
    quota_summary: quota ? {
      total_quota: quota.total_quota,
      used_quota: quota.used_quota,
      remaining_quota: quota.remaining_quota,
      usage_rate: ((quota.used_quota / quota.total_quota) * 100).toFixed(2) + '%'
    } : null,
    risk_summary: riskAlerts.map(r => ({
      risk_level: r.risk_level,
      total: r.count,
      resolved: r.resolved_count,
      unresolved: r.count - r.resolved_count
    })),
    top_customers: topCustomers
  });
});

router.get('/compliance/export', (req, res) => {
  const { period, format = 'json' } = req.query;
  const targetPeriod = period || new Date().toISOString().slice(0, 7);

  const summary = db.prepare(`
    SELECT * FROM invoice_requests
    WHERE strftime('%Y-%m', created_at) = ?
    ORDER BY created_at ASC
  `).all(targetPeriod);

  const audits = db.prepare(`
    SELECT * FROM audit_logs
    WHERE strftime('%Y-%m', created_at) = ?
    ORDER BY created_at ASC
  `).all(targetPeriod);

  const redCredits = db.prepare(`
    SELECT * FROM red_credit_records
    WHERE strftime('%Y-%m', created_at) = ?
    ORDER BY created_at ASC
  `).all(targetPeriod);

  const reportData = {
    report_id: uuidv4(),
    period: targetPeriod,
    generated_at: new Date().toISOString(),
    generated_by: req.user.name,
    invoices: summary,
    audit_logs: audits,
    red_credits: redCredits
  };

  const reportId = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO compliance_reports (
      id, report_type, period, generated_by, statistics, created_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    reportId,
    'monthly_compliance',
    targetPeriod,
    req.user.id,
    JSON.stringify({
      invoice_count: summary.length,
      audit_count: audits.length,
      red_credit_count: redCredits.length
    }),
    now
  );

  recordAuditLog({
    action: AUDIT_ACTIONS.REPORT_GENERATE,
    operator: req.user,
    details: {
      report_id: reportId,
      report_type: 'monthly_compliance',
      period: targetPeriod,
      format
    }
  });

  if (format === 'csv') {
    const csvLines = ['发票号,订单号,客户名称,金额,状态,创建时间'];
    summary.forEach(inv => {
      csvLines.push([
        inv.invoice_no || '-',
        inv.order_no,
        inv.customer_name,
        inv.amount,
        getInvoiceStatusName(inv.status),
        inv.created_at
      ].join(','));
    });
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', `attachment; filename=compliance-report-${targetPeriod}.csv`);
    res.send(csvLines.join('\n'));
  } else {
    res.json(reportData);
  }
});

router.get('/quota/status', (req, res) => {
  const period = new Date().toISOString().slice(0, 7);
  
  let quota = db.prepare('SELECT * FROM invoice_quota WHERE period = ?').get(period);
  
  if (!quota) {
    const totalQuota = parseFloat(process.env.MAX_INVOICE_AMOUNT || '1000000');
    db.prepare(`
      INSERT INTO invoice_quota (id, period, total_quota, used_quota, remaining_quota)
      VALUES (?, ?, ?, 0, ?)
    `).run(uuidv4(), period, totalQuota, totalQuota);
    
    quota = db.prepare('SELECT * FROM invoice_quota WHERE period = ?').get(period);
  }

  const usageRate = (quota.used_quota / quota.total_quota) * 100;
  const status = usageRate > 95 ? 'critical' : usageRate > 80 ? 'warning' : 'normal';

  const recentUsage = db.prepare(`
    SELECT 
      DATE(created_at) as date,
      SUM(amount) as daily_amount,
      COUNT(*) as invoice_count
    FROM invoice_requests
    WHERE status != 'rejected' AND created_at >= date('now', '-30 days')
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 30
  `).all();

  res.json({
    quota: {
      period: quota.period,
      total: quota.total_quota,
      used: quota.used_quota,
      remaining: quota.remaining_quota,
      usage_rate: usageRate.toFixed(2) + '%',
      status
    },
    recent_usage: recentUsage,
    alerts: status !== 'normal' ? [{
      level: status === 'critical' ? 'high' : 'medium',
      message: status === 'critical' 
        ? `开票额度即将用尽，当前使用率: ${usageRate.toFixed(1)}%`
        : `开票额度使用率较高，当前使用率: ${usageRate.toFixed(1)}%`
    }] : []
  });
});

router.get('/history', (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const countStmt = db.prepare('SELECT COUNT(*) as total FROM compliance_reports');
  const { total } = countStmt.get();

  const stmt = db.prepare(`
    SELECT * FROM compliance_reports 
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);
  
  const reports = stmt.all(parseInt(limit), offset);

  res.json({
    reports: reports.map(r => ({
      ...r,
      statistics: r.statistics ? JSON.parse(r.statistics) : null
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      total_pages: Math.ceil(total / limit)
    }
  });
});

export default router;
