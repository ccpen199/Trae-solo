const express = require('express');
const router = express.Router();
const db = require('../db');

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

router.get('/', (req, res) => {
  try {
    const { status, urgency_level } = req.query;
    let sql = `SELECT rr.*, d.vehicle_plate, u.name AS driver_name, ut.name AS technician_name, t.skill_tags, t.vehicle_specialties
      FROM rescue_requests rr
      JOIN drivers d ON rr.driver_id = d.id
      JOIN users u ON d.user_id = u.id
      LEFT JOIN technicians t ON rr.assigned_technician_id = t.id
      LEFT JOIN users ut ON t.user_id = ut.id
      WHERE 1=1`;
    const params = [];
    if (status) {
      sql += ` AND rr.status = ?`;
      params.push(status);
    }
    if (urgency_level) {
      sql += ` AND rr.urgency_level = ?`;
      params.push(urgency_level);
    }
    sql += ` ORDER BY rr.created_at DESC`;
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { driver_id, gps_lat, gps_lng, vehicle_info, fault_description, urgency_level } = req.body;
    const result = db.prepare(
      `INSERT INTO rescue_requests (driver_id, gps_lat, gps_lng, vehicle_info, fault_description, urgency_level)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(driver_id, gps_lat, gps_lng, vehicle_info, fault_description, urgency_level || 'normal');
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/dispatch/recommend', (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }
    const vehicleInfo = req.query.vehicle_info || '';
    const faultDesc = req.query.fault_description || '';

    const technicians = db.prepare(
      `SELECT t.*, u.name, u.phone
       FROM technicians t
       JOIN users u ON t.user_id = u.id
       WHERE t.availability_status = 'online'`
    ).all();

    const parts = db.prepare(`SELECT id, name, compatible_vehicles, stock_quantity FROM parts WHERE stock_quantity > 0`).all();

    const ranked = technicians.map(tech => {
      const distance = haversine(lat, lng, tech.gps_lat, tech.gps_lng);
      let skillMatch = false;
      try {
        const skills = JSON.parse(tech.skill_tags || '[]');
        skillMatch = skills.some(s => faultDesc.includes(s));
      } catch (_) {}

      let vehicleMatch = false;
      try {
        const specialties = JSON.parse(tech.vehicle_specialties || '[]');
        vehicleMatch = specialties.some(v => vehicleInfo.includes(v));
      } catch (_) {}

      const availableParts = parts.filter(p => {
        try {
          const compat = JSON.parse(p.compatible_vehicles || '[]');
          return compat.some(v => vehicleInfo.includes(v));
        } catch (_) { return false; }
      });

      return {
        technician_id: tech.id,
        name: tech.name,
        phone: tech.phone,
        certification_level: tech.certification_level,
        credit_score: tech.credit_score,
        distance: Math.round(distance * 10) / 10,
        skill_match: skillMatch,
        vehicle_match: vehicleMatch,
        available_parts_count: availableParts.length,
        score: (skillMatch ? 30 : 0) + (vehicleMatch ? 25 : 0) + (tech.credit_score >= 80 ? 20 : 10) + Math.max(0, 25 - distance / 10)
      };
    });

    ranked.sort((a, b) => b.score - a.score);
    res.json(ranked);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(
      `SELECT rr.*,
        d.vehicle_plate, u1.name AS driver_name,
        u2.name AS technician_name
       FROM rescue_requests rr
       JOIN drivers d ON rr.driver_id = d.id
       JOIN users u1 ON d.user_id = u1.id
       LEFT JOIN technicians t ON rr.assigned_technician_id = t.id
       LEFT JOIN users u2 ON t.user_id = u2.id
       WHERE rr.id = ?`
    ).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/dispatch', (req, res) => {
  try {
    const { technician_id } = req.body;
    const result = db.prepare(
      `UPDATE rescue_requests SET assigned_technician_id = ?, status = 'dispatched', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(technician_id, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ updated: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/start', (req, res) => {
  try {
    const result = db.prepare(
      `UPDATE rescue_requests SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ updated: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/complete', (req, res) => {
  try {
    const result = db.prepare(
      `UPDATE rescue_requests SET status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ updated: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/cancel', (req, res) => {
  try {
    const result = db.prepare(
      `UPDATE rescue_requests SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ updated: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
