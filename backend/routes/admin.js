const express = require('express');
const router = express.Router();
const { query, getOne } = require('../utils/db');
const { success } = require('../utils/response');
const { auth, requireRole } = require('../middleware/auth');

router.get('/overview', auth, requireRole('admin'), (req, res) => {
  const pendingQualification = getOne(
    'SELECT COUNT(*) as count FROM qualification_verifications WHERE reviewed = 0 AND (result != \'pass\' OR confidence < 0.9)'
  ).count;

  const completedPayments = getOne(`
    SELECT COUNT(*) as count FROM insurance_payments 
    WHERE date(created_at) >= date('now', '-7 days')`
  ).count;

  const pendingHrDeclarations = getOne(
    'SELECT COUNT(*) as count FROM hr_declarations WHERE status = \'pending\''
  ).count;

  const fundWarnings = getOne(
    'SELECT COUNT(*) as count FROM fund_warnings WHERE status = \'active\' AND level IN (\'high\', \'medium\')'
  ).count;

  const offlinePendingRecords = getOne(
    'SELECT COUNT(*) as count FROM offline_records WHERE sync_status = \'pending\''
  ).count;

  const verifications = query(`
    SELECT qv.*, u.phone
    FROM qualification_verifications qv
    LEFT JOIN users u ON qv.user_id = u.id
    ORDER BY qv.created_at DESC
    LIMIT 10
  `);

  const payments = query(`
    SELECT * FROM insurance_payments
    ORDER BY created_at DESC
    LIMIT 10
  `);

  const declarations = query(`
    SELECT hd.*, c.company_name
    FROM hr_declarations hd
    LEFT JOIN companies c ON hd.company_id = c.id
    WHERE hd.status = 'pending'
    ORDER BY hd.created_at DESC
    LIMIT 10
  `);

  const fundData = getOne(`
    SELECT 
      COALESCE(SUM(CASE WHEN operation_type = 'income' THEN amount END), 0) as total_income,
      COALESCE(SUM(CASE WHEN operation_type = 'expense' THEN amount END), 0) as total_expense
    FROM fund_operations
    WHERE statistics_date >= date('now', 'start of month')
  `);

  const abnormalCount = getOne(
    'SELECT COUNT(*) as count FROM abnormal_payments WHERE status = \'pending\''
  ).count;

  const crossProvinceAvg = getOne(`
    SELECT COALESCE(AVG(settlement_days), 0) as avg_days
    FROM cross_province_settlements
    WHERE created_at >= datetime('now', '-90 days')
  `).avg_days;

  const syncLogs = query(`
    SELECT oc.center_code, oc.center_name,
           COUNT(ors.id) as record_count,
           MAX(ors.sync_status) as status
    FROM offline_records ors
    LEFT JOIN offline_centers oc ON ors.center_id = oc.id
    WHERE ors.created_at >= datetime('now', '-24 hours')
    GROUP BY oc.center_code, oc.center_name
    ORDER BY record_count DESC
    LIMIT 5
  `);

  const operationLogs = query(`
    SELECT ol.*, u.name
    FROM operation_logs ol
    LEFT JOIN users u ON ol.user_id = u.id
    ORDER BY ol.created_at DESC
    LIMIT 10
  `);

  res.json(success({
    workbench: {
      pendingQualificationReviews: pendingQualification,
      completedMedicalPayments: completedPayments,
      pendingHrDeclarations: pendingHrDeclarations,
      fundWarnings,
      offlinePendingRecords
    },
    verifications,
    payments,
    declarations,
    fund: {
      total_income: fundData.total_income,
      total_expense: fundData.total_expense,
      abnormal_count: abnormalCount,
      cross_province_avg_days: Math.round(crossProvinceAvg * 10) / 10
    },
    syncLogs,
    operationLogs
  }));
});

router.get('/operation-logs', auth, requireRole('admin'), (req, res) => {
  const { page = 1, pageSize = 20, module, userType } = req.query;
  let sql = `SELECT ol.*, u.name 
             FROM operation_logs ol 
             LEFT JOIN users u ON ol.user_id = u.id 
             WHERE 1=1`;
  const params = [];
  if (module && module !== 'all') {
    sql += ' AND ol.module = ?';
    params.push(module);
  }
  if (userType && userType !== 'all') {
    sql += ' AND ol.user_type = ?';
    params.push(userType);
  }
  sql += ' ORDER BY ol.created_at DESC';
  const list = query(sql, params);
  
  const start = (page - 1) * pageSize;
  res.json(success({
    list: list.slice(start, start + Number(pageSize)),
    total: list.length,
    page: Number(page),
    pageSize: Number(pageSize)
  }));
});

module.exports = router;
