const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  try {
    let settlements;
    if (req.user.role === 'worker') {
      settlements = db.prepare(
        `SELECT s.*, j.title as job_title FROM settlements s LEFT JOIN orders o ON s.order_id = o.id LEFT JOIN jobs j ON o.job_id = j.id WHERE s.worker_id = ? ORDER BY s.created_at DESC`
      ).all(req.user.id);
    } else if (req.user.role === 'employer') {
      settlements = db.prepare(
        `SELECT s.*, j.title as job_title FROM settlements s LEFT JOIN orders o ON s.order_id = o.id LEFT JOIN jobs j ON o.job_id = j.id WHERE s.employer_id = ? ORDER BY s.created_at DESC`
      ).all(req.user.id);
    } else {
      settlements = db.prepare(
        `SELECT s.*, j.title as job_title FROM settlements s LEFT JOIN orders o ON s.order_id = o.id LEFT JOIN jobs j ON o.job_id = j.id ORDER BY s.created_at DESC`
      ).all();
    }
    res.json({ code: 0, data: settlements, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.get('/:id', auth, (req, res) => {
  try {
    const settlement = db.prepare(
      `SELECT s.*, j.title as job_title FROM settlements s LEFT JOIN orders o ON s.order_id = o.id LEFT JOIN jobs j ON o.job_id = j.id WHERE s.id = ?`
    ).get(req.params.id);
    if (!settlement) {
      return res.status(404).json({ code: -1, message: 'Settlement not found' });
    }
    if (req.user.role !== 'admin' && settlement.worker_id !== req.user.id && settlement.employer_id !== req.user.id) {
      return res.status(403).json({ code: -1, message: 'Access denied' });
    }
    res.json({ code: 0, data: settlement, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.post('/:id/confirm', auth, requireRole('worker'), (req, res) => {
  try {
    const settlement = db.prepare('SELECT * FROM settlements WHERE id = ?').get(req.params.id);
    if (!settlement) {
      return res.status(404).json({ code: -1, message: 'Settlement not found' });
    }
    if (settlement.worker_id !== req.user.id) {
      return res.status(403).json({ code: -1, message: 'Not the worker' });
    }
    if (settlement.status !== 'pending') {
      return res.status(400).json({ code: -1, message: 'Settlement cannot be confirmed' });
    }
    db.prepare(
      "UPDATE settlements SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(req.params.id);
    res.json({ code: 0, data: null, message: 'Settlement confirmed' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

module.exports = router;
