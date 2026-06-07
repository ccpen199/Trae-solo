const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT d.*, u.username, u.name, u.phone, u.email, u.role, u.avatar
      FROM drivers d
      JOIN users u ON d.user_id = u.id
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`
      SELECT d.*, u.username, u.name, u.phone, u.email, u.role, u.avatar
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `).get(req.params.id);
    if (!row) {
      return res.status(404).json({ error: 'driver not found' });
    }
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { gps_lat, gps_lng, vehicle_model, vehicle_plate } = req.body;
    const existing = db.prepare('SELECT id FROM drivers WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'driver not found' });
    }
    db.prepare(`
      UPDATE drivers
      SET gps_lat = COALESCE(?, gps_lat),
          gps_lng = COALESCE(?, gps_lng),
          vehicle_model = COALESCE(?, vehicle_model),
          vehicle_plate = COALESCE(?, vehicle_plate)
      WHERE id = ?
    `).run(gps_lat, gps_lng, vehicle_model, vehicle_plate, req.params.id);
    const row = db.prepare(`
      SELECT d.*, u.username, u.name, u.phone, u.email, u.role, u.avatar
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `).get(req.params.id);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/location', (req, res) => {
  try {
    const row = db.prepare('SELECT id, gps_lat, gps_lng FROM drivers WHERE id = ?').get(req.params.id);
    if (!row) {
      return res.status(404).json({ error: 'driver not found' });
    }
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
