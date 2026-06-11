const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/fences', authenticateToken, (req, res) => {
  const { type, city } = req.query;
  
  let query = 'SELECT * FROM geo_fences WHERE 1=1';
  const params = [];

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  if (city) {
    query += ' AND city = ?';
    params.push(city);
  }

  query += ' ORDER BY created_at DESC';
  const fences = db.prepare(query).all(...params);

  res.json({ fences });
});

router.post('/fences', authenticateToken, requireAdmin, (req, res) => {
  const { name, type, geom_type, coordinates, speed_limit, city, description } = req.body;

  if (!name || !type || !coordinates) {
    return res.status(400).json({ error: 'Name, type and coordinates are required' });
  }

  const result = db.prepare(`
    INSERT INTO geo_fences (name, type, geom_type, coordinates, speed_limit, city, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, type, geom_type || 'polygon', JSON.stringify(coordinates), speed_limit || null, city || null, description || null);

  const fence = db.prepare('SELECT * FROM geo_fences WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ fence });
});

router.get('/fences/:id', authenticateToken, (req, res) => {
  const fence = db.prepare('SELECT * FROM geo_fences WHERE id = ?').get(req.params.id);
  if (!fence) {
    return res.status(404).json({ error: 'Fence not found' });
  }
  fence.coordinates = JSON.parse(fence.coordinates);
  res.json({ fence });
});

router.delete('/fences/:id', authenticateToken, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM geo_fences WHERE id = ?').run(req.params.id);
  res.json({ status: 'ok' });
});

router.get('/parking', authenticateToken, (req, res) => {
  const { city, lat, lng } = req.query;
  
  let query = 'SELECT * FROM parking_spots WHERE 1=1';
  const params = [];

  if (city) {
    query += ' AND city = ?';
    params.push(city);
  }

  const spots = db.prepare(query).all(...params);

  if (lat && lng) {
    spots.forEach(spot => {
      spot.distance = calculateDistance(parseFloat(lat), parseFloat(lng), spot.lat, spot.lng);
    });
    spots.sort((a, b) => a.distance - b.distance);
  }

  res.json({ spots });
});

router.post('/parking', authenticateToken, requireAdmin, (req, res) => {
  const { name, lat, lng, capacity, address, city } = req.body;

  if (!name || !lat || !lng) {
    return res.status(400).json({ error: 'Name, lat and lng are required' });
  }

  const result = db.prepare(`
    INSERT INTO parking_spots (name, lat, lng, capacity, available, address, city)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, lat, lng, capacity || 10, capacity || 10, address || null, city || null);

  const spot = db.prepare('SELECT * FROM parking_spots WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ spot });
});

router.post('/parking/:id/checkin', authenticateToken, (req, res) => {
  const spot = db.prepare('SELECT * FROM parking_spots WHERE id = ?').get(req.params.id);
  if (!spot) {
    return res.status(404).json({ error: 'Parking spot not found' });
  }

  if (spot.available <= 0) {
    return res.status(400).json({ error: 'Parking spot is full' });
  }

  db.prepare('UPDATE parking_spots SET available = available - 1 WHERE id = ?').run(req.params.id);

  res.json({ status: 'ok', message: 'Check-in successful' });
});

router.post('/parking/:id/checkout', authenticateToken, (req, res) => {
  const spot = db.prepare('SELECT * FROM parking_spots WHERE id = ?').get(req.params.id);
  if (!spot) {
    return res.status(404).json({ error: 'Parking spot not found' });
  }

  if (spot.available >= spot.capacity) {
    return res.status(400).json({ error: 'Parking spot is already full' });
  }

  db.prepare('UPDATE parking_spots SET available = available + 1 WHERE id = ?').run(req.params.id);

  res.json({ status: 'ok', message: 'Check-out successful' });
});

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

module.exports = router;
