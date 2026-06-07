const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  try {
    const { code, vehicle_model, severity, search } = req.query;
    let sql = `SELECT * FROM fault_codes WHERE 1=1`;
    const params = [];
    if (code) {
      sql += ` AND code = ?`;
      params.push(code);
    }
    if (vehicle_model) {
      sql += ` AND vehicle_model = ?`;
      params.push(vehicle_model);
    }
    if (severity) {
      sql += ` AND severity = ?`;
      params.push(severity);
    }
    if (search) {
      sql += ` AND (code LIKE ? OR description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ` ORDER BY created_at DESC`;
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { code, description, vehicle_model, severity, solution } = req.body;
    const result = db.prepare(
      `INSERT INTO fault_codes (code, description, vehicle_model, severity, solution) VALUES (?, ?, ?, ?, ?)`
    ).run(code, description, vehicle_model, severity || 'medium', solution);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM fault_codes WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { code, description, vehicle_model, severity, solution } = req.body;
    const result = db.prepare(
      `UPDATE fault_codes SET code = COALESCE(?, code), description = COALESCE(?, description), vehicle_model = COALESCE(?, vehicle_model), severity = COALESCE(?, severity), solution = COALESCE(?, solution) WHERE id = ?`
    ).run(code, description, vehicle_model, severity, solution, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ updated: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
