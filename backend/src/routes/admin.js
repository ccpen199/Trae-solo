const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

function getCenterCondition(role, centerId) {
  if (role === 'super_admin') return { where: '', params: [] };
  return { where: 'AND center_id = ?', params: [centerId] };
}

router.get('/stats', authenticateToken, requireRole('supervisor', 'super_admin', 'unit_admin'), (req, res) => {
  const centerId = req.user.centerId;
  const scoped = getCenterCondition(req.user.role, centerId);
  const userWhere = req.user.role === 'super_admin' ? '' : 'WHERE center_id = ?';
  const accountWhere = req.user.role === 'super_admin' ? '' : 'WHERE user_id IN (SELECT id FROM users WHERE center_id = ?)';
  const withdrawalScope = scoped.where ? scoped.where : '';

  const totalUsers = db.prepare(`SELECT COUNT(*) as count FROM users ${userWhere}`).get(...scoped.params).count;
  const totalBalance = db.prepare(`SELECT COALESCE(SUM(balance), 0) as total FROM personal_accounts ${accountWhere}`).get(...scoped.params).total || 0;
  const pendingWithdrawals = db.prepare(`
    SELECT COUNT(*) as count FROM withdrawal_applications
    WHERE status = 'pending' ${withdrawalScope}
  `).get(...scoped.params).count;
  const totalLoans = db.prepare(`
    SELECT COUNT(*) as count FROM loans
    ${req.user.role === 'super_admin' ? '' : 'WHERE user_id IN (SELECT id FROM users WHERE center_id = ?)'}
  `).get(...scoped.params).count;
  const todayWithdrawals = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as amount
    FROM withdrawal_applications
    WHERE DATE(created_at) = DATE('now') AND status = 'approved' ${withdrawalScope}
  `).get(...scoped.params);
  const successRate = db.prepare(`
    SELECT COUNT(*) as total, SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved
    FROM withdrawal_applications
    WHERE DATE(created_at) >= DATE('now', '-30 day') ${withdrawalScope}
  `).get(...scoped.params);
  const rate = successRate.total > 0 ? Number((successRate.approved / successRate.total * 100).toFixed(1)) : 0;

  res.json({
    totalUsers,
    totalBalance,
    pendingWithdrawals,
    totalLoans,
    todayWithdrawals: todayWithdrawals.count,
    todayAmount: todayWithdrawals.amount,
    successRate: rate,
    status: 'ok',
    total_users: totalUsers,
    total_balance: totalBalance,
    pending_approvals: pendingWithdrawals,
    total_loans: totalLoans,
    today_withdrawals: todayWithdrawals.count,
    today_amount: todayWithdrawals.amount,
    success_rate: rate
  });
});

router.get('/dashboard', authenticateToken, requireRole('supervisor', 'super_admin', 'unit_admin'), (req, res) => {
  const centerId = req.user.centerId;
  let centerCondition = '';
  const params = [];

  if (req.user.role !== 'super_admin') {
    centerCondition = 'WHERE center_id = ?';
    params.push(centerId);
  }

  const totalUsers = db.prepare(`
    SELECT COUNT(*) as count FROM users ${centerCondition}
  `).get(...params).count;

  const totalBalance = db.prepare(`
    SELECT SUM(balance) as total FROM personal_accounts
    ${centerCondition ? 'WHERE user_id IN (SELECT id FROM users WHERE center_id = ?)' : ''}
  `).get(...params).total || 0;

  const pendingWithdrawals = db.prepare(`
    SELECT COUNT(*) as count FROM withdrawal_applications WHERE status = 'pending'
    ${centerCondition ? 'AND center_id = ?' : ''}
  `).get(...params).count;

  const todayWithdrawals = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as amount
    FROM withdrawal_applications
    WHERE DATE(created_at) = DATE('now') AND status = 'approved'
    ${centerCondition ? 'AND center_id = ?' : ''}
  `).get(...params);

  const successRate = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved
    FROM withdrawal_applications
    WHERE DATE(created_at) >= DATE('now', '-30 day')
    ${centerCondition ? 'AND center_id = ?' : ''}
  `).get(...params);

  const rate = successRate.total > 0 ? (successRate.approved / successRate.total * 100).toFixed(1) : 0;

  const overduePending = db.prepare(`
    SELECT COUNT(*) as count FROM withdrawal_applications
    WHERE status = 'pending'
    ${centerCondition ? 'AND center_id = ?' : ''}
    AND JULIANDAY('now') - JULIANDAY(created_at) > 1
  `).get(...params);

  const overdueList = db.prepare(`
    SELECT wa.*, u.name as user_name, u.phone,
           ROUND((JULIANDAY('now') - JULIANDAY(wa.created_at)) * 24, 1) as hours_pending
    FROM withdrawal_applications wa
    JOIN users u ON wa.user_id = u.id
    WHERE wa.status = 'pending'
    ${centerCondition ? 'AND wa.center_id = ?' : ''}
    AND JULIANDAY('now') - JULIANDAY(wa.created_at) > 1
    ORDER BY wa.created_at ASC
    LIMIT 20
  `).all(...params);

  const centerDistribution = db.prepare(`
    SELECT
      c.id as center_id, c.code as center_code, c.name as center_name,
      c.province, c.city,
      (SELECT COUNT(*) FROM users WHERE center_id = c.id) as user_count,
      COALESCE((SELECT SUM(pa.balance) FROM personal_accounts pa
        JOIN users u ON pa.user_id = u.id WHERE u.center_id = c.id), 0) as total_balance,
      (SELECT COUNT(*) FROM withdrawal_applications WHERE center_id = c.id) as withdrawal_count,
      COALESCE((SELECT SUM(amount) FROM withdrawal_applications WHERE center_id = c.id AND status = 'approved'), 0) as withdrawal_amount
    FROM centers c
    WHERE c.status = 'active'
    ORDER BY c.id
  `).all();

  res.json({
    totalUsers,
    totalBalance,
    pendingWithdrawals,
    todayWithdrawals: todayWithdrawals.count,
    todayAmount: todayWithdrawals.amount,
    successRate: parseFloat(rate),
    status: 'ok',
    total_users: totalUsers,
    total_balance: totalBalance,
    pending_approvals: pendingWithdrawals,
    today_withdrawals: todayWithdrawals.count,
    today_amount: todayWithdrawals.amount,
    success_rate: parseFloat(rate),
    overdue_pending: overduePending.count,
    overdue_list: overdueList,
    center_count: centerDistribution.length,
    centers: centerDistribution.map(c => ({
      id: c.center_id,
      name: c.center_name,
      status: 'active',
      user_count: c.user_count,
      balance: c.total_balance
    }))
  });
});

router.get('/centers', authenticateToken, requireRole('super_admin'), (req, res) => {
  const centers = db.prepare('SELECT * FROM centers ORDER BY created_at DESC').all();
  res.json(centers);
});

router.post('/centers', authenticateToken, requireRole('super_admin'), auditLog('创建中心', '管理后台'), (req, res) => {
  const { code, name, province, city } = req.body;

  try {
    const result = db.prepare(`
      INSERT INTO centers (code, name, province, city)
      VALUES (?, ?, ?, ?)
    `).run(code, name, province, city);

    res.json({ id: result.lastInsertRowid, message: '创建成功' });
  } catch (error) {
    res.status(400).json({ error: '中心编码已存在' });
  }
});

router.get('/configs', authenticateToken, requireRole('supervisor', 'super_admin'), (req, res) => {
  const centerId = req.user.role === 'super_admin' ? req.query.centerId : req.user.centerId;

  const configs = db.prepare(`
    SELECT * FROM center_configs WHERE center_id = ?
  `).all(centerId || req.user.centerId);

  res.json(configs);
});

router.post('/configs', authenticateToken, requireRole('supervisor', 'super_admin'), auditLog('更新配置', '管理后台'), (req, res) => {
  const { center_id, config_key, config_value, description } = req.body;

  db.prepare(`
    INSERT INTO center_configs (center_id, config_key, config_value, description)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(center_id, config_key) DO UPDATE SET config_value = ?, description = ?, updated_at = CURRENT_TIMESTAMP
  `).run(center_id, config_key, config_value, description, config_value, description);

  res.json({ message: '配置更新成功' });
});

router.get('/audit-logs', authenticateToken, requireRole('supervisor', 'super_admin'), (req, res) => {
  const { page = 1, pageSize = 20, module, action } = req.query;
  const offset = (page - 1) * pageSize;

  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const params = [];

  if (module) {
    query += ' AND module = ?';
    params.push(module);
  }
  if (action) {
    query += ' AND action LIKE ?';
    params.push(`%${action}%`);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);

  const logs = db.prepare(query).all(...params);

  const { total } = db.prepare('SELECT COUNT(*) as total FROM audit_logs').get();

  res.json({
    logs,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total
    }
  });
});

router.get('/risk-alerts', authenticateToken, requireRole('supervisor', 'super_admin'), (req, res) => {
  const { status = 'open' } = req.query;

  const alerts = db.prepare(`
    SELECT ra.*, u.name as user_name
    FROM risk_alerts ra
    LEFT JOIN users u ON ra.user_id = u.id
    WHERE ra.status = ?
    ORDER BY created_at DESC
  `).all(status);

  res.json(alerts);
});

router.post('/risk-alerts/:id/handle', authenticateToken, requireRole('supervisor', 'super_admin'), auditLog('处理风险', '风险监测'), (req, res) => {
  const alertId = req.params.id;

  db.prepare(`
    UPDATE risk_alerts SET status = 'handled' WHERE id = ?
  `).run(alertId);

  res.json({ message: '风险已处理' });
});

router.get('/stats/withdrawal-trend', authenticateToken, requireRole('supervisor', 'super_admin'), (req, res) => {
  const days = parseInt(req.query.days || 30);

  const trend = db.prepare(`
    SELECT
      DATE(created_at) as date,
      COUNT(*) as count,
      SUM(amount) as amount
    FROM withdrawal_applications
    WHERE created_at >= DATE('now', ?)
    GROUP BY DATE(created_at)
    ORDER BY date
  `).all(`-${days} day`);

  res.json(trend);
});

router.get('/stats/heatmap', authenticateToken, requireRole('supervisor', 'super_admin'), (req, res) => {
  const data = db.prepare(`
    SELECT
      c.province,
      c.city,
      COUNT(wa.id) as count,
      SUM(wa.amount) as amount
    FROM centers c
    LEFT JOIN withdrawal_applications wa ON c.id = wa.center_id
    WHERE wa.created_at >= DATE('now', '-30 day') OR wa.id IS NULL
    GROUP BY c.id
  `).all();

  res.json(data);
});

router.get('/stats/success-trend', authenticateToken, requireRole('supervisor', 'super_admin'), (req, res) => {
  const trend = db.prepare(`
    SELECT
      DATE(created_at) as date,
      COUNT(*) as total,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
      ROUND(
        CASE WHEN COUNT(*) > 0
          THEN SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)
          ELSE 0
        END, 1
      ) as rate
    FROM withdrawal_applications
    WHERE created_at >= DATE('now', '-30 day')
    GROUP BY DATE(created_at)
    ORDER BY date
  `).all();

  res.json(trend);
});

router.get('/stats/overdue-monitor', authenticateToken, requireRole('supervisor', 'super_admin'), (req, res) => {
  const centerId = req.user.centerId;
  let query = `
    SELECT
      wa.id,
      wa.user_id,
      wa.type,
      wa.amount,
      wa.created_at,
      u.name as user_name,
      u.phone,
      c.name as center_name,
      ROUND((JULIANDAY('now') - JULIANDAY(wa.created_at)) * 24, 1) as hours_pending,
      CASE
        WHEN JULIANDAY('now') - JULIANDAY(wa.created_at) > 3 THEN 'critical'
        WHEN JULIANDAY('now') - JULIANDAY(wa.created_at) > 2 THEN 'urgent'
        ELSE 'warning'
      END as escalation_level,
      CASE
        WHEN JULIANDAY('now') - JULIANDAY(wa.created_at) > 3 THEN '已超72小时，需立即处理'
        WHEN JULIANDAY('now') - JULIANDAY(wa.created_at) > 2 THEN '已超48小时，需紧急处理'
        ELSE '已超24小时，需尽快处理'
      END as escalation_note
    FROM withdrawal_applications wa
    JOIN users u ON wa.user_id = u.id
    JOIN centers c ON wa.center_id = c.id
    WHERE wa.status = 'pending'
    AND JULIANDAY('now') - JULIANDAY(wa.created_at) > 1
  `;
  const params = [];

  if (req.user.role !== 'super_admin') {
    query += ' AND wa.center_id = ?';
    params.push(centerId);
  }

  query += ' ORDER BY wa.created_at ASC';

  const tasks = db.prepare(query).all(...params);

  res.json(tasks.map(t => ({
    id: t.id,
    application_id: t.id,
    applicant_name: t.user_name,
    business_type: t.type,
    amount: t.amount,
    hours_pending: t.hours_pending,
    escalation: t.escalation_level === 'critical' ? 'escalated' : 'pending',
    escalation_note: t.escalation_note,
    created_at: t.created_at,
    center_name: t.center_name
  })));
});

router.get('/stats/center-heatmap', authenticateToken, requireRole('supervisor', 'super_admin'), (req, res) => {
  const data = db.prepare(`
    SELECT
      c.id as center_id,
      c.code as center_code,
      c.name as center_name,
      c.province,
      c.city,
      (SELECT COUNT(*) FROM users WHERE center_id = c.id AND role = 'personal') as user_count,
      COALESCE((SELECT SUM(pa.balance) FROM personal_accounts pa
        JOIN users u ON pa.user_id = u.id WHERE u.center_id = c.id), 0) as total_balance,
      (SELECT COUNT(*) FROM withdrawal_applications WHERE center_id = c.id
        AND created_at >= DATE('now', '-30 day')) as count,
      COALESCE((SELECT SUM(wa.amount) FROM withdrawal_applications wa
        WHERE wa.center_id = c.id AND wa.created_at >= DATE('now', '-30 day')), 0) as amount,
      (SELECT COUNT(*) FROM loans l JOIN users u ON l.user_id = u.id
        WHERE u.center_id = c.id) as loan_count,
      COALESCE((SELECT SUM(l.remaining_principal) FROM loans l
        JOIN users u ON l.user_id = u.id WHERE u.center_id = c.id), 0) as loan_balance
    FROM centers c
    WHERE c.status = 'active'
    ORDER BY c.id
  `).all();

  res.json(data);
});

router.get('/pending-tasks', authenticateToken, requireRole('supervisor', 'super_admin'), (req, res) => {
  const centerId = req.user.centerId;
  let query = `
    SELECT
      'withdrawal' as type,
      id,
      created_at,
      ROUND((JULIANDAY('now') - JULIANDAY(created_at)) * 24, 1) as hours_pending
    FROM withdrawal_applications
    WHERE status = 'pending'
  `;
  const params = [];

  if (req.user.role !== 'super_admin') {
    query += ' AND center_id = ?';
    params.push(centerId);
  }

  query += " AND JULIANDAY('now') - JULIANDAY(created_at) > 1";

  const tasks = db.prepare(query).all(...params);

  res.json(tasks);
});

module.exports = router;
