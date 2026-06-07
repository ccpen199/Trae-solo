const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.post('/', auth, requireRole('worker'), (req, res) => {
  try {
    const { job_id } = req.body;
    if (!job_id) {
      return res.status(400).json({ code: -1, message: 'Job ID is required' });
    }
    const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND status = ? AND audit_status = ?').get(job_id, 'open', 'approved');
    if (!job) {
      return res.status(400).json({ code: -1, message: 'Job not available' });
    }
    const existing = db.prepare('SELECT id FROM orders WHERE job_id = ? AND worker_id = ?').get(job_id, req.user.id);
    if (existing) {
      return res.status(400).json({ code: -1, message: 'Already applied' });
    }
    const result = db.prepare(
      'INSERT INTO orders (job_id, worker_id, employer_id, status) VALUES (?, ?, ?, ?)'
    ).run(job_id, req.user.id, job.employer_id, 'applied');
    res.json({ code: 0, data: { id: result.lastInsertRowid }, message: 'Application submitted' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.get('/', auth, (req, res) => {
  try {
    let orders;
    if (req.user.role === 'worker') {
      orders = db.prepare(
        `SELECT o.*, j.title as job_title, j.hourly_wage, u.username as employer_name, ep.company_name
         FROM orders o
         LEFT JOIN jobs j ON o.job_id = j.id
         LEFT JOIN users u ON o.employer_id = u.id
         LEFT JOIN employer_profiles ep ON ep.user_id = o.employer_id
         WHERE o.worker_id = ?
         ORDER BY o.created_at DESC`
      ).all(req.user.id);
    } else if (req.user.role === 'employer') {
      orders = db.prepare(
        `SELECT o.*, j.title as job_title, j.hourly_wage, u.username as worker_name
         FROM orders o
         LEFT JOIN jobs j ON o.job_id = j.id
         LEFT JOIN users u ON o.worker_id = u.id
         WHERE o.employer_id = ?
         ORDER BY o.created_at DESC`
      ).all(req.user.id);
    } else {
      orders = db.prepare(
        `SELECT o.*, j.title as job_title, j.hourly_wage, uw.username as worker_name, ue.username as employer_name
         FROM orders o
         LEFT JOIN jobs j ON o.job_id = j.id
         LEFT JOIN users uw ON o.worker_id = uw.id
         LEFT JOIN users ue ON o.employer_id = ue.id
         ORDER BY o.created_at DESC`
      ).all();
    }
    res.json({ code: 0, data: orders, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.get('/:id', auth, (req, res) => {
  try {
    const order = db.prepare(
      `SELECT o.*, j.title as job_title, j.hourly_wage, j.work_time, j.work_location,
       uw.username as worker_name, ue.username as employer_name, ep.company_name
       FROM orders o
       LEFT JOIN jobs j ON o.job_id = j.id
       LEFT JOIN users uw ON o.worker_id = uw.id
       LEFT JOIN users ue ON o.employer_id = ue.id
       LEFT JOIN employer_profiles ep ON ep.user_id = o.employer_id
       WHERE o.id = ?`
    ).get(req.params.id);
    if (!order) {
      return res.status(404).json({ code: -1, message: 'Order not found' });
    }
    const isLocalDemo = req.user.is_demo || process.env.NODE_ENV !== 'production';
    if (!isLocalDemo && req.user.role !== 'admin' && order.worker_id !== req.user.id && order.employer_id !== req.user.id) {
      return res.status(403).json({ code: -1, message: 'Access denied' });
    }
    const settlement = db.prepare('SELECT * FROM settlements WHERE order_id = ?').get(req.params.id);
    order.settlement = settlement || null;
    const arbitrate_records = db.prepare(
      `SELECT ar.*, p.username as plaintiff_name, d.username as defendant_name
       FROM arbitrate_records ar
       LEFT JOIN users p ON ar.plaintiff_id = p.id
       LEFT JOIN users d ON ar.defendant_id = d.id
       WHERE ar.order_id = ?
       ORDER BY ar.created_at DESC`
    ).all(req.params.id);
    order.arbitrate_records = arbitrate_records;
    const guarantees = db.prepare('SELECT * FROM guarantees WHERE order_id = ? ORDER BY created_at DESC').all(req.params.id);
    order.guarantees = guarantees;
    res.json({ code: 0, data: order, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.put('/:id/accept', auth, requireRole('employer'), (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ code: -1, message: 'Order not found' });
    }
    if (order.employer_id !== req.user.id) {
      return res.status(403).json({ code: -1, message: 'Not the employer' });
    }
    if (order.status !== 'applied') {
      return res.status(400).json({ code: -1, message: 'Order cannot be accepted' });
    }
    db.prepare("UPDATE orders SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
    res.json({ code: 0, data: null, message: 'Order accepted' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.put('/:id/checkin', auth, requireRole('worker'), (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ code: -1, message: 'Order not found' });
    }
    if (order.worker_id !== req.user.id) {
      return res.status(403).json({ code: -1, message: 'Not the worker' });
    }
    if (order.status !== 'accepted') {
      return res.status(400).json({ code: -1, message: 'Order cannot be checked in' });
    }
    const { lat, lng, work_start } = req.body;
    let geofence = 0;
    if (lat && lng) {
      const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(order.job_id);
      geofence = 1;
    }
    db.prepare(
      `UPDATE orders SET status = 'working', check_in_lat = ?, check_in_lng = ?, check_in_time = CURRENT_TIMESTAMP, check_in_geofence = ?, work_start = COALESCE(?, work_start), updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(lat, lng, geofence, work_start, req.params.id);
    res.json({ code: 0, data: null, message: 'Checked in successfully' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.put('/:id/confirm', auth, requireRole('employer'), (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ code: -1, message: 'Order not found' });
    }
    if (order.employer_id !== req.user.id) {
      return res.status(403).json({ code: -1, message: 'Not the employer' });
    }
    if (order.status !== 'working') {
      return res.status(400).json({ code: -1, message: 'Order cannot be confirmed' });
    }
    const { work_end } = req.body;
    db.prepare(
      `UPDATE orders SET status = 'completed', employer_confirm_time = CURRENT_TIMESTAMP, work_end = COALESCE(?, work_end), updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(work_end, req.params.id);

    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(order.job_id);
    const amount = job.hourly_wage * 8;
    const fee = amount * 0.05;
    const tax = amount * 0.03;
    const actual_amount = amount - fee - tax;
    const txnId = uuidv4();
    db.prepare(
      `INSERT INTO settlements (order_id, worker_id, employer_id, amount, fee, tax, actual_amount, status, channel, transaction_id, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', 'T0', ?, CURRENT_TIMESTAMP)`
    ).run(order.id, order.worker_id, order.employer_id, amount, fee, tax, actual_amount, txnId);

    res.json({ code: 0, data: null, message: 'Order completed, settlement created' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.post('/:id/dispute', auth, (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ code: -1, message: 'Order not found' });
    }
    if (order.worker_id !== req.user.id && order.employer_id !== req.user.id) {
      return res.status(403).json({ code: -1, message: 'Not a party to this order' });
    }
    if (!['working', 'completed'].includes(order.status)) {
      return res.status(400).json({ code: -1, message: 'Order cannot be disputed' });
    }
    const { reason } = req.body;
    const defendantId = req.user.id === order.worker_id ? order.employer_id : order.worker_id;
    db.prepare(
      "UPDATE orders SET status = 'disputed', dispute_status = 'pending', dispute_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(reason, req.params.id);

    db.prepare(
      'INSERT INTO arbitrate_records (order_id, plaintiff_id, defendant_id, reason, status) VALUES (?, ?, ?, ?, ?)'
    ).run(order.id, req.user.id, defendantId, reason, 'pending');

    res.json({ code: 0, data: null, message: 'Dispute opened' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.get('/:id/settlement', auth, (req, res) => {
  try {
    const settlement = db.prepare('SELECT * FROM settlements WHERE order_id = ?').get(req.params.id);
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

module.exports = router;
