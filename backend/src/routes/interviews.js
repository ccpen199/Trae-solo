const express = require('express');
const db = require('../db');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { logAction } = require('../middleware/audit');

const router = express.Router();

router.post('/', authenticateJWT, requireRole('hr', 'admin'), (req, res) => {
  const { application_id, interview_time, interview_method, interviewer, location, remark } = req.body;

  const app = db.prepare(`
    SELECT a.*, j.enterprise_id FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE a.id = ?
  `).get(application_id);

  if (!app) {
    return res.status(404).json({ error: '投递记录不存在' });
  }

  const enterprise = db.prepare('SELECT * FROM enterprises WHERE user_id = ?').get(req.user.id);
  if (req.user.role !== 'admin' && (!enterprise || enterprise.id !== app.enterprise_id)) {
    return res.status(403).json({ error: '无权限操作' });
  }

  const info = db.prepare(`
    INSERT INTO interviews (application_id, interview_time, interview_method, interviewer, location, remark)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(application_id, interview_time, interview_method, interviewer, location, remark);

  db.prepare(`
    UPDATE applications SET status = 'interview', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(application_id);

  logAction('schedule_interview', req, 'interview', info.lastInsertRowid,
    `安排面试，时间：${interview_time}`);

  res.json({ interviewId: info.lastInsertRowid });
});

router.get('/calendar', authenticateJWT, requireRole('hr', 'admin'), (req, res) => {
  const { start_date, end_date } = req.query;

  const enterprise = db.prepare('SELECT * FROM enterprises WHERE user_id = ?').get(req.user.id);

  let sql = `
    SELECT i.*, a.job_seeker_id, j.job_title, js.name, c.category_name
    FROM interviews i
    JOIN applications a ON i.application_id = a.id
    JOIN jobs j ON a.job_id = j.id
    JOIN job_seekers js ON a.job_seeker_id = js.id
    JOIN manufacturing_job_categories c ON j.job_category_code = c.category_code
    WHERE 1=1
  `;
  const params = [];

  if (req.user.role !== 'admin' && enterprise) {
    sql += ' AND j.enterprise_id = ?';
    params.push(enterprise.id);
  }
  if (start_date) {
    sql += ' AND DATE(i.interview_time) >= ?';
    params.push(start_date);
  }
  if (end_date) {
    sql += ' AND DATE(i.interview_time) <= ?';
    params.push(end_date);
  }

  sql += ' ORDER BY i.interview_time ASC';

  const interviews = db.prepare(sql).all(...params);

  res.json({ interviews });
});

router.put('/:id/sync-calendar', authenticateJWT, requireRole('hr', 'admin'), (req, res) => {
  const { calendar_provider, calendar_event_id, status = 'synced' } = req.body;

  db.prepare(`
    UPDATE interviews SET
      calendar_sync_status = ?,
      calendar_provider = ?,
      calendar_event_id = ?
    WHERE id = ?
  `).run(status, calendar_provider, calendar_event_id, req.params.id);

  logAction('sync_calendar', req, 'interview', req.params.id,
    `同步日历：${calendar_provider}`);

  res.json({ success: true });
});

router.put('/:id', authenticateJWT, requireRole('hr', 'admin'), (req, res) => {
  const { interview_time, interview_method, interviewer, location, remark } = req.body;

  const interview = db.prepare(`
    SELECT i.*, j.enterprise_id FROM interviews i
    JOIN applications a ON i.application_id = a.id
    JOIN jobs j ON a.job_id = j.id
    WHERE i.id = ?
  `).get(req.params.id);

  if (!interview) {
    return res.status(404).json({ error: '面试记录不存在' });
  }

  const enterprise = db.prepare('SELECT * FROM enterprises WHERE user_id = ?').get(req.user.id);
  if (req.user.role !== 'admin' && (!enterprise || enterprise.id !== interview.enterprise_id)) {
    return res.status(403).json({ error: '无权限操作' });
  }

  db.prepare(`
    UPDATE interviews SET
      interview_time = COALESCE(?, interview_time),
      interview_method = COALESCE(?, interview_method),
      interviewer = COALESCE(?, interviewer),
      location = COALESCE(?, location),
      remark = COALESCE(?, remark)
    WHERE id = ?
  `).run(interview_time, interview_method, interviewer, location, remark, req.params.id);

  logAction('update_interview', req, 'interview', req.params.id, '更新面试安排');

  res.json({ success: true });
});

module.exports = router;
