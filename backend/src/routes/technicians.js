const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/nearby', (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    if (!lat || !lng || !radius) {
      return res.status(400).json({ error: 'lat, lng, and radius query params are required' });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);
    const rows = db.prepare(`
      SELECT t.*, u.name, u.username, u.phone,
             (6371 * acos(
               CASE
                 WHEN abs(sin(radians(?)) * sin(radians(t.gps_lat)) + cos(radians(?)) * cos(radians(t.gps_lat)) * cos(radians(?) - radians(t.gps_lng))) > 1 THEN 1
                 WHEN sin(radians(?)) * sin(radians(t.gps_lat)) + cos(radians(?)) * cos(radians(t.gps_lat)) * cos(radians(?) - radians(t.gps_lng)) < -1 THEN -1
                 ELSE sin(radians(?)) * sin(radians(t.gps_lat)) + cos(radians(?)) * cos(radians(t.gps_lat)) * cos(radians(?) - radians(t.gps_lng))
               END
             )) AS distance
      FROM technicians t
      JOIN users u ON t.user_id = u.id
      WHERE t.gps_lat IS NOT NULL AND t.gps_lng IS NOT NULL
    `).all(latitude, latitude, longitude, latitude, latitude, longitude, latitude, latitude, longitude);
    const filtered = rows.filter(r => r.distance <= radiusKm).map(r => {
      const { distance, ...rest } = r;
      return { ...rest, distance: Math.round(distance * 100) / 100 };
    });
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', (req, res) => {
  try {
    const { skill_tag, vehicle_specialty, availability_status } = req.query;
    let sql = `
      SELECT t.*, u.username, u.name, u.phone, u.email, u.role, u.avatar
      FROM technicians t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (availability_status) {
      sql += ' AND t.availability_status = ?';
      params.push(availability_status);
    }
    if (skill_tag) {
      sql += ' AND t.skill_tags LIKE ?';
      params.push(`%"${skill_tag}"%`);
    }
    if (vehicle_specialty) {
      sql += ' AND t.vehicle_specialties LIKE ?';
      params.push(`%"${vehicle_specialty}"%`);
    }
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`
      SELECT t.*, u.username, u.name, u.phone, u.email, u.role, u.avatar
      FROM technicians t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `).get(req.params.id);
    if (!row) {
      return res.status(404).json({ error: 'technician not found' });
    }
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM technicians WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'technician not found' });
    }
    const fields = [];
    const params = [];
    const allowed = ['certification_level', 'skill_tags', 'vehicle_specialties', 'credit_score', 'gps_lat', 'gps_lng', 'availability_status'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(req.body[key]);
      }
    }
    if (fields.length === 0) {
      return res.status(400).json({ error: 'no valid fields to update' });
    }
    params.push(req.params.id);
    db.prepare(`UPDATE technicians SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    const row = db.prepare(`
      SELECT t.*, u.username, u.name, u.phone, u.email, u.role, u.avatar
      FROM technicians t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `).get(req.params.id);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/credit-history', (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM technicians WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'technician not found' });
    }
    const rows = db.prepare('SELECT * FROM credit_history WHERE technician_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/availability', (req, res) => {
  try {
    const { availability_status } = req.body;
    if (!availability_status) {
      return res.status(400).json({ error: 'availability_status is required' });
    }
    const existing = db.prepare('SELECT id FROM technicians WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'technician not found' });
    }
    db.prepare('UPDATE technicians SET availability_status = ? WHERE id = ?').run(availability_status, req.params.id);
    const row = db.prepare(`
      SELECT t.*, u.username, u.name, u.phone, u.email, u.role, u.avatar
      FROM technicians t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `).get(req.params.id);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
