const express = require('express');
const router = express.Router();
const db = require('../utils/db');

function calcSuggestedWindows(currentQueue, openWindows, totalWindows) {
  const base = Math.max(openWindows, Math.ceil(currentQueue / 8));
  return Math.max(1, Math.min(base, totalWindows));
}

function calcLoadLevel(currentQueue, openWindows) {
  if (currentQueue > openWindows * 15) return 'high';
  if (currentQueue > openWindows * 8) return 'medium';
  return 'low';
}

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
    const windows = db.prepare('SELECT * FROM window_resources WHERE outlet_id = ?').all(item.id);
    const totalQueue = windows.reduce((sum, w) => sum + w.current_queue, 0);
    const openWins = windows.filter(w => w.is_open).length;
    const avgWait = windows.length > 0 ? Math.round(windows.reduce((sum, w) => sum + w.avg_wait_time, 0) / windows.length) : 15;
    return {
      ...item,
      distance,
      service_types: JSON.parse(item.service_types || '[]'),
      total_queue: totalQueue,
      open_windows: openWins,
      avg_wait: avgWait,
      total_windows: windows.length,
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
  const { serviceItemId, date, timePreference, lng, lat } = req.body;

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

  const targetDate = date || new Date().toISOString().split('T')[0];
  const apptMap = {};
  const appts = db.prepare(`
    SELECT outlet_id, appointment_time, COUNT(*) as cnt
    FROM appointments
    WHERE appointment_date = ?
    GROUP BY outlet_id, appointment_time
  `).all(targetDate);
  appts.forEach(a => {
    const key = `${a.outlet_id}_${a.appointment_time}`;
    apptMap[key] = a.cnt;
  });

  const result = outlets.map(outlet => {
    const windows = db.prepare('SELECT * FROM window_resources WHERE outlet_id = ?').all(outlet.id);
    const totalQueue = windows.reduce((sum, w) => sum + w.current_queue, 0);
    const openWins = windows.filter(w => w.is_open).length;
    const avgWait = windows.length > 0 ? Math.round(windows.reduce((sum, w) => sum + w.avg_wait_time, 0) / windows.length) : 15;

    const outletPreds = predMap[outlet.id] || {};
    const slotScores = timeSlots.map(slot => {
      const pred = outletPreds[slot];
      let score = 50;
      if (pred) {
        score = 100 - Math.min(Math.round(pred.predicted_count * 1.5), 80);
      }
      if (timePreference === 'morning' && (slot.startsWith('09') || slot.startsWith('10') || slot.startsWith('11'))) {
        score += 20;
      } else if (timePreference === 'afternoon' && (slot.startsWith('14') || slot.startsWith('15') || slot.startsWith('16'))) {
        score += 20;
      }
      return { slot, score, pred, queue: totalQueue };
    });

    slotScores.sort((a, b) => b.score - a.score);

    const bestSlot = slotScores[0];

    let distance = 0;
    if (lng && lat) {
      const radLat1 = lat * Math.PI / 180.0;
      const radLat2 = outlet.lat * Math.PI / 180.0;
      const a = radLat1 - radLat2;
      const b2 = lng * Math.PI / 180.0 - outlet.lng * Math.PI / 180.0;
      let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
        Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b2 / 2), 2)));
      distance = Math.round(s * 6378.137 * 10000) / 10;
    }

    return {
      outlet_id: outlet.id,
      outlet_name: outlet.name,
      outlet_district: outlet.district,
      outlet_address: outlet.address,
      distance,
      total_queue: totalQueue,
      open_windows: openWins,
      total_windows: windows.length,
      avg_wait: avgWait,
      best_slot: bestSlot?.slot || '10:00-11:00',
      best_score: bestSlot?.score || 50,
      score: Math.round(bestSlot?.score || 0),
      predicted_count: bestSlot?.pred?.predicted_count || 0,
      time_slots: slotScores.slice(0, 3),
      overall_score: Math.round(bestSlot?.score || 0),
      service_types: JSON.parse(outlet.service_types || '[]'),
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

router.get('/ar/navigation', (req, res) => {
  const { outletId, startLng, startLat } = req.query;

  const outlet = db.prepare('SELECT * FROM service_outlets WHERE id = ?').get(outletId);
  if (!outlet) {
    return res.status(404).json({ code: 404, message: '网点不存在' });
  }

  const windows = db.prepare('SELECT * FROM window_resources WHERE outlet_id = ?').all(outlet.id);
  const totalQueue = windows.reduce((sum, w) => sum + w.current_queue, 0);
  const openWins = windows.filter(w => w.is_open).length;

  const sLng = parseFloat(startLng) || 106.5516;
  const sLat = parseFloat(startLat) || 29.5628;

  const waypoints = [
    { type: 'start', name: '当前位置', lng: sLng, lat: sLat, instruction: '出发' },
    { type: 'turn', name: '前方路口右转', lng: sLng + 0.003, lat: sLat + 0.002, instruction: '沿和平路向东步行约200米，右转进入民族路' },
    { type: 'straight', name: '直行400米', lng: (sLng + outlet.lng) / 2, lat: (sLat + outlet.lat) / 2, instruction: '沿民族路直行约400米' },
    { type: 'turn', name: '左转进入政务路', lng: outlet.lng - 0.001, lat: outlet.lat + 0.001, instruction: '左转进入政务路，步行约150米' },
    { type: 'poi', name: '标志性建筑：重庆银行', lng: outlet.lng - 0.0005, lat: outlet.lat, instruction: '经过重庆银行，继续前行约100米' },
    { type: 'end', name: outlet.name, lng: outlet.lng, lat: outlet.lat, instruction: `到达${outlet.name}，当前${openWins}窗开放，排队${totalQueue}人` },
  ];

  const dLng = outlet.lng - sLng;
  const dLat = outlet.lat - sLat;
  const distance = Math.round(Math.sqrt(dLng * dLng + dLat * dLat) * 111000 * 1000) / 1000;
  const duration = Math.round(distance / 80);

  res.json({
    code: 200,
    data: {
      outlet: {
        id: outlet.id,
        name: outlet.name,
        address: outlet.address,
        open_windows: openWins,
        current_queue: totalQueue,
        avg_wait: windows.length > 0 ? Math.round(windows.reduce((sum, w) => sum + w.avg_wait_time, 0) / windows.length) : 15,
      },
      distance,
      duration,
      waypoints,
      ar_overlay: {
        arrow_direction: 'forward',
        distance_to_next: 200,
        street_name: '人民路',
        steps: waypoints.map(w => ({ name: w.name, instruction: w.instruction, type: w.type }))
      }
    }
  });
});

router.get('/:id/wait-time', (req, res) => {
  const { id } = req.params;

  const windows = db.prepare('SELECT * FROM window_resources WHERE outlet_id = ?').all(id);

  const totalQueue = windows.reduce((sum, w) => sum + w.current_queue, 0);
  const avgWaitTime = windows.length > 0 ? Math.round(windows.reduce((sum, w) => sum + w.avg_wait_time, 0) / windows.length) : 15;
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

router.get('/:id', (req, res) => {
  const { id } = req.params;

  const outlet = db.prepare('SELECT * FROM service_outlets WHERE id = ?').get(id);
  if (!outlet) {
    return res.status(404).json({ code: 404, message: '网点不存在' });
  }

  outlet.service_types = JSON.parse(outlet.service_types || '[]');

  const windows = db.prepare('SELECT * FROM window_resources WHERE outlet_id = ?').all(id);
  const totalQueue = windows.reduce((sum, w) => sum + w.current_queue, 0);
  const openWins = windows.filter(w => w.is_open).length;

  const today = new Date().toISOString().split('T')[0];
  const predictions = db.prepare(`
    SELECT * FROM heat_predictions
    WHERE outlet_id = ? AND predict_date = ?
    ORDER BY time_slot
  `).all(id, today);

  const suggested = calcSuggestedWindows(totalQueue, openWins, windows.length);

  res.json({
    code: 200,
    data: {
      ...outlet,
      windows,
      predictions,
      total_queue: totalQueue,
      open_windows: openWins,
      suggested_windows: suggested,
      load_level: calcLoadLevel(totalQueue, openWins),
    }
  });
});

module.exports = router;
