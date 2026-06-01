const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole, logBehavior } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', authenticateToken, requireRole('admin'), (req, res) => {
  const stats = {
    users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
    jobs: db.prepare('SELECT COUNT(*) as count FROM jobs').get().count,
    resumes: db.prepare('SELECT COUNT(*) as count FROM resumes').get().count,
    applications: db.prepare('SELECT COUNT(*) as count FROM job_applications').get().count,
    companies: db.prepare('SELECT COUNT(*) as count FROM companies').get().count,
    verified_companies: db.prepare("SELECT COUNT(*) as count FROM companies WHERE verification_status = 'verified'").get().count,
    pending_verifications: db.prepare("SELECT COUNT(*) as count FROM companies WHERE verification_status = 'pending'").get().count,
    pending_reports: db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'").get().count,
    frozen_users: db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'frozen'").get().count,
  };

  res.json({ stats });
});

router.get('/reports', authenticateToken, requireRole('admin'), (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT r.*, u.username as reporter_name
    FROM reports r
    JOIN users u ON r.reporter_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ' AND r.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const reports = db.prepare(sql).all(...params);

  res.json({ reports });
});

router.put('/reports/:id/handle', authenticateToken, requireRole('admin'), logBehavior('handle_report', 'report'), (req, res) => {
  const reportId = req.params.id;
  const { status, handling_note, freeze_target = false } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(reportId);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  db.prepare(`
    UPDATE reports 
    SET status = ?, handled_by = ?, handled_at = CURRENT_TIMESTAMP, handling_note = ?
    WHERE id = ?
  `).run(status, req.user.id, handling_note, reportId);

  if (freeze_target && status === 'resolved') {
    if (report.target_type === 'user') {
      db.prepare("UPDATE users SET status = 'frozen' WHERE id = ?").run(report.target_id);
    } else if (report.target_type === 'job') {
      db.prepare('UPDATE jobs SET is_active = 0 WHERE id = ?').run(report.target_id);
    } else if (report.target_type === 'post') {
      db.prepare('DELETE FROM community_posts WHERE id = ?').run(report.target_id);
    } else if (report.target_type === 'resume') {
      db.prepare('UPDATE resumes SET is_active = 0 WHERE id = ?').run(report.target_id);
    }
  }

  res.json({ message: 'Report handled successfully' });
});

router.get('/companies/verifications', authenticateToken, requireRole('admin'), (req, res) => {
  const { status = 'pending' } = req.query;

  const companies = db.prepare(`
    SELECT c.*, u.username, u.email, u.phone
    FROM companies c
    JOIN users u ON c.user_id = u.id
    WHERE c.verification_status = ?
    ORDER BY c.created_at ASC
  `).all(status);

  res.json({ companies });
});

router.put('/companies/:id/verify', authenticateToken, requireRole('admin'), logBehavior('verify_company', 'company'), (req, res) => {
  const companyId = req.params.id;
  const { status, verification_note, bank_verified = false } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  db.prepare(`
    UPDATE companies 
    SET verification_status = ?, verification_note = ?, bank_verified = ?
    WHERE id = ?
  `).run(status, verification_note, bank_verified ? 1 : 0, companyId);

  res.json({ message: 'Company verification updated' });
});

router.get('/users', authenticateToken, requireRole('admin'), (req, res) => {
  const { status, role, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let sql = 'SELECT id, username, email, role, phone, status, created_at FROM users WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (role) {
    sql += ' AND role = ?';
    params.push(role);
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const users = db.prepare(sql).all(...params);

  res.json({ users });
});

router.put('/users/:id/status', authenticateToken, requireRole('admin'), logBehavior('user_status', 'user'), (req, res) => {
  const { status } = req.body;

  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, req.params.id);

  res.json({ message: 'User status updated' });
});

router.get('/risk/users', authenticateToken, requireRole('admin'), (req, res) => {
  const { limit = 50 } = req.query;

  const highRiskUsers = db.prepare(`
    SELECT 
      bl.device_fingerprint,
      COUNT(DISTINCT bl.user_id) as account_count,
      COUNT(*) as action_count,
      MIN(bl.created_at) as first_seen,
      MAX(bl.created_at) as last_seen,
      GROUP_CONCAT(DISTINCT bl.user_id) as user_ids
    FROM behavior_logs bl
    WHERE bl.device_fingerprint IS NOT NULL
    GROUP BY bl.device_fingerprint
    HAVING account_count > 3
    ORDER BY account_count DESC
    LIMIT ?
  `).all(parseInt(limit));

  res.json({ high_risk_users: highRiskUsers });
});

module.exports = router;
