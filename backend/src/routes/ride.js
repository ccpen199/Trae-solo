
const express = require('express');
const router = express.Router();
const db = require('../models/database');

router.post('/create', function(req, res) {
  const { userId, startLocation, endLocation, city, serviceType } = req.body;
  const result = db.prepare('INSERT INTO rides (user_id, start_location, end_location, city, service_type) VALUES (?, ?, ?, ?, ?)').run(userId, startLocation, endLocation, city, serviceType || 'fast');
  res.json({ success: true, rideId: result.lastInsertRowid });
});

router.get('/list/:userId', function(req, res) {
  const rides = db.prepare('SELECT * FROM rides WHERE user_id = ? ORDER BY created_at DESC').all(req.params.userId);
  res.json({ rides: rides });
});

router.get('/:rideId', function(req, res) {
  const ride = db.prepare('SELECT * FROM rides WHERE id = ?').get(req.params.rideId);
  if (!ride) {
    return res.status(404).json({ success: false, message: 'Ride not found' });
  }
  res.json({ ride: ride });
});

module.exports = router;
