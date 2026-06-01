const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../models/db');
const { authenticateToken } = require('../middleware/auth');
const { trackParcels, trackParcel, detectCourier, generateTrackingEvents } = require('../utils/tracking');
const { calculateBlockHash } = require('../utils/hash');

const router = express.Router();

router.get('/track', (req, res) => {
  try {
    const { numbers } = req.query;
    
    if (!numbers) {
      return res.status(400).json({ error: '请提供运单号' });
    }

    const trackingNumbers = numbers.split(',').filter(n => n.trim());
    
    if (trackingNumbers.length === 0) {
      return res.status(400).json({ error: '运单号不能为空' });
    }

    if (trackingNumbers.length > 20) {
      return res.status(400).json({ error: '最多支持20个运单号同时查询' });
    }

    const results = trackParcels(trackingNumbers);
    
    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (err) {
    console.error('查询错误:', err);
    res.status(500).json({ error: '查询失败' });
  }
});

router.get('/', authenticateToken, (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM parcels WHERE user_id = ?';
    const params = [req.user.id];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const parcels = db.prepare(query).all(...params);

    const countQuery = 'SELECT COUNT(*) as total FROM parcels WHERE user_id = ?';
    const countParams = [req.user.id];
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    const { total } = db.prepare(countQuery).get(...countParams);

    res.json({
      success: true,
      data: parcels,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('获取包裹列表错误:', err);
    res.status(500).json({ error: '获取包裹列表失败' });
  }
});

router.post('/', authenticateToken, (req, res) => {
  try {
    const { tracking_number, sender, receiver, receiver_phone, weight, volume } = req.body;

    if (!tracking_number) {
      return res.status(400).json({ error: '运单号不能为空' });
    }

    const courier = detectCourier(tracking_number);
    const trackingData = trackParcel(tracking_number);

    const result = db.prepare(`
      INSERT INTO parcels (tracking_number, courier, sender, receiver, receiver_phone, status, weight, volume, estimated_delivery, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tracking_number,
      courier,
      sender,
      receiver,
      receiver_phone,
      trackingData.status === '已签收' ? 'delivered' : 'transit',
      weight,
      volume,
      trackingData.estimated_delivery,
      req.user.id
    );

    const parcelId = result.lastInsertRowid;

    let previousHash = null;
    for (const event of trackingData.events) {
      const hash = calculateBlockHash(parcelId, event.event_type, event.location, event.timestamp, previousHash);
      db.prepare(`
        INSERT INTO parcel_events (parcel_id, event_type, location, description, operator, timestamp, hash, previous_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(parcelId, event.event_type, event.location, event.description, event.operator, event.timestamp, hash, previousHash);
      previousHash = hash;
    }

    const parcel = db.prepare('SELECT * FROM parcels WHERE id = ?').get(parcelId);

    res.status(201).json({
      success: true,
      message: '包裹添加成功',
      data: {
        ...parcel,
        events: trackingData.events
      }
    });
  } catch (err) {
    console.error('添加包裹错误:', err);
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: '该运单号已存在' });
    }
    res.status(500).json({ error: '添加包裹失败' });
  }
});

router.get('/family', authenticateToken, (req, res) => {
  try {
    const familyParcels = db.prepare(`
      SELECT p.*, u.username as owner_name
      FROM parcels p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE u.id IN (
        SELECT id FROM users WHERE id = ?
      )
      ORDER BY p.updated_at DESC
    `).all(req.user.id);

    const familyMembers = [
      { id: req.user.id, name: req.user.username, relation: '本人' }
    ];

    res.json({
      success: true,
      data: {
        family_members: familyMembers,
        parcels: familyParcels,
        summary: {
          total: familyParcels.length,
          in_transit: familyParcels.filter(p => p.status === 'transit').length,
          delivered: familyParcels.filter(p => p.status === 'delivered').length,
          exception: familyParcels.filter(p => p.status === 'exception').length
        }
      }
    });
  } catch (err) {
    console.error('获取亲友包裹错误:', err);
    res.status(500).json({ error: '获取亲友包裹失败' });
  }
});

router.get('/anomalies', authenticateToken, (req, res) => {
  try {
    const anomalies = db.prepare(`
      SELECT a.*, p.tracking_number, p.courier, p.receiver
      FROM anomalies a
      JOIN parcels p ON a.parcel_id = p.id
      WHERE p.user_id = ?
      ORDER BY a.detected_at DESC
    `).all(req.user.id);

    res.json({
      success: true,
      count: anomalies.length,
      data: anomalies
    });
  } catch (err) {
    console.error('获取异常件错误:', err);
    res.status(500).json({ error: '获取异常件失败' });
  }
});

router.post('/:id/trigger-query', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    const parcel = db.prepare('SELECT * FROM parcels WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!parcel) {
      return res.status(404).json({ error: '包裹不存在' });
    }

    const trackingData = trackParcel(parcel.tracking_number);

    db.prepare('UPDATE parcels SET status = ?, updated_at = ? WHERE id = ?').run(
      trackingData.status === '已签收' ? 'delivered' : 'transit',
      new Date().toISOString(),
      id
    );

    const lastEvent = db.prepare('SELECT hash FROM parcel_events WHERE parcel_id = ? ORDER BY id DESC LIMIT 1').get(id);
    let previousHash = lastEvent ? lastEvent.hash : null;

    const newEvents = trackingData.events.slice(-2);
    for (const event of newEvents) {
      const hash = calculateBlockHash(id, event.event_type, event.location, event.timestamp, previousHash);
      db.prepare(`
        INSERT OR IGNORE INTO parcel_events (parcel_id, event_type, location, description, operator, timestamp, hash, previous_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, event.event_type, event.location, event.description, event.operator, event.timestamp, hash, previousHash);
      previousHash = hash;
    }

    const updatedParcel = db.prepare('SELECT * FROM parcels WHERE id = ?').get(id);
    const events = db.prepare('SELECT * FROM parcel_events WHERE parcel_id = ? ORDER BY timestamp DESC').all(id);

    res.json({
      success: true,
      message: '物流信息已更新',
      data: {
        parcel: updatedParcel,
        events
      }
    });
  } catch (err) {
    console.error('触发查询错误:', err);
    res.status(500).json({ error: '触发查询失败' });
  }
});

router.get('/:id/trace', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    const parcel = db.prepare('SELECT * FROM parcels WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!parcel) {
      return res.status(404).json({ error: '包裹不存在' });
    }

    const events = db.prepare('SELECT * FROM parcel_events WHERE parcel_id = ? ORDER BY id ASC').all(id);

    let isValid = true;
    let previousHash = null;
    for (const event of events) {
      const calculatedHash = calculateBlockHash(event.parcel_id, event.event_type, event.location, event.timestamp, previousHash);
      if (event.hash !== calculatedHash) {
        isValid = false;
        break;
      }
      previousHash = event.hash;
    }

    res.json({
      success: true,
      data: {
        parcel,
        trace_chain: events,
        verification: {
          valid: isValid,
          verified_at: new Date().toISOString()
        }
      }
    });
  } catch (err) {
    console.error('溯源查询错误:', err);
    res.status(500).json({ error: '溯源查询失败' });
  }
});

module.exports = router;
