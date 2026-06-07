const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

router.post('/', auth, (req, res) => {
  try {
    const { order_id, type, reason } = req.body;
    if (!order_id || !type) {
      return res.status(400).json({ code: -1, message: 'Missing required fields' });
    }
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
    if (!order) {
      return res.status(404).json({ code: -1, message: 'Order not found' });
    }
    if (order.worker_id !== req.user.id && order.employer_id !== req.user.id) {
      return res.status(403).json({ code: -1, message: 'Access denied' });
    }
    if (!['customer_service', 'advance_compensation'].includes(type)) {
      return res.status(400).json({ code: -1, message: 'Invalid guarantee type' });
    }
    const result = db.prepare(
      'INSERT INTO guarantees (order_id, type, reason) VALUES (?, ?, ?)'
    ).run(order_id, type, reason || null);
    res.json({ code: 0, data: { id: result.lastInsertRowid }, message: 'Guarantee request created' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.get('/', auth, (req, res) => {
  try {
    let guarantees;
    if (req.user.role === 'admin') {
      guarantees = db.prepare(
        `SELECT g.*, j.title as job_title FROM guarantees g LEFT JOIN orders o ON g.order_id = o.id LEFT JOIN jobs j ON o.job_id = j.id ORDER BY g.created_at DESC`
      ).all();
    } else {
      guarantees = db.prepare(
        `SELECT g.*, j.title as job_title FROM guarantees g LEFT JOIN orders o ON g.order_id = o.id LEFT JOIN jobs j ON o.job_id = j.id WHERE o.worker_id = ? OR o.employer_id = ? ORDER BY g.created_at DESC`
      ).all(req.user.id, req.user.id);
    }
    res.json({ code: 0, data: guarantees, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.put('/:id', auth, requireRole('admin'), (req, res) => {
  try {
    const guarantee = db.prepare('SELECT * FROM guarantees WHERE id = ?').get(req.params.id);
    if (!guarantee) {
      return res.status(404).json({ code: -1, message: 'Guarantee not found' });
    }
    const { agent_id, compensation_amount, result, status } = req.body;
    if (status && !['resolved', 'rejected'].includes(status)) {
      return res.status(400).json({ code: -1, message: 'Invalid status' });
    }
    db.prepare(
      `UPDATE guarantees SET agent_id = COALESCE(?, agent_id), compensation_amount = COALESCE(?, compensation_amount), result = COALESCE(?, result), status = COALESCE(?, status), resolved_at = CASE WHEN ? IN ('resolved', 'rejected') THEN CURRENT_TIMESTAMP ELSE resolved_at END WHERE id = ?`
    ).run(agent_id, compensation_amount, result, status, status, req.params.id);
    res.json({ code: 0, data: null, message: 'Guarantee updated' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

module.exports = router;
