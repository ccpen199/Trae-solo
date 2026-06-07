const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

router.get('/balance', authenticateToken, requireRole('personal'), auditLog('查询余额', '账户管理'), (req, res) => {
  const account = db.prepare(`
    SELECT pa.*, u.name, u.id_card, u.phone, u.center_id as user_center_id,
           c.name as center_name, c.province as center_province, c.city as center_city,
           un.name as unit_name, un.code as unit_code
    FROM personal_accounts pa
    JOIN users u ON pa.user_id = u.id
    JOIN centers c ON u.center_id = c.id
    LEFT JOIN units un ON pa.unit_id = un.id
    WHERE pa.user_id = ?
  `).get(req.user.id);

  if (!account) {
    return res.status(404).json({ error: '账户不存在' });
  }

  const homeCenterSync = db.prepare(`
    SELECT sync_status, synced_at FROM cross_center_sync
    WHERE user_id = ? AND (from_center_id = ? OR to_center_id = ?)
    ORDER BY created_at DESC LIMIT 1
  `).get(req.user.id, account.user_center_id, account.user_center_id);

  const multiTenantSources = [
    {
      id: `home_${account.user_center_id}`,
      center_name: account.center_name,
      sync_status: homeCenterSync?.sync_status || 'synced',
      diff_amount: null,
      last_sync_time: homeCenterSync?.synced_at || account.last_sync_at
    }
  ];

  const otherCenters = db.prepare(`
    SELECT DISTINCT c.id, c.name as center_name,
           ccs.sync_status, ccs.diff_amount, ccs.synced_at as last_sync_time
    FROM cross_center_sync ccs
    JOIN centers c ON (c.id = ccs.from_center_id OR c.id = ccs.to_center_id)
    WHERE ccs.user_id = ? AND c.id != ?
  `).all(req.user.id, account.user_center_id);

  multiTenantSources.push(...otherCenters.map(c => ({
    id: `sync_${c.id}`,
    center_name: c.center_name,
    sync_status: c.sync_status || 'pending',
    diff_amount: c.diff_amount,
    last_sync_time: c.last_sync_time
  })));

  const crossCenterSync = db.prepare(`
    SELECT ccs.id, ccs.sync_type, ccs.sync_status as status, ccs.diff_amount,
           ccs.diff_detail, ccs.synced_at,
           fc.name as from_center, tc.name as to_center
    FROM cross_center_sync ccs
    JOIN centers fc ON ccs.from_center_id = fc.id
    JOIN centers tc ON ccs.to_center_id = tc.id
    WHERE ccs.user_id = ?
    ORDER BY ccs.created_at DESC
  `).all(req.user.id);

  const fundArrivals = db.prepare(`
    SELECT id, amount, expected_date, actual_date, arrival_status, source_type
    FROM fund_arrivals
    WHERE account_id = ?
    ORDER BY expected_date DESC
  `).all(account.id);

  const personalAuditRecords = db.prepare(`
    SELECT id, action, module, ip, created_at
    FROM audit_logs
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 10
  `).all(req.user.id);

  const unitRatio = db.prepare('SELECT base_ratio FROM units WHERE id = ?').get(account.unit_id);

  res.json({
    ...account,
    unit_ratio: Math.round((unitRatio?.base_ratio || 0.12) * 100),
    personal_ratio: Math.round((unitRatio?.base_ratio || 0.12) * 100),
    multi_tenant_sources: multiTenantSources,
    cross_center_sync: crossCenterSync,
    fund_arrivals: fundArrivals,
    personal_audit_records: personalAuditRecords
  });
});

router.get('/transactions', authenticateToken, requireRole('personal'), auditLog('查询明细', '账户管理'), (req, res) => {
  const { page = 1, pageSize = 20, type } = req.query;
  const offset = (page - 1) * pageSize;

  let query = `
    SELECT tr.*, pa.account_no
    FROM transaction_records tr
    JOIN personal_accounts pa ON tr.account_id = pa.id
    WHERE pa.user_id = ?
  `;
  const params = [req.user.id];

  if (type) {
    query += ' AND tr.type = ?';
    params.push(type);
  }

  query += ' ORDER BY tr.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);

  const records = db.prepare(query).all(...params);

  let countQuery = `
    SELECT COUNT(*) as total
    FROM transaction_records tr
    JOIN personal_accounts pa ON tr.account_id = pa.id
    WHERE pa.user_id = ?
  `;
  const countParams = [req.user.id];
  if (type) {
    countQuery += ' AND tr.type = ?';
    countParams.push(type);
  }
  const { total } = db.prepare(countQuery).get(...countParams);

  res.json({
    records,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total
    }
  });
});

router.get('/loan', authenticateToken, requireRole('personal'), auditLog('查询贷款', '账户管理'), (req, res) => {
  const loans = db.prepare(`
    SELECT * FROM loans WHERE user_id = ? ORDER BY created_at DESC
  `).all(req.user.id);

  res.json(loans);
});

router.get('/loan-detail/:id', authenticateToken, requireRole('personal'), auditLog('查询贷款详情', '账户管理'), (req, res) => {
  const loan = db.prepare(`
    SELECT l.*, u.name as user_name, u.id_card, u.phone
    FROM loans l
    JOIN users u ON l.user_id = u.id
    WHERE l.id = ? AND l.user_id = ?
  `).get(req.params.id, req.user.id);

  if (!loan) {
    return res.status(404).json({ error: '贷款记录不存在' });
  }

  const loanDetail = db.prepare(`
    SELECT ld.*, rv.name as reviewer_name
    FROM loan_details ld
    LEFT JOIN users rv ON ld.reviewer_id = rv.id
    WHERE ld.loan_id = ?
  `).get(loan.id);

  const developer = loanDetail ? db.prepare(`
    SELECT * FROM developers WHERE credit_code = ?
  `).get(loanDetail.developer_credit_code) : null;

  const developerProjects = developer ? db.prepare(`
    SELECT * FROM developer_projects WHERE developer_id = ? AND status = 'active'
  `).all(developer.id) : [];

  const abnormalAlerts = db.prepare(`
    SELECT ra.*, wa.type as withdrawal_type, wa.amount as withdrawal_amount
    FROM risk_alerts ra
    LEFT JOIN withdrawal_applications wa ON ra.application_id = wa.id
    WHERE ra.user_id = ? AND ra.status = 'open'
    ORDER BY ra.created_at DESC
  `).all(req.user.id);

  const projectInfo = loanDetail ? db.prepare(`
    SELECT * FROM developer_projects
    WHERE project_name = ? AND developer_id = ?
  `).get(loanDetail.project_name, developer?.id) : null;

  res.json({
    loan,
    developer: loanDetail ? {
      developer_name: loanDetail.developer_name,
      developer_credit_code: loanDetail.developer_credit_code,
      project_name: loanDetail.project_name,
      project_address: loanDetail.project_address
    } : null,
    reviews: loanDetail ? [{
      id: loanDetail.id,
      reviewer_name: loanDetail.reviewer_name,
      review_status: loanDetail.review_status,
      review_note: loanDetail.review_note,
      reviewed_at: loanDetail.reviewed_at
    }].filter(r => r.reviewer_name) : [],
    risk: loanDetail ? {
      risk_level: loanDetail.risk_level,
      risk_note: loanDetail.risk_note
    } : null,
    risk_alerts: abnormalAlerts.map(a => ({
      id: a.id,
      alert_type: a.type,
      description: a.description,
      level: a.level
    }))
  });
});

router.post('/sync', authenticateToken, requireRole('personal'), auditLog('同步账户', '账户管理'), (req, res) => {
  const account = db.prepare('SELECT * FROM personal_accounts WHERE user_id = ?').get(req.user.id);
  if (!account) {
    return res.status(404).json({ error: '账户不存在' });
  }

  const user = db.prepare('SELECT center_id FROM users WHERE id = ?').get(req.user.id);

  db.prepare(`
    UPDATE personal_accounts SET last_sync_at = CURRENT_TIMESTAMP WHERE user_id = ?
  `).run(req.user.id);

  const pendingSyncs = db.prepare(`
    SELECT ccs.*, fc.name as from_center_name, tc.name as to_center_name
    FROM cross_center_sync ccs
    JOIN centers fc ON ccs.from_center_id = fc.id
    JOIN centers tc ON ccs.to_center_id = tc.id
    WHERE ccs.user_id = ? AND ccs.sync_status IN ('pending', 'conflict')
  `).all(req.user.id);

  const syncResults = [];
  for (const sync of pendingSyncs) {
    if (sync.sync_type === 'balance') {
      db.prepare(`
        UPDATE cross_center_sync SET sync_status = 'synced', synced_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(sync.id);
      syncResults.push({ sync_id: sync.id, type: 'balance', status: 'synced', message: '余额同步完成' });
    } else if (sync.sync_type === 'transfer' && sync.diff_amount) {
      db.prepare(`
        UPDATE personal_accounts SET balance = balance + ? WHERE user_id = ?
      `).run(sync.diff_amount, req.user.id);

      db.prepare(`
        INSERT INTO transaction_records (account_id, type, amount, balance_after, description, source_type, source_id)
        SELECT 'transfer_in', ?, balance, ?, 'cross_center_sync', ?
        FROM personal_accounts WHERE user_id = ?
      `).run(sync.diff_amount, `异地转入差额调整-从${sync.from_center_name}`, sync.id, req.user.id);

      db.prepare(`
        UPDATE cross_center_sync SET sync_status = 'synced', synced_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(sync.id);
      syncResults.push({ sync_id: sync.id, type: 'transfer', status: 'synced', message: `差额${sync.diff_amount}元已入账` });
    } else {
      syncResults.push({ sync_id: sync.id, type: sync.sync_type, status: sync.sync_status, message: '需要人工处理' });
    }
  }

  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const expectedDate = `${period}-15`;

  const recentPayment = db.prepare(`
    SELECT up.id FROM unit_payments up
    WHERE up.unit_id = ? AND up.period = ? AND up.status = 'paid'
  `).get(account.unit_id, period);

  let fundArrivalResult = null;
  if (recentPayment) {
    const existing = db.prepare(`
      SELECT id FROM fund_arrivals
      WHERE account_id = ? AND source_type = 'unit_payment' AND source_id = ?
    `).get(account.id, recentPayment.id);

    if (!existing) {
      const monthlyPay = account.monthly_pay || 0;
      db.prepare(`
        INSERT INTO fund_arrivals (account_id, amount, expected_date, actual_date, arrival_status, source_type, source_id)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'arrived', 'unit_payment', ?)
      `).run(account.id, monthlyPay, expectedDate, recentPayment.id);
      fundArrivalResult = { status: 'created', amount: monthlyPay, source: 'unit_payment' };
    } else {
      fundArrivalResult = { status: 'already_exists', source: 'unit_payment' };
    }
  }

  const updatedAccount = db.prepare(`
    SELECT pa.*, c.name as center_name
    FROM personal_accounts pa
    JOIN users u ON pa.user_id = u.id
    JOIN centers c ON u.center_id = c.id
    WHERE pa.user_id = ?
  `).get(req.user.id);

  res.json({
    message: '同步成功',
    syncTime: new Date().toISOString(),
    sync_results: syncResults,
    fund_arrival: fundArrivalResult,
    account: updatedAccount
  });
});

module.exports = router;
