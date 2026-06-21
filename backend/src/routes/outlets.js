const express = require('express');
const router = express.Router();
const db = require('../utils/db');

router.get('/', (req, res) => {
  const { district, keyword, page = 1, pageSize = 20 } = req.query;
  
  let sql = 'SELECT * FROM service_outlets WHERE 1=1';
  const params = [];

  if (district && district !== 'all') {
    sql += ' AND district = ?';
    params.push(district);
  }

  if (keyword) {
    sql += ' AND (name LIKE ? OR address LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  sql += ' ORDER BY rating DESC';
  sql += ' LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const list = db.prepare(sql).all(...params);

  const countSql = sql.split('ORDER BY')[0].replace('SELECT *', 'SELECT COUNT(*) as count');
  const total = db.prepare(countSql).get(...params.slice(0, -2)).count;

  const result = list.map(item => ({
    ...item,
    service_types: JSON.parse(item.service_types || '[]')
  }));

  res.json({ code: 200, data: result, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const outlet = db.prepare('SELECT * FROM service_outlets WHERE id = ?').get(id);
  if (!outlet) {
    return res.status(404).json({ code: 404, message: '网点不存在' });
  }

  outlet.service_types = JSON.parse(outlet.service_types || '[]');

  const windows = db.prepare('SELECT * FROM window_resources WHERE outlet_id = ?').all(id);
  
  const today = new Date().toISOString().split('T')[0];
  const predictions = db.prepare(`
    SELECT * FROM heat_predictions 
    WHERE outlet_id = ? AND predict_date = ?
    ORDER BY time_slot
  `).all(id, today);

  res.json({
    code: 200,
    data: {
      ...outlet,
      windows,
      predictions
    }
  });
});

router.post('/nearby', (req, res) => {
  const { lng, lat, radius = 5000, serviceType } = req.body;

  const outlets = db.prepare('SELECT * FROM service_outlets').all();

  const calculateDistance = (lng1, lat1, lng2, lat2) => {
    const radLat1 = lat1 * Math.PI / 180.0;
    const radLat2 = lat2 * Math.PI / 180.0;
    const a = radLat1 - radLat2;
    const b = lng1 * Math.PI / 180.0 - lng2 * Math.PI / 180.0;
    let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
      Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
    s = s * 6378.137;
    s = Math.round(s * 10000) / 10;
    return s;
  };

  let result = outlets.map(item => {
    const distance = calculateDistance(lng, lat, item.lng, item.lat);
    return {
      ...item,
      distance,
      service_types: JSON.parse(item.service_types || '[]')
    };
  }).filter(item => item.distance <= radius);

  if (serviceType) {
    result = result.filter(item => item.service_types.includes(serviceType));
  }

  result.sort((a, b) => a.distance - b.distance);

  res.json({
    code: 200,
    data: result.slice(0, 20),
    total: result.length
  });
});

router.post('/match-service', (req, res) => {
  const { serviceItemId, date, timePreference } = req.body;

  const serviceItem = db.prepare('SELECT * FROM service_items WHERE id = ?').get(serviceItemId);
  if (!serviceItem) {
    return res.status(404).json({ code: 404, message: '服务事项不存在' });
  }

  const outlets = db.prepare('SELECT * FROM service_outlets').all();

  const timeSlots = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'];

  const predictions = db.prepare(`
    SELECT outlet_id, time_slot, predicted_count, suggested_windows
    FROM heat_predictions
    WHERE predict_date = ?
  `).all(date || new Date().toISOString().split('T')[0]);

  const predMap = {};
  predictions.forEach(p => {
    if (!predMap[p.outlet_id]) predMap[p.outlet_id] = {};
    predMap[p.outlet_id][p.time_slot] = p;
  });

  const result = outlets.map(outlet => {
    const outletPreds = predMap[outlet.id] || {};
    const slotScores = timeSlots.map(slot => {
      const pred = outletPreds[slot];
      let score = 50;
      if (pred) {
        score = 100 - Math.min(pred.predicted_count * 2, 80);
      }
      if (timePreference === 'morning' && slot.startsWith('09') || slot.startsWith('10') || slot.startsWith('11')) {
        score += 20;
      } else if (timePreference === 'afternoon' && slot.startsWith('14') || slot.startsWith('15') || slot.startsWith('16')) {
        score += 20;
      }
      return { slot, score, pred };
    });

    slotScores.sort((a, b) => b.score - a.score);

    return {
      outlet: {
        ...outlet,
        service_types: JSON.parse(outlet.service_types || '[]')
      },
      best_time_slots: slotScores.slice(0, 3),
      overall_score: Math.round(slotScores[0]?.score || 0)
    };
  }).sort((a, b) => b.overall_score - a.overall_score);

  res.json({
    code: 200,
    data: {
      service_item: serviceItem,
      recommendations: result.slice(0, 5)
    }
  });
});

router.get('/:id/wait-time', (req, res) => {
  const { id } = req.params;

  const windows = db.prepare('SELECT * FROM window_resources WHERE outlet_id = ?').all(id);
  
  const totalQueue = windows.reduce((sum, w) => sum + w.current_queue, 0);
  const avgWaitTime = Math.round(windows.reduce((sum, w) => sum + w.avg_wait_time, 0) / windows.length);
  const openWindows = windows.filter(w => w.is_open).length;

  res.json({
    code: 200,
    data: {
      outlet_id: id,
      total_queue: totalQueue,
      avg_wait_time: avgWaitTime,
      open_windows: openWindows,
      total_windows: windows.length,
      windows
    }
  });
});

router.get('/ar/navigation', (req, res) => {
  const { outletId, startLng, startLat } = req.query;

  const outlet = db.prepare('SELECT * FROM service_outlets WHERE id = ?').get(outletId);
  if (!outlet) {
    return res.status(404).json({ code: 404, message: '网点不存在' });
  }

  const waypoints = [
    { type: 'start', name: '当前位置', lng: parseFloat(startLng), lat: parseFloat(startLat) },
    { type: 'turn', name: '前方路口左转', lng: parseFloat(startLng) + 0.002, lat: parseFloat(startLat) + 0.003 },
    { type: 'turn', name: '直行500米', lng: outlet.lng - 0.002, lat: outlet.lat + 0.001 },
    { type: 'poi', name: '标志性建筑：重庆银行', lng: outlet.lng - 0.001, lat: outlet.lat },
    { type: 'end', name: outlet.name, lng: outlet.lng, lat: outlet.lat },
  ];

  const distance = Math.round(Math.random() * 2000 + 500);
  const duration = Math.round(distance / 80);

  res.json({
    code: 200,
    data: {
      outlet: {
        id: outlet.id,
        name: outlet.name,
        address: outlet.address
      },
      distance,
      duration,
      waypoints,
      ar_overlay: {
        arrow_direction: 'forward',
        distance_to_next: 200,
        street_name: '人民路'
      }
    }
  });
});

module.exports = router;
