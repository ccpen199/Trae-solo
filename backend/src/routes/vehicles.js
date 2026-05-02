const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT v.*, 
             l.lock_code, l.status as lock_status,
             o.order_no, o.status as order_status,
             o.user_id as rider_id, u.name as rider_name
      FROM vehicles v
      LEFT JOIN locks l ON v.lock_id = l.id
      LEFT JOIN orders o ON v.id = o.vehicle_id AND o.status IN ('riding', 'pending_ride', 'pending_scan')
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND v.status = ?';
      params.push(status);
    }

    query += ' ORDER BY v.updated_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const vehicles = db.prepare(query).all(...params);
    res.json(vehicles);
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ error: '获取车辆列表失败' });
  }
});

router.get('/available', (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const vehicles = db.prepare(`
      SELECT v.*, l.lock_code 
      FROM vehicles v
      JOIN locks l ON v.lock_id = l.id
      WHERE v.status = 'available' AND l.status = 'locked'
      ORDER BY v.battery_level DESC
      LIMIT ?
    `).all(parseInt(limit));

    res.json(vehicles);
  } catch (error) {
    console.error('Get available vehicles error:', error);
    res.status(500).json({ error: '获取可用车辆失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = db.prepare(`
      SELECT v.*, 
             l.lock_code, l.status as lock_status,
             o.order_no, o.status as order_status,
             u.name as rider_name
      FROM vehicles v
      LEFT JOIN locks l ON v.lock_id = l.id
      LEFT JOIN orders o ON v.id = o.vehicle_id AND o.status IN ('riding', 'pending_ride', 'pending_scan')
      LEFT JOIN users u ON o.user_id = u.id
      WHERE v.id = ?
    `).get(id);

    if (!vehicle) {
      return res.status(404).json({ error: '车辆不存在' });
    }

    res.json(vehicle);
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ error: '获取车辆信息失败' });
  }
});

router.post('/', requireRole('admin', 'dispatcher'), (req, res) => {
  try {
    const { bike_code, location_lat, location_lng, battery_level } = req.body;

    if (!bike_code) {
      return res.status(400).json({ error: '车辆编号不能为空' });
    }

    const generateId = require('../utils/helpers').generateId;
    const vehicleId = generateId();
    const lockId = generateId();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO locks (id, lock_code, status, created_at, updated_at)
      VALUES (?, ?, 'locked', ?, ?)
    `).run(lockId, 'LK' + bike_code.slice(-5), now, now);

    db.prepare(`
      INSERT INTO vehicles (id, bike_code, status, location_lat, location_lng, battery_level, lock_id, created_at, updated_at)
      VALUES (?, ?, 'available', ?, ?, ?, ?, ?, ?)
    `).run(vehicleId, bike_code, location_lat || 39.9042, location_lng || 116.4074, battery_level || 100, lockId, now, now);

    res.json({ vehicleId, bike_code });
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({ error: '创建车辆失败' });
  }
});

module.exports = router;
