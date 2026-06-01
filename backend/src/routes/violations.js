const express = require('express');
const db = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  const { status, vehicle_id } = req.query;
  let sql = `
    SELECT v.*, ve.plate_number, ve.brand, ve.model, o.order_no
    FROM violations v
    LEFT JOIN vehicles ve ON v.vehicle_id = ve.id
    LEFT JOIN orders o ON v.order_id = o.id
    WHERE 1=1
  `;
  const params = [];
  if (status) {
    sql += ' AND v.status = ?';
    params.push(status);
  }
  if (vehicle_id) {
    sql += ' AND v.vehicle_id = ?';
    params.push(vehicle_id);
  }
  sql += ' ORDER BY v.id DESC';
  const violations = db.prepare(sql).all(...params);
  res.json(violations);
});

router.get('/:id', (req, res) => {
  const violation = db.prepare(`
    SELECT v.*, ve.plate_number, ve.brand, ve.model, o.order_no
    FROM violations v
    LEFT JOIN vehicles ve ON v.vehicle_id = ve.id
    LEFT JOIN orders o ON v.order_id = o.id
    WHERE v.id = ?
  `).get(req.params.id);
  if (!violation) return res.status(404).json({ error: '违章记录不存在' });
  res.json(violation);
});

router.post('/', (req, res) => {
  const { order_id, vehicle_id, type, description, occur_date, fine_amount } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO violations (order_id, vehicle_id, type, description, occur_date, fine_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(order_id || null, vehicle_id, type, description, occur_date, fine_amount || 0);
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/process', (req, res) => {
  const { status, fine_amount } = req.body;
  db.prepare(`
    UPDATE violations SET status = ?, fine_amount = ? WHERE id = ?
  `).run(status || 'processed', fine_amount || 0, req.params.id);
  res.json({ success: true });
});

router.put('/:id', (req, res) => {
  const { order_id, vehicle_id, type, description, occur_date, fine_amount, status } = req.body;
  db.prepare(`
    UPDATE violations 
    SET order_id = ?, vehicle_id = ?, type = ?, description = ?, occur_date = ?, fine_amount = ?, status = ?
    WHERE id = ?
  `).run(order_id || null, vehicle_id, type, description, occur_date, fine_amount || 0, status, req.params.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM violations WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
