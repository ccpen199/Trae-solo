const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

router.post('/', auth, requireRole('worker'), (req, res) => {
  try {
    const { job_id, reason } = req.body;
    if (!job_id || !reason) {
      return res.status(400).json({ code: -1, message: 'Missing required fields' });
    }
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(job_id);
    if (!job) {
      return res.status(404).json({ code: -1, message: 'Job not found' });
    }
    const result = db.prepare(
      'INSERT INTO reports (reporter_id, job_id, reason) VALUES (?, ?, ?)'
    ).run(req.user.id, job_id, reason);
    res.json({ code: 0, data: { id: result.lastInsertRowid }, message: 'Report submitted' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.get('/', auth, requireRole('admin'), (req, res) => {
  try {
    const reports = db.prepare(
      `SELECT r.*, u.username as reporter_name, j.title as job_title
       FROM reports r
       LEFT JOIN users u ON r.reporter_id = u.id
       LEFT JOIN jobs j ON r.job_id = j.id
       ORDER BY r.created_at DESC`
    ).all();
    res.json({ code: 0, data: reports, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.put('/:id', auth, requireRole('admin'), (req, res) => {
  try {
    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
    if (!report) {
      return res.status(404).json({ code: -1, message: 'Report not found' });
    }
    const { status } = req.body;
    if (!['reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({ code: -1, message: 'Invalid status' });
    }
    db.prepare('UPDATE reports SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ code: 0, data: null, message: 'Report updated' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

module.exports = router;
