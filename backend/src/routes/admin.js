const express = require('express');
const db = require('../db');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { logAction } = require('../middleware/audit');

const router = express.Router();

router.get('/enterprises/pending', authenticateJWT, requireRole('admin'), (req, res) => {
  const enterprises = db.prepare(`
    SELECT e.*, u.username, u.email
    FROM enterprises e
    JOIN users u ON e.user_id = u.id
    WHERE e.qualification_status = 'pending'
    ORDER BY e.created_at DESC
  `).all();

  res.json({ enterprises });
});

router.get('/enterprises', authenticateJWT, requireRole('admin'), (req, res) => {
  const { status } = req.query;

  let sql = `
    SELECT e.*, u.username, u.email
    FROM enterprises e
    JOIN users u ON e.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ' AND e.qualification_status = ?';
    params.push(status);
  }

  sql += ' ORDER BY e.created_at DESC';

  const enterprises = db.prepare(sql).all(...params);
  res.json({ enterprises });
});

router.put('/enterprises/:id/qualification', authenticateJWT, requireRole('admin'), (req, res) => {
  const { status, remark } = req.body;

  const enterprise = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(req.params.id);
  if (!enterprise) {
    return res.status(404).json({ error: '企业不存在' });
  }

  db.prepare(`
    UPDATE enterprises SET
      qualification_status = ?,
      qualification_reviewed_by = ?,
      qualification_reviewed_at = CURRENT_TIMESTAMP,
      qualification_remark = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, req.user.id, remark, req.params.id);

  logAction('review_enterprise_qualification', req, 'enterprise', req.params.id,
    `资质审核结果：${status}，备注：${remark || '无'}`);

  res.json({ success: true });
});

router.get('/audit-logs', authenticateJWT, requireRole('admin'), (req, res) => {
  const { page = 1, pageSize = 20, operator_id, action, target_type } = req.query;
  const offset = (page - 1) * pageSize;

  let sql = `
    SELECT a.*, u.username
    FROM audit_logs a
    LEFT JOIN users u ON a.operator_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (operator_id) {
    sql += ' AND a.operator_id = ?';
    params.push(parseInt(operator_id));
  }
  if (action) {
    sql += ' AND a.action LIKE ?';
    params.push(`%${action}%`);
  }
  if (target_type) {
    sql += ' AND a.target_type = ?';
    params.push(target_type);
  }

  sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), parseInt(offset));

  const logs = db.prepare(sql).all(...params);

  const countSql = sql.replace(/SELECT .*? FROM/, 'SELECT COUNT(*) as total FROM').replace(/ ORDER BY.*$/, '');
  const { total } = db.prepare(countSql).all(...params.slice(0, -2))[0];

  res.json({
    logs,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
  });
});

router.get('/stats/summary', authenticateJWT, requireRole('admin'), (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const totalEnterprises = db.prepare('SELECT COUNT(*) as count FROM enterprises').get().count;
  const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs').get().count;
  const totalApplications = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
  const pendingEnterprises = db.prepare("SELECT COUNT(*) as count FROM enterprises WHERE qualification_status = 'pending'").get().count;
  const activeJobs = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'active'").get().count;
  const hiredCount = db.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'hired'").get().count;

  res.json({
    totalUsers,
    totalEnterprises,
    totalJobs,
    totalApplications,
    pendingEnterprises,
    activeJobs,
    hiredCount,
    approvedEnterprises: db.prepare("SELECT COUNT(*) as count FROM enterprises WHERE qualification_status = 'approved'").get().count,
    rejectedEnterprises: db.prepare("SELECT COUNT(*) as count FROM enterprises WHERE qualification_status = 'rejected'").get().count,
    monthlyHired: db.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'hired' AND strftime('%Y-%m', hired_at) = strftime('%Y-%m', 'now')").get().count,
    dailyActiveUsers: db.prepare("SELECT COUNT(DISTINCT operator_id) as count FROM audit_logs WHERE DATE(created_at) = DATE('now')").get().count,
    jobPostRate: Math.round(activeJobs / Math.max(totalJobs, 1) * 100),
    hireRate: Math.round(hiredCount / Math.max(totalApplications, 1) * 100),
  });
});

router.get('/salary-compliance-check', authenticateJWT, requireRole('admin'), (req, res) => {
  const jobs = db.prepare(`
    SELECT j.*, e.enterprise_name, c.category_name,
           sr.salary_min as ref_min, sr.salary_max as ref_max
    FROM jobs j
    JOIN enterprises e ON j.enterprise_id = e.id
    JOIN manufacturing_job_categories c ON j.job_category_code = c.category_code
    LEFT JOIN salary_references sr ON j.job_category_code = sr.job_category_code 
           AND j.city = sr.city AND j.work_experience_required = sr.work_years
    WHERE j.salary_compliance_checked = 0
    LIMIT 50
  `).all();

  res.json({ jobs: jobs.map(j => ({
    ...j,
    ability_model: j.ability_model ? JSON.parse(j.ability_model) : null,
  })) });
});

module.exports = router;
