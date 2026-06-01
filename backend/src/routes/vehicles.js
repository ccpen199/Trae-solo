const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const vehicles = db.prepare(`
    SELECT v.*, d.name as driver_name
    FROM vehicles v
    LEFT JOIN drivers d ON v.driver_id = d.id
    ORDER BY v.created_at DESC
  `).all();
  res.json(vehicles);
});

router.post('/', (req, res) => {
  const { plate_number, vehicle_type, capacity, driver_id } = req.body;
  const result = db.prepare(
    'INSERT INTO vehicles (plate_number, vehicle_type, capacity, driver_id) VALUES (?, ?, ?, ?)'
  ).run(plate_number, vehicle_type, capacity, driver_id);
  res.json({ id: result.lastInsertRowid, plate_number, vehicle_type, capacity, driver_id, status: 'available' });
});

router.put('/:id', (req, res) => {
  const { plate_number, vehicle_type, capacity, driver_id, status } = req.body;
  db.prepare(
    'UPDATE vehicles SET plate_number = ?, vehicle_type = ?, capacity = ?, driver_id = ?, status = ? WHERE id = ?'
  ).run(plate_number, vehicle_type, capacity, driver_id, status, req.params.id);
  res.json({ id: req.params.id, plate_number, vehicle_type, capacity, driver_id, status });
});

module.exports = router;
