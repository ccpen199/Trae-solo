const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { page = 1, page_size = 20, device_id } = req.query;
  const offset = (page - 1) * page_size;

  let query = `
    SELECT r.*, d.vin, d.model 
    FROM ride_records r
    JOIN devices d ON r.device_id = d.id
    WHERE r.user_id = ?
  `;
  const params = [req.user.id];

  if (device_id) {
    query += ' AND r.device_id = ?';
    params.push(device_id);
  }

  query += ' ORDER BY r.start_time DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), parseInt(offset));

  const rides = db.prepare(query).all(...params);

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM ride_records WHERE user_id = ?
  `).get(req.user.id).count;

  res.json({ rides, total, page: parseInt(page), page_size: parseInt(page_size) });
});

router.get('/:id', authenticateToken, (req, res) => {
  const ride = db.prepare(`
    SELECT r.*, d.vin, d.model 
    FROM ride_records r
    JOIN devices d ON r.device_id = d.id
    WHERE r.id = ? AND r.user_id = ?
  `).get(req.params.id, req.user.id);

  if (!ride) {
    return res.status(404).json({ error: 'Ride record not found' });
  }

  const points = db.prepare(`
    SELECT * FROM ride_points WHERE ride_id = ? ORDER BY timestamp ASC
  `).all(req.params.id);

  res.json({ ride, points });
});

router.post('/', authenticateToken, (req, res) => {
  const { device_id, start_lat, start_lng, start_time } = req.body;

  if (!device_id) {
    return res.status(400).json({ error: 'Device ID is required' });
  }

  const device = db.prepare('SELECT * FROM devices WHERE id = ? AND user_id = ?').get(device_id, req.user.id);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  const result = db.prepare(`
    INSERT INTO ride_records (device_id, user_id, start_time, start_lat, start_lng)
    VALUES (?, ?, ?, ?, ?)
  `).run(device_id, req.user.id, start_time || new Date().toISOString(), start_lat, start_lng);

  const ride = db.prepare('SELECT * FROM ride_records WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ride });
});

router.put('/:id/point', authenticateToken, (req, res) => {
  const { timestamp, lat, lng, speed, altitude, slope, battery_temp, battery_level } = req.body;

  const ride = db.prepare('SELECT * FROM ride_records WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!ride) {
    return res.status(404).json({ error: 'Ride record not found' });
  }

  db.prepare(`
    INSERT INTO ride_points (ride_id, timestamp, lat, lng, speed, altitude, slope, battery_temp, battery_level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.id, timestamp || new Date().toISOString(), lat, lng, speed, altitude, slope, battery_temp, battery_level);

  res.json({ status: 'ok' });
});

router.put('/:id/finish', authenticateToken, (req, res) => {
  const { end_time, end_lat, end_lng } = req.body;

  const ride = db.prepare('SELECT * FROM ride_records WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!ride) {
    return res.status(404).json({ error: 'Ride record not found' });
  }

  const points = db.prepare('SELECT * FROM ride_points WHERE ride_id = ? ORDER BY timestamp ASC').all(req.params.id);

  let distance = 0;
  let maxSpeed = 0;
  let totalSpeed = 0;
  let speedCount = 0;
  let elevationGain = 0;
  let prevAltitude = null;
  let maxBatteryTemp = 0;
  let totalBatteryTemp = 0;
  let tempCount = 0;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    
    if (p.speed !== null && p.speed !== undefined) {
      maxSpeed = Math.max(maxSpeed, p.speed);
      totalSpeed += p.speed;
      speedCount++;
    }

    if (prevAltitude !== null && p.altitude !== null && p.altitude > prevAltitude) {
      elevationGain += p.altitude - prevAltitude;
    }
    if (p.altitude !== null && p.altitude !== undefined) {
      prevAltitude = p.altitude;
    }

    if (p.battery_temp !== null && p.battery_temp !== undefined) {
      maxBatteryTemp = Math.max(maxBatteryTemp, p.battery_temp);
      totalBatteryTemp += p.battery_temp;
      tempCount++;
    }

    if (i > 0) {
      const prev = points[i - 1];
      const d = calculateDistance(prev.lat, prev.lng, p.lat, p.lng);
      distance += d;
    }
  }

  const duration = points.length > 1 
    ? (new Date(points[points.length - 1].timestamp) - new Date(points[0].timestamp)) / 1000 
    : 0;

  db.prepare(`
    UPDATE ride_records 
    SET end_time = ?, end_lat = ?, end_lng = ?, distance = ?, duration = ?,
        avg_speed = ?, max_speed = ?, elevation_gain = ?, avg_battery_temp = ?, max_battery_temp = ?
    WHERE id = ?
  `).run(
    end_time || new Date().toISOString(),
    end_lat || (points.length > 0 ? points[points.length - 1].lat : null),
    end_lng || (points.length > 0 ? points[points.length - 1].lng : null),
    distance,
    duration,
    speedCount > 0 ? totalSpeed / speedCount : 0,
    maxSpeed,
    elevationGain,
    tempCount > 0 ? totalBatteryTemp / tempCount : 0,
    maxBatteryTemp,
    req.params.id
  );

  const updatedRide = db.prepare('SELECT * FROM ride_records WHERE id = ?').get(req.params.id);
  res.json({ ride: updatedRide });
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
