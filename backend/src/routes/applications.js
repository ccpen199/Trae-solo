const express = require('express');
const { db } = require('../models/db');
const { authMiddleware } = require('./auth');

const router = express.Router();

router.post('/', authMiddleware, (req, res) => {
  if (req.user.role !== 'seeker') {
    return res.status(403).json({ error: '只有求职者可以投递简历' });
  }

  const { job_id } = req.body;
  if (!job_id) {
    return res.status(400).json({ error: '请选择职位' });
  }

  const existing = db.prepare('SELECT * FROM applications WHERE job_id = ? AND seeker_id = ?')
    .get(job_id, req.user.seeker_id);

  if (existing) {
    return res.status(400).json({ error: '您已经投递过该职位' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO applications (job_id, seeker_id, status)
      VALUES (?, ?, 'pending')
    `).run(job_id, req.user.seeker_id);

    res.json({ id: result.lastInsertRowid, status: 'success' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/seeker/my', authMiddleware, (req, res) => {
  if (req.user.role !== 'seeker') {
    return res.status(403).json({ error: '无权限' });
  }

  const applications = db.prepare(`
    SELECT a.*, j.title, j.work_address, j.arrival_time, j.salary_min, j.salary_max,
           c.name as company_name
    FROM applications a
    LEFT JOIN jobs j ON a.job_id = j.id
    LEFT JOIN companies c ON j.company_id = c.id
    WHERE a.seeker_id = ?
    ORDER BY a.created_at DESC
  `).all(req.user.seeker_id);

  res.json(applications);
});

router.get('/company/my', authMiddleware, (req, res) => {
  if (req.user.role !== 'company') {
    return res.status(403).json({ error: '无权限' });
  }

  const applications = db.prepare(`
    SELECT a.*, j.title, j.work_address,
           js.name as seeker_name, js.phone, js.skills, js.experience, js.rating as seeker_rating
    FROM applications a
    LEFT JOIN jobs j ON a.job_id = j.id
    LEFT JOIN job_seekers js ON a.seeker_id = js.id
    WHERE j.company_id = ?
    ORDER BY a.created_at DESC
  `).all(req.user.company_id);

  res.json(applications);
});

router.put('/:id/status', authMiddleware, (req, res) => {
  if (req.user.role !== 'company') {
    return res.status(403).json({ error: '无权限' });
  }

  const { status } = req.body;
  if (!['pending', 'reviewed', 'interview', 'rejected', 'hired'].includes(status)) {
    return res.status(400).json({ error: '无效的状态' });
  }

  db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ status: 'success' });
});

module.exports = router;
