const express = require('express');
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

router.get('/meters', (req, res) => {
  const meters = db.prepare(`
    SELECT em.*, r.name as room_name, d.name as device_name
    FROM energy_meters em
    LEFT JOIN rooms r ON em.room_id = r.id
    LEFT JOIN devices d ON em.device_id = d.id
  `).all();
  
  res.json({ success: true, data: meters });
});

router.post('/meters', (req, res) => {
  const { roomId, deviceId } = req.body;
  const id = `em-${uuidv4().slice(0, 8)}`;
  const now = Date.now();
  
  db.prepare(`
    INSERT INTO energy_meters (id, room_id, device_id, total_consumption, last_reading_time, created_at)
    VALUES (?, ?, ?, 0, ?, ?)
  `).run(id, roomId || null, deviceId || null, now, now);
  
  res.json({ success: true, data: { id } });
});

router.post('/meters/:id/record', (req, res) => {
  const { consumption } = req.body;
  const now = Date.now();
  
  db.prepare('BEGIN').run();
  
  try {
    db.prepare('INSERT INTO energy_records (meter_id, consumption, timestamp) VALUES (?, ?, ?)')
      .run(req.params.id, consumption, now);
    
    db.prepare(`
      UPDATE energy_meters 
      SET total_consumption = total_consumption + ?, last_reading = ?, last_reading_time = ?
      WHERE id = ?
    `).run(consumption, consumption, now, req.params.id);
    
    db.prepare('COMMIT').run();
    res.json({ success: true });
  } catch (e) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/records', (req, res) => {
  const { meterId, startDate, endDate, groupBy = 'hour' } = req.query;
  
  let query = `
    SELECT er.*, em.room_id, em.device_id, r.name as room_name
    FROM energy_records er
    LEFT JOIN energy_meters em ON er.meter_id = em.id
    LEFT JOIN rooms r ON em.room_id = r.id
    WHERE 1=1
  `;
  const params = [];
  
  if (meterId) {
    query += ' AND er.meter_id = ?';
    params.push(meterId);
  }
  if (startDate) {
    query += ' AND er.timestamp >= ?';
    params.push(parseInt(startDate));
  }
  if (endDate) {
    query += ' AND er.timestamp <= ?';
    params.push(parseInt(endDate));
  }
  
  query += ' ORDER BY er.timestamp DESC LIMIT 1000';
  
  const records = db.prepare(query).all(...params);
  
  const aggregated = aggregateByTime(records, groupBy);
  
  res.json({ success: true, data: { records, aggregated } });
});

function aggregateByTime(records, groupBy) {
  const groups = {};
  
  records.forEach(r => {
    const date = new Date(r.timestamp);
    let key;
    
    switch (groupBy) {
      case 'hour':
        key = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} ${date.getHours()}:00`;
        break;
      case 'day':
        key = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
        break;
      case 'month':
        key = `${date.getFullYear()}-${date.getMonth()+1}`;
        break;
      default:
        key = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} ${date.getHours()}:00`;
    }
    
    if (!groups[key]) {
      groups[key] = { time: key, total: 0, count: 0 };
    }
    groups[key].total += r.consumption;
    groups[key].count++;
  });
  
  return Object.values(groups).sort((a, b) => a.time.localeCompare(b.time));
}

router.get('/trends', (req, res) => {
  const { days = 7 } = req.query;
  const now = Date.now();
  const start = now - parseInt(days) * 24 * 60 * 60 * 1000;
  
  const records = db.prepare(`
    SELECT er.*, r.name as room_name
    FROM energy_records er
    LEFT JOIN energy_meters em ON er.meter_id = em.id
    LEFT JOIN rooms r ON em.room_id = r.id
    WHERE er.timestamp >= ?
    ORDER BY er.timestamp ASC
  `).all(start);
  
  const dailyData = {};
  const roomData = {};
  
  records.forEach(r => {
    const date = new Date(r.timestamp).toLocaleDateString();
    
    if (!dailyData[date]) dailyData[date] = 0;
    dailyData[date] += r.consumption;
    
    if (r.room_name) {
      if (!roomData[r.room_name]) roomData[r.room_name] = 0;
      roomData[r.room_name] += r.consumption;
    }
  });
  
  const totalConsumption = records.reduce((sum, r) => sum + r.consumption, 0);
  const avgDaily = totalConsumption / parseInt(days);
  
  res.json({ 
    success: true, 
    data: {
      dailyTrend: Object.entries(dailyData).map(([date, value]) => ({ date, value })),
      byRoom: Object.entries(roomData).map(([room, value]) => ({ room, value })),
      totalConsumption,
      avgDaily,
      periodDays: parseInt(days)
    } 
  });
});

router.get('/overview', (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.getTime();
  
  const todayUsage = db.prepare(`
    SELECT COALESCE(SUM(consumption), 0) as total
    FROM energy_records
    WHERE timestamp >= ?
  `).get(todayStart).total;
  
  const monthUsage = db.prepare(`
    SELECT COALESCE(SUM(consumption), 0) as total
    FROM energy_records
    WHERE timestamp >= ?
  `).get(todayStart - 30 * 24 * 60 * 60 * 1000).total;
  
  const totalUsage = db.prepare(`
    SELECT COALESCE(SUM(total_consumption), 0) as total
    FROM energy_meters
  `).get().total;
  
  const meters = db.prepare('SELECT COUNT(*) as count FROM energy_meters').get().count;
  
  res.json({
    success: true,
    data: {
      todayUsage: Math.round(todayUsage * 100) / 100,
      monthUsage: Math.round(monthUsage * 100) / 100,
      totalUsage: Math.round(totalUsage * 100) / 100,
      activeMeters: meters,
      estimatedCost: Math.round(monthUsage * 0.56 * 100) / 100
    }
  });
});

module.exports = router;
