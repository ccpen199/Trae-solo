const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', (req, res) => {
  try {
    const { category, keyword, min_wage, max_wage, page = 1, pageSize = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    let where = "WHERE audit_status = 'approved' AND status = 'open'";
    const params = [];

    if (category) {
      where += ' AND category = ?';
      params.push(category);
    }
    if (keyword) {
      where += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (min_wage) {
      where += ' AND hourly_wage >= ?';
      params.push(parseFloat(min_wage));
    }
    if (max_wage) {
      where += ' AND hourly_wage <= ?';
      params.push(parseFloat(max_wage));
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM jobs ${where}`).get(...params).count;
    const jobs = db.prepare(
      `SELECT j.*, u.username as employer_name, ep.company_name, ep.verified as employer_verified FROM jobs j LEFT JOIN users u ON j.employer_id = u.id LEFT JOIN employer_profiles ep ON ep.user_id = j.employer_id ${where} ORDER BY j.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, parseInt(pageSize), offset);

    res.json({
      code: 0,
      data: { list: jobs, total, page: parseInt(page), pageSize: parseInt(pageSize) },
      message: 'ok'
    });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.post('/', auth, requireRole('employer'), (req, res) => {
  try {
    const profile = db.prepare('SELECT * FROM employer_profiles WHERE user_id = ?').get(req.user.id);
    if (!profile) {
      return res.status(400).json({ code: -1, message: 'Employer profile not found' });
    }
    if (profile.publish_count >= profile.publish_limit) {
      return res.status(400).json({ code: -1, message: 'Publish limit reached' });
    }
    const { title, description, work_time, work_location, hourly_wage, category } = req.body;
    if (!title) {
      return res.status(400).json({ code: -1, message: 'Title is required' });
    }
    const result = db.prepare(
      `INSERT INTO jobs (employer_id, title, description, work_time, work_location, hourly_wage, category) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(req.user.id, title, description, work_time, work_location, hourly_wage, category);

    db.prepare('UPDATE employer_profiles SET publish_count = publish_count + 1 WHERE user_id = ?').run(req.user.id);

    res.json({ code: 0, data: { id: result.lastInsertRowid }, message: 'Job created, pending audit' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const job = db.prepare(
      `SELECT j.*, u.username as employer_name, ep.company_name, ep.verified as employer_verified FROM jobs j LEFT JOIN users u ON j.employer_id = u.id LEFT JOIN employer_profiles ep ON ep.user_id = j.employer_id WHERE j.id = ?`
    ).get(req.params.id);
    if (!job) {
      return res.status(404).json({ code: -1, message: 'Job not found' });
    }
    db.prepare('UPDATE jobs SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);
    job.view_count += 1;
    res.json({ code: 0, data: job, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.put('/:id', auth, requireRole('employer'), (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
    if (!job) {
      return res.status(404).json({ code: -1, message: 'Job not found' });
    }
    if (job.employer_id !== req.user.id) {
      return res.status(403).json({ code: -1, message: 'Not the job owner' });
    }
    const { title, description, work_time, work_location, hourly_wage, category } = req.body;
    db.prepare(
      `UPDATE jobs SET title = COALESCE(?, title), description = COALESCE(?, description), work_time = COALESCE(?, work_time), work_location = COALESCE(?, work_location), hourly_wage = COALESCE(?, hourly_wage), category = COALESCE(?, category), updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(title, description, work_time, work_location, hourly_wage, category, req.params.id);
    res.json({ code: 0, data: null, message: 'Job updated' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.delete('/:id', auth, requireRole('employer'), (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
    if (!job) {
      return res.status(404).json({ code: -1, message: 'Job not found' });
    }
    if (job.employer_id !== req.user.id) {
      return res.status(403).json({ code: -1, message: 'Not the job owner' });
    }
    db.prepare("UPDATE jobs SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
    res.json({ code: 0, data: null, message: 'Job cancelled' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.post('/:id/report', auth, requireRole('worker'), (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
    if (!job) {
      return res.status(404).json({ code: -1, message: 'Job not found' });
    }
    const { reason } = req.body;
    db.prepare('UPDATE jobs SET report_count = report_count + 1 WHERE id = ?').run(req.params.id);
    const newCount = job.report_count + 1;
    if (newCount >= 3) {
      db.prepare("UPDATE jobs SET audit_status = 'rejected', audit_note = 'Auto-rejected due to reports' WHERE id = ?").run(req.params.id);
    }
    db.prepare('INSERT INTO reports (reporter_id, job_id, reason) VALUES (?, ?, ?)').run(req.user.id, req.params.id, reason);
    res.json({ code: 0, data: null, message: 'Report submitted' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.get('/:id/employer-verification', (req, res) => {
  try {
    const job = db.prepare('SELECT employer_id FROM jobs WHERE id = ?').get(req.params.id);
    if (!job) {
      return res.status(404).json({ code: -1, message: 'Job not found' });
    }
    const profile = db.prepare(`
      SELECT ep.*, u.username, u.created_at as user_created_at
      FROM employer_profiles ep
      LEFT JOIN users u ON ep.user_id = u.id
      WHERE ep.user_id = ?
    `).get(job.employer_id);

    const auditLogs = db.prepare(`
      SELECT al.*, u.username as operator_name
      FROM audit_logs al
      LEFT JOIN users u ON al.operator_id = u.id
      WHERE al.target_type = 'employer' AND al.target_id = ?
      ORDER BY al.created_at DESC
    `).all(job.employer_id);

    const jobAuditLogs = db.prepare(`
      SELECT al.*, u.username as operator_name
      FROM audit_logs al
      LEFT JOIN users u ON al.operator_id = u.id
      WHERE al.target_type = 'job' AND al.target_id = ?
      ORDER BY al.created_at DESC
    `).all(req.params.id);

    const reports = db.prepare(`
      SELECT r.*, u.username as reporter_name
      FROM reports r
      LEFT JOIN users u ON r.reporter_id = u.id
      WHERE r.job_id = ?
      ORDER BY r.created_at DESC
    `).all(req.params.id);

    const delistedReports = db.prepare(`
      SELECT r.*, u.username as reporter_name
      FROM reports r
      LEFT JOIN users u ON r.reporter_id = u.id
      WHERE r.job_id = ? AND r.status IN ('resolved', 'processing')
      ORDER BY r.created_at DESC
    `).all(req.params.id);

    const publishLimit = profile ? profile.publish_limit : 0;
    const publishCountIn30Days = db.prepare(
      `SELECT COUNT(*) as count FROM jobs WHERE employer_id = ? AND created_at >= datetime('now', '-30 days')`
    ).get(job.employer_id).count;

    res.json({
      code: 0,
      data: {
        profile,
        auditLogs,
        jobAuditLogs,
        reports,
        delistedReports,
        throttle: { publishLimit, publishCountIn30Days }
      },
      message: 'ok'
    });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

module.exports = router;
