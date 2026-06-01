const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const drivers = db.prepare(`
    SELECT d.*, v.plate_number, v.vehicle_type, v.capacity
    FROM drivers d
    LEFT JOIN vehicles v ON d.id = v.driver_id
    ORDER BY d.created_at DESC
  `).all();
  res.json(drivers);
});

router.get('/available', (req, res) => {
  const drivers = db.prepare(`
    SELECT d.*, v.plate_number, v.vehicle_type, v.capacity
    FROM drivers d
    LEFT JOIN vehicles v ON d.id = v.driver_id
    WHERE d.status = 'available' AND v.status = 'available'
    ORDER BY d.created_at DESC
  `).all();
  res.json(drivers);
});

router.post('/', (req, res) => {
  const { name, phone, license_number, qualifications } = req.body;
  const result = db.prepare(
    'INSERT INTO drivers (name, phone, license_number, qualifications) VALUES (?, ?, ?, ?)'
  ).run(name, phone, license_number, qualifications);
  res.json({ id: result.lastInsertRowid, name, phone, license_number, qualifications, status: 'available' });
});

router.put('/:id', (req, res) => {
  const { name, phone, license_number, qualifications, status } = req.body;
  db.prepare(
    'UPDATE drivers SET name = ?, phone = ?, license_number = ?, qualifications = ?, status = ? WHERE id = ?'
  ).run(name, phone, license_number, qualifications, status, req.params.id);
  res.json({ id: req.params.id, name, phone, license_number, qualifications, status });
});

module.exports = router;
