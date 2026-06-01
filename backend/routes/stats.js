const express = require('express');
const router = express.Router();

router.get('/overview', (req, res) => {
  const { start_date, end_date } = req.query;
  
  let dateFilter = '';
  let params = [];
  if (start_date && end_date) {
    dateFilter = ' AND date(created_at) BETWEEN ? AND ?';
    params = [start_date, end_date];
  }

  const policyCount = req.db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(insurance_amount), 0) as total_amount,
           COALESCE(SUM(premium), 0) as total_premium
    FROM policies WHERE 1=1 ${dateFilter}
  `).get(...params);

  const reportCount = req.db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(damaged_area), 0) as total_damaged_area
    FROM reports WHERE 1=1 ${dateFilter}
  `).get(...params);

  const claimCount = req.db.prepare(`
    SELECT COUNT(*) as count, 
           COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
           COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
           COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
           COUNT(CASE WHEN status = 'reviewing' THEN 1 END) as reviewing_count,
           COALESCE(SUM(compensation_amount), 0) as total_compensation,
           COALESCE(SUM(CASE WHEN status = 'paid' THEN compensation_amount END), 0) as paid_compensation
    FROM claims WHERE 1=1 ${dateFilter}
  `).get(...params);

  const avgProcessTime = req.db.prepare(`
    SELECT AVG(
      CAST((julianday(COALESCE(payment_time, review_time, CURRENT_TIMESTAMP)) - julianday(created_at)) * 24 AS REAL)
    ) as avg_hours
    FROM claims WHERE status IN ('approved', 'rejected', 'paid') ${dateFilter.replace('AND', '')}
  `).get(...params);

  res.json({
    policies: policyCount,
    reports: reportCount,
    claims: claimCount,
    avg_process_hours: avgProcessTime.avg_hours || 0
  });
});

router.get('/disaster-distribution', (req, res) => {
  const { start_date, end_date } = req.query;
  
  let dateFilter = '';
  let params = [];
  if (start_date && end_date) {
    dateFilter = ' AND date(r.created_at) BETWEEN ? AND ?';
    params = [start_date, end_date];
  }

  const data = req.db.prepare(`
    SELECT r.disaster_type, d.name as disaster_name, d.category,
           COUNT(*) as report_count,
           COALESCE(SUM(r.damaged_area), 0) as total_damaged_area,
           COALESCE(SUM(c.compensation_amount), 0) as total_compensation
    FROM reports r
    LEFT JOIN disaster_types d ON r.disaster_type = d.code
    LEFT JOIN claims c ON c.report_id = r.id
    WHERE 1=1 ${dateFilter}
    GROUP BY r.disaster_type
    ORDER BY report_count DESC
  `).all(...params);

  res.json(data);
});

router.get('/compensation-progress', (req, res) => {
  const data = req.db.prepare(`
    SELECT status, COUNT(*) as count,
           COALESCE(SUM(compensation_amount), 0) as amount
    FROM claims
    GROUP BY status
    ORDER BY count DESC
  `).all();

  res.json(data);
});

router.get('/rejection-reasons', (req, res) => {
  const data = req.db.prepare(`
    SELECT rejection_reason, COUNT(*) as count
    FROM claims
    WHERE status = 'rejected' AND rejection_reason IS NOT NULL
    GROUP BY rejection_reason
    ORDER BY count DESC
  `).all();

  res.json(data);
});

router.get('/crop-distribution', (req, res) => {
  const data = req.db.prepare(`
    SELECT p.crop_type, c.name as crop_name, c.category,
           COUNT(*) as policy_count,
           COALESCE(SUM(p.area), 0) as total_area,
           COALESCE(SUM(p.insurance_amount), 0) as total_amount,
           COUNT(DISTINCT r.id) as report_count,
           COALESCE(SUM(c2.compensation_amount), 0) as total_compensation
    FROM policies p
    LEFT JOIN crop_types c ON p.crop_type = c.code
    LEFT JOIN reports r ON r.policy_id = p.id
    LEFT JOIN claims c2 ON c2.report_id = r.id
    GROUP BY p.crop_type
    ORDER BY policy_count DESC
  `).all();

  res.json(data);
});

router.get('/processing-time', (req, res) => {
  const { start_date, end_date } = req.query;
  
  let dateFilter = '';
  let params = [];
  if (start_date && end_date) {
    dateFilter = ' WHERE date(c.created_at) BETWEEN ? AND ?';
    params = [start_date, end_date];
  }

  const data = req.db.prepare(`
    SELECT 
      AVG(CAST((julianday(s.created_at) - julianday(r.created_at)) * 24 AS REAL)) as avg_report_to_survey_hours,
      AVG(CAST((julianday(c.created_at) - julianday(s.created_at)) * 24 AS REAL)) as avg_survey_to_claim_hours,
      AVG(CAST((julianday(c.review_time) - julianday(c.created_at)) * 24 AS REAL)) as avg_claim_to_approval_hours,
      AVG(CAST((julianday(c.payment_time) - julianday(c.review_time)) * 24 AS REAL)) as avg_approval_to_payment_hours,
      AVG(CAST((julianday(COALESCE(c.payment_time, c.review_time)) - julianday(r.created_at)) * 24 AS REAL)) as avg_total_hours
    FROM claims c
    LEFT JOIN reports r ON c.report_id = r.id
    LEFT JOIN surveys s ON s.report_id = r.id
    ${dateFilter}
  `).get(...params);

  res.json(data);
});

router.get('/regulatory-report', (req, res) => {
  const { start_date, end_date } = req.query;
  
  let dateFilter = '';
  let params = [];
  if (start_date && end_date) {
    dateFilter = ' AND date(created_at) BETWEEN ? AND ?';
    params = [start_date, end_date];
  }

  const policies = req.db.prepare(`
    SELECT crop_type, COUNT(*) as count,
           COALESCE(SUM(area), 0) as area,
           COALESCE(SUM(insurance_amount), 0) as insurance_amount,
           COALESCE(SUM(premium), 0) as premium
    FROM policies WHERE 1=1 ${dateFilter}
    GROUP BY crop_type
    ORDER BY count DESC
  `).all(...params);

  const reports = req.db.prepare(`
    SELECT disaster_type, COUNT(*) as count,
           COALESCE(SUM(damaged_area), 0) as damaged_area
    FROM reports WHERE 1=1 ${dateFilter}
    GROUP BY disaster_type
    ORDER BY count DESC
  `).all(...params);

  const claims = req.db.prepare(`
    SELECT status, COUNT(*) as count,
           COALESCE(SUM(compensation_amount), 0) as compensation_amount
    FROM claims WHERE 1=1 ${dateFilter}
    GROUP BY status
  `).all(...params);

  res.json({
    period: { start_date, end_date },
    generated_at: new Date().toISOString(),
    policies,
    reports,
    claims
  });
});

module.exports = router;
