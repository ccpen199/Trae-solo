const express = require('express');
const db = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  const { status, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let query = 'SELECT * FROM monitoring_points';
  let countQuery = 'SELECT COUNT(*) as total FROM monitoring_points';
  const params = [];
  
  if (status) {
    query += ' WHERE status = ?';
    countQuery += ' WHERE status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);
  
  const points = db.prepare(query).all(...params);
  const { total } = db.prepare(countQuery).get(...params.slice(0, params.length - 2));
  
  const now = new Date();
  const pointsWithStatus = points.map(p => {
    const heartbeat = p.last_heartbeat ? new Date(p.last_heartbeat) : null;
    const calibration = p.calibration_expiry ? new Date(p.calibration_expiry) : null;
    
    let deviceStatus = p.status;
    let warnings = [];
    
    if (heartbeat && (now - heartbeat) > 30 * 60 * 1000) {
      deviceStatus = 'offline';
      warnings.push('设备离线超过30分钟');
    }
    
    if (calibration && calibration < now) {
      warnings.push('设备校准已过期');
    }
    
    return { ...p, deviceStatus, warnings };
  });
  
  res.json({ data: pointsWithStatus, total });
});

router.get('/:id', (req, res) => {
  const point = db.prepare('SELECT * FROM monitoring_points WHERE id = ?').get(req.params.id);
  if (!point) {
    return res.status(404).json({ error: '点位不存在' });
  }
  res.json(point);
});

router.post('/', (req, res) => {
  const { name, device_code, location, pm25_threshold, pm10_threshold, noise_threshold, construction_stage, responsible_unit } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO monitoring_points (name, device_code, location, pm25_threshold, pm10_threshold, noise_threshold, construction_stage, responsible_unit)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, device_code, location, pm25_threshold || 35, pm10_threshold || 70, noise_threshold || 70, construction_stage, responsible_unit);
    
    res.json({ id: result.lastInsertRowid, message: '创建成功' });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: '设备编号已存在' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { name, device_code, location, pm25_threshold, pm10_threshold, noise_threshold, construction_stage, responsible_unit, status } = req.body;
  
  const result = db.prepare(`
    UPDATE monitoring_points 
    SET name = ?, device_code = ?, location = ?, pm25_threshold = ?, pm10_threshold = ?, noise_threshold = ?, 
        construction_stage = ?, responsible_unit = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, device_code, location, pm25_threshold, pm10_threshold, noise_threshold, construction_stage, responsible_unit, status, req.params.id);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: '点位不存在' });
  }
  
  res.json({ message: '更新成功' });
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM monitoring_points WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: '点位不存在' });
  }
  res.json({ message: '删除成功' });
});

router.post('/:id/heartbeat', (req, res) => {
  db.prepare('UPDATE monitoring_points SET last_heartbeat = CURRENT_TIMESTAMP, status = ? WHERE id = ?')
    .run('online', req.params.id);
  res.json({ message: '心跳更新成功' });
});

module.exports = router;
