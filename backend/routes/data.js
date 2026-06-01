const express = require('express');
const db = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  const { point_id, start_time, end_time, page = 1, pageSize = 50 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let query = `
    SELECT md.*, mp.name as point_name, mp.device_code 
    FROM monitoring_data md 
    LEFT JOIN monitoring_points mp ON md.point_id = mp.id 
    WHERE 1=1
  `;
  let countQuery = 'SELECT COUNT(*) as total FROM monitoring_data WHERE 1=1';
  const params = [];
  const countParams = [];
  
  if (point_id) {
    query += ' AND md.point_id = ?';
    countQuery += ' AND point_id = ?';
    params.push(point_id);
    countParams.push(point_id);
  }
  
  if (start_time) {
    query += ' AND md.collected_at >= ?';
    countQuery += ' AND collected_at >= ?';
    params.push(start_time);
    countParams.push(start_time);
  }
  
  if (end_time) {
    query += ' AND md.collected_at <= ?';
    countQuery += ' AND collected_at <= ?';
    params.push(end_time);
    countParams.push(end_time);
  }
  
  query += ' ORDER BY md.collected_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);
  
  const data = db.prepare(query).all(...params);
  const { total } = db.prepare(countQuery).get(...countParams);
  
  res.json({ data, total });
});

router.get('/latest', (req, res) => {
  const { point_id } = req.query;
  
  let query = `
    SELECT md.*, mp.name as point_name, mp.device_code, mp.pm25_threshold, mp.pm10_threshold, mp.noise_threshold
    FROM monitoring_data md 
    LEFT JOIN monitoring_points mp ON md.point_id = mp.id
  `;
  
  if (point_id) {
    query += ' WHERE md.point_id = ? ORDER BY md.collected_at DESC LIMIT 1';
    const data = db.prepare(query).get(point_id);
    return res.json(data || null);
  }
  
  query += `
    WHERE md.id IN (
      SELECT MAX(id) FROM monitoring_data GROUP BY point_id
    )
    ORDER BY md.collected_at DESC
  `;
  
  const data = db.prepare(query).all();
  res.json(data);
});

router.get('/trend', (req, res) => {
  const { point_id, parameter, hours = 24 } = req.query;
  
  const validParams = ['pm25', 'pm10', 'noise', 'temperature', 'humidity', 'wind_speed'];
  if (!validParams.includes(parameter)) {
    return res.status(400).json({ error: '无效的参数类型' });
  }
  
  const data = db.prepare(`
    SELECT 
      strftime('%Y-%m-%d %H:00:00', collected_at) as time_bucket,
      AVG(${parameter}) as avg_value,
      MAX(${parameter}) as max_value,
      MIN(${parameter}) as min_value
    FROM monitoring_data
    WHERE point_id = ? AND collected_at >= datetime('now', ?)
    GROUP BY time_bucket
    ORDER BY time_bucket
  `).all(point_id, `-${hours} hours`);
  
  res.json(data);
});

router.post('/', (req, res) => {
  const { point_id, pm25, pm10, noise, wind_speed, temperature, humidity } = req.body;
  
  const point = db.prepare('SELECT * FROM monitoring_points WHERE id = ?').get(point_id);
  if (!point) {
    return res.status(404).json({ error: '点位不存在' });
  }
  
  const is_anomaly = (
    (pm25 !== null && pm25 > point.pm25_threshold) ||
    (pm10 !== null && pm10 > point.pm10_threshold) ||
    (noise !== null && noise > point.noise_threshold)
  ) ? 1 : 0;
  
  const result = db.prepare(`
    INSERT INTO monitoring_data (point_id, pm25, pm10, noise, wind_speed, temperature, humidity, is_anomaly)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(point_id, pm25, pm10, noise, wind_speed, temperature, humidity, is_anomaly);
  
  if (is_anomaly) {
    let alertType = '';
    let alertParam = '';
    let alertValue = 0;
    let alertThreshold = 0;
    
    if (pm25 > point.pm25_threshold) {
      alertType = 'PM2.5超标';
      alertParam = 'pm25';
      alertValue = pm25;
      alertThreshold = point.pm25_threshold;
    } else if (pm10 > point.pm10_threshold) {
      alertType = 'PM10超标';
      alertParam = 'pm10';
      alertValue = pm10;
      alertThreshold = point.pm10_threshold;
    } else if (noise > point.noise_threshold) {
      alertType = '噪声超标';
      alertParam = 'noise';
      alertValue = noise;
      alertThreshold = point.noise_threshold;
    }
    
    db.prepare(`
      INSERT INTO alerts (point_id, alert_type, alert_level, parameter, value, threshold, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(point_id, alertType, 'warning', alertParam, alertValue, alertThreshold, 
      `${alertType}：当前值${alertValue}，阈值${alertThreshold}`);
  }
  
  db.prepare('UPDATE monitoring_points SET last_heartbeat = CURRENT_TIMESTAMP WHERE id = ?').run(point_id);
  
  res.json({ id: result.lastInsertRowid, is_anomaly, message: '数据提交成功' });
});

module.exports = router;
