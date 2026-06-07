const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

router.get('/dashboard', authenticateToken, requireRole('unit_admin'), auditLog('单位工作台', '单位管理'), (req, res) => {
  const unitId = req.user.unitId;

  const unit = db.prepare('SELECT * FROM units WHERE id = ?').get(unitId);
  if (!unit) {
    return res.status(404).json({ error: '单位不存在' });
  }

  const employeeCount = db.prepare(`
    SELECT COUNT(*) as count FROM personal_accounts pa
    JOIN users u ON pa.user_id = u.id
    WHERE pa.unit_id = ? AND u.status = 'active'
  `).get(unitId).count;

  const totalBalance = db.prepare(`
    SELECT COALESCE(SUM(pa.balance), 0) as total FROM personal_accounts pa
    WHERE pa.unit_id = ?
  `).get(unitId).total;

  const totalPaid = db.prepare(`
    SELECT COALESCE(SUM(up.total_amount), 0) as total FROM unit_payments up
    WHERE up.unit_id = ? AND up.status = 'paid'
  `).get(unitId).total;

  const pendingPayments = db.prepare(`
    SELECT COUNT(*) as count FROM unit_payments
    WHERE unit_id = ? AND status = 'pending'
  `).get(unitId).count;

  const recentPayments = db.prepare(`
    SELECT up.*,
           (SELECT COUNT(*) FROM unit_payment_details upd WHERE upd.payment_id = up.id) as detail_count
    FROM unit_payments up
    WHERE up.unit_id = ?
    ORDER BY up.created_at DESC
    LIMIT 5
  `).all(unitId);

  const monthlyTrend = db.prepare(`
    SELECT period, total_amount, person_count, status
    FROM unit_payments
    WHERE unit_id = ?
    ORDER BY period DESC
    LIMIT 6
  `).all(unitId);

  const center = db.prepare('SELECT name FROM centers WHERE id = ?').get(unit.center_id);

  res.json({
    employee_count: employeeCount,
    monthly_total: totalPaid,
    pending_payments: pendingPayments,
    unit_status: unit.status,
    unit_name: unit.name,
    credit_code: unit.credit_code,
    center_name: center?.name,
    recent_payments: recentPayments.map(p => ({
      id: p.id,
      month: p.period,
      employee_count: p.person_count,
      amount: p.total_amount,
      status: p.status
    })),
    monthly_trend: monthlyTrend
  });
});

router.get('/employees', authenticateToken, requireRole('unit_admin'), auditLog('查询员工', '单位管理'), (req, res) => {
  const unitId = req.user.unitId;
  const { page = 1, pageSize = 20, status } = req.query;
  const offset = (page - 1) * pageSize;

  let query = `
    SELECT u.id, u.name, u.id_card, u.phone, u.status,
           pa.account_no, pa.balance, pa.base_salary, pa.monthly_pay
    FROM users u
    JOIN personal_accounts pa ON pa.user_id = u.id
    WHERE pa.unit_id = ?
  `;
  const params = [unitId];

  if (status) {
    query += ' AND u.status = ?';
    params.push(status);
  }

  query += ' ORDER BY u.name LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);

  const employees = db.prepare(query).all(...params);

  let countQuery = `
    SELECT COUNT(*) as total FROM users u
    JOIN personal_accounts pa ON pa.user_id = u.id
    WHERE pa.unit_id = ?
  `;
  const countParams = [unitId];
  if (status) {
    countQuery += ' AND u.status = ?';
    countParams.push(status);
  }
  const { total } = db.prepare(countQuery).get(...countParams);

  res.json({
    employees,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total
    }
  });
});

router.get('/payments', authenticateToken, requireRole('unit_admin'), auditLog('查询缴款', '单位管理'), (req, res) => {
  const unitId = req.user.unitId;
  const { page = 1, pageSize = 20, period, status } = req.query;
  const offset = (page - 1) * pageSize;

  let query = `
    SELECT up.*,
           (SELECT COUNT(*) FROM unit_payment_details upd WHERE upd.payment_id = up.id) as detail_count
    FROM unit_payments up
    WHERE up.unit_id = ?
  `;
  const params = [unitId];

  if (period) {
    query += ' AND up.period = ?';
    params.push(period);
  }
  if (status) {
    query += ' AND up.status = ?';
    params.push(status);
  }

  query += ' ORDER BY up.period DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);

  const payments = db.prepare(query).all(...params);

  const enrichedPayments = payments.map(p => {
    const details = db.prepare(`
      SELECT upd.*, u.name as user_name
      FROM unit_payment_details upd
      JOIN users u ON upd.user_id = u.id
      WHERE upd.payment_id = ?
    `).all(p.id);
    return { ...p, details };
  });

  let countQuery = 'SELECT COUNT(*) as total FROM unit_payments WHERE unit_id = ?';
  const countParams = [unitId];
  if (period) {
    countQuery += ' AND period = ?';
    countParams.push(period);
  }
  if (status) {
    countQuery += ' AND status = ?';
    countParams.push(status);
  }
  const { total } = db.prepare(countQuery).get(...countParams);

  res.json({
    payments: enrichedPayments,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total
    }
  });
});

module.exports = router;
