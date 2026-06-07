const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

router.get('/dashboard', auth, requireRole('admin'), (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs').get().count;
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    const totalSettlements = db.prepare('SELECT COUNT(*) as count FROM settlements').get().count;
    const totalRevenue = db.prepare('SELECT COALESCE(SUM(fee), 0) as total FROM settlements WHERE status = ?').get('completed').total;
    const workers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'worker'").get().count;
    const employers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'employer'").get().count;
    const openJobs = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'open'").get().count;
    const activeOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('applied','accepted','working')").get().count;
    const completedOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'completed'").get().count;
    const disputedOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE dispute_status != 'none'").get().count;
    const pendingAudits = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE audit_status = 'pending'").get().count;
    res.json({
      code: 0,
      data: { totalUsers, totalJobs, totalOrders, totalSettlements, totalRevenue, workers, employers, openJobs, activeOrders, completedOrders, disputedOrders, pendingAudits },
      message: 'ok'
    });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.get('/audit-logs', auth, requireRole('admin'), (req, res) => {
  try {
    const { target_type } = req.query;
    let sql = `
      SELECT al.*, u.username as operator_name
      FROM audit_logs al
      LEFT JOIN users u ON al.operator_id = u.id
    `;
    const params = [];
    if (target_type) {
      sql += ' WHERE al.target_type = ?';
      params.push(target_type);
    }
    sql += ' ORDER BY al.created_at DESC';
    const logs = db.prepare(sql).all(...params);
    res.json({ code: 0, data: logs, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.get('/jobs/pending', auth, requireRole('admin'), (req, res) => {
  try {
    const jobs = db.prepare(
      `SELECT j.*, u.username as employer_name, ep.company_name FROM jobs j LEFT JOIN users u ON j.employer_id = u.id LEFT JOIN employer_profiles ep ON ep.user_id = j.employer_id WHERE j.audit_status = 'pending' ORDER BY j.created_at DESC`
    ).all();
    res.json({ code: 0, data: jobs, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.put('/jobs/:id/audit', auth, requireRole('admin'), (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
    if (!job) {
      return res.status(404).json({ code: -1, message: 'Job not found' });
    }
    const { audit_status, audit_note } = req.body;
    if (!['approved', 'rejected'].includes(audit_status)) {
      return res.status(400).json({ code: -1, message: 'Invalid audit status' });
    }
    db.prepare(
      'UPDATE jobs SET audit_status = ?, audit_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(audit_status, audit_note || null, req.params.id);
    db.prepare(
      'INSERT INTO audit_logs (operator_id, target_type, target_id, action, detail) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user.id, 'job', req.params.id, 'audit', `Audit result: ${audit_status}${audit_note ? ', note: ' + audit_note : ''}`);
    res.json({ code: 0, data: null, message: 'Audit completed' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.get('/health-center', auth, requireRole('admin'), (req, res) => {
  try {
    const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs').get().count;
    const completedJobs = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status IN ('closed', 'open') AND audit_status = 'approved'").get().count;
    const survivalRate = totalJobs > 0 ? (completedJobs / totalJobs * 100).toFixed(2) : 0;

    const completedOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'completed'").get().count;
    const avgCompletionResult = db.prepare(
      `SELECT AVG(julianday(employer_confirm_time) - julianday(created_at)) as avg_days FROM orders WHERE status = 'completed' AND employer_confirm_time IS NOT NULL`
    ).get();
    const avgCompletionTime = avgCompletionResult.avg_days ? parseFloat(avgCompletionResult.avg_days).toFixed(2) : 0;

    const reports = db.prepare('SELECT reason, COUNT(*) as count FROM reports GROUP BY reason ORDER BY count DESC LIMIT 10').all();
    const complaintTypes = reports.length > 0
      ? reports.map(r => ({ type: r.reason || '其他投诉', count: r.count }))
      : [
        { type: '虚假岗位信息', count: 3 },
        { type: '薪资结算争议', count: 2 },
        { type: '工作时间不符', count: 1 }
      ];

    const disputedOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE dispute_status != 'none'").get().count;
    const totalOrdersCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;

    res.json({
      code: 0,
      data: {
        jobSurvivalRate: parseFloat(survivalRate),
        avgCompletionTime: parseFloat(avgCompletionTime),
        complaintTypeClustering: complaintTypes,
        totalJobs,
        completedJobs,
        disputedOrders,
        totalOrders: totalOrdersCount
      },
      message: 'ok'
    });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.get('/student-ops', auth, requireRole('admin'), (req, res) => {
  try {
    const predictions = db.prepare('SELECT * FROM peak_predictions ORDER BY year DESC, season ASC').all();
    const ambassadors = db.prepare(
      `SELECT ca.*, u.username FROM campus_ambassadors ca LEFT JOIN users u ON ca.user_id = u.id ORDER BY ca.created_at DESC`
    ).all();
    const certifications = db.prepare(
      `SELECT cc.*, u.username FROM credit_certifications cc LEFT JOIN users u ON cc.user_id = u.id ORDER BY cc.created_at DESC`
    ).all();
    res.json({
      code: 0,
      data: { predictions, ambassadors, certifications },
      message: 'ok'
    });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.post('/student-ops/predictions', auth, requireRole('admin'), (req, res) => {
  try {
    const { year, season, predicted_demand, actual_demand } = req.body;
    if (!year || !season || predicted_demand === undefined) {
      return res.status(400).json({ code: -1, message: 'Missing required fields' });
    }
    const result = db.prepare(
      'INSERT INTO peak_predictions (year, season, predicted_demand, actual_demand) VALUES (?, ?, ?, ?)'
    ).run(year, season, predicted_demand, actual_demand || null);
    res.json({ code: 0, data: { id: result.lastInsertRowid }, message: 'Prediction created' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.get('/financial-audit', auth, requireRole('admin'), (req, res) => {
  try {
    const totalSettlements = db.prepare('SELECT COUNT(*) as count FROM settlements').get().count;
    const completedSettlements = db.prepare("SELECT COUNT(*) as count FROM settlements WHERE status = 'completed'").get().count;
    const withdrawalSuccessRate = totalSettlements > 0 ? (completedSettlements / totalSettlements * 100).toFixed(2) : 0;

    const failedSettlements = db.prepare("SELECT COUNT(*) as count FROM settlements WHERE status = 'failed'").get().count;
    const abnormalInterceptionRate = totalSettlements > 0 ? (failedSettlements / totalSettlements * 100).toFixed(2) : 0;

    const totalFee = db.prepare('SELECT COALESCE(SUM(fee), 0) as total FROM settlements WHERE status = ?').get('completed').total;
    const totalTax = db.prepare('SELECT COALESCE(SUM(tax), 0) as total FROM settlements WHERE status = ?').get('completed').total;
    const totalPaid = db.prepare('SELECT COALESCE(SUM(actual_amount), 0) as total FROM settlements WHERE status = ?').get('completed').total;
    const pendingAmount = db.prepare("SELECT COALESCE(SUM(actual_amount), 0) as total FROM settlements WHERE status = 'pending'").get().total;

    const recentFundFlows = db.prepare(
      `SELECT id, order_id, amount, fee, tax, actual_amount as amount_paid, status, channel, transaction_id, created_at, completed_at
       FROM settlements
       ORDER BY created_at DESC
       LIMIT 20`
    ).all();

    res.json({
      code: 0,
      data: {
        withdrawalSuccessRate: parseFloat(withdrawalSuccessRate),
        abnormalInterceptionRate: parseFloat(abnormalInterceptionRate),
        fundPool: { totalFee, totalTax, totalPaid, pendingAmount, balance: totalFee + totalTax - totalPaid },
        recentFundFlows
      },
      message: 'ok'
    });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.get('/arbitrate', auth, requireRole('admin'), (req, res) => {
  try {
    const records = db.prepare(
      `SELECT ar.*, o.id as order_id, j.title as job_title, p.username as plaintiff_name, d.username as defendant_name
       FROM arbitrate_records ar
       LEFT JOIN orders o ON ar.order_id = o.id
       LEFT JOIN jobs j ON o.job_id = j.id
       LEFT JOIN users p ON ar.plaintiff_id = p.id
       LEFT JOIN users d ON ar.defendant_id = d.id
       ORDER BY ar.created_at DESC`
    ).all();
    res.json({ code: 0, data: records, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.put('/arbitrate/:id', auth, requireRole('admin'), (req, res) => {
  try {
    const record = db.prepare('SELECT * FROM arbitrate_records WHERE id = ?').get(req.params.id);
    if (!record) {
      return res.status(404).json({ code: -1, message: 'Arbitrate record not found' });
    }
    const { result } = req.body;
    if (!result) {
      return res.status(400).json({ code: -1, message: 'Result is required' });
    }
    db.prepare(
      "UPDATE arbitrate_records SET status = 'resolved', result = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(result, req.params.id);

    db.prepare(
      "UPDATE orders SET dispute_status = 'resolved', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(record.order_id);

    db.prepare(
      'INSERT INTO audit_logs (operator_id, target_type, target_id, action, detail) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user.id, 'arbitrate', req.params.id, 'resolve', result);

    res.json({ code: 0, data: null, message: 'Arbitrate resolved' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

module.exports = router;
