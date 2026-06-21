const express = require('express');
const router = express.Router();
const db = require('../utils/db');

router.get('/overview', (req, res) => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const outletCount = db.prepare('SELECT COUNT(*) as count FROM service_outlets').get().count;
  const certCount = db.prepare('SELECT COUNT(*) as count FROM certificates').get().count;
  const appointmentCount = db.prepare('SELECT COUNT(*) as count FROM appointments').get().count;
  const todayAppointments = db.prepare(`
    SELECT COUNT(*) as count FROM appointments 
    WHERE appointment_date = date('now', 'localtime')
  `).get().count;

  const districtStats = db.prepare(`
    SELECT district, COUNT(*) as count 
    FROM service_outlets 
    GROUP BY district
  `).all();

  res.json({
    code: 200,
    data: {
      user_count: userCount,
      outlet_count: outletCount,
      cert_count: certCount,
      appointment_count: appointmentCount,
      today_appointments: todayAppointments,
      district_stats: districtStats
    }
  });
});

router.get('/heat-prediction', (req, res) => {
  const { date, outletId } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];

  let sql = `
    SELECT hp.*, so.name as outlet_name, so.district
    FROM heat_predictions hp
    LEFT JOIN service_outlets so ON hp.outlet_id = so.id
    WHERE hp.predict_date = ?
  `;
  const params = [targetDate];

  if (outletId) {
    sql += ' AND hp.outlet_id = ?';
    params.push(outletId);
  }

  sql += ' ORDER BY hp.outlet_id, hp.time_slot';

  const list = db.prepare(sql).all(...params);

  const grouped = {};
  list.forEach(item => {
    if (!grouped[item.outlet_id]) {
      grouped[item.outlet_id] = {
        outlet_id: item.outlet_id,
        outlet_name: item.outlet_name,
        district: item.district,
        total_predicted: 0,
        total_actual: 0,
        time_slots: []
      };
    }
    grouped[item.outlet_id].total_predicted += item.predicted_count || 0;
    grouped[item.outlet_id].total_actual += item.actual_count || 0;
    grouped[item.outlet_id].time_slots.push({
      time_slot: item.time_slot,
      predicted_count: item.predicted_count,
      actual_count: item.actual_count,
      suggested_windows: item.suggested_windows
    });
  });

  res.json({
    code: 200,
    data: Object.values(grouped),
    date: targetDate
  });
});

router.get('/window-scheduling', (req, res) => {
  const outlets = db.prepare('SELECT * FROM service_outlets').all();

  const result = outlets.map(outlet => {
    const windows = db.prepare('SELECT * FROM window_resources WHERE outlet_id = ?').all(outlet.id);
    const predictions = db.prepare(`
      SELECT * FROM heat_predictions 
      WHERE outlet_id = ? AND predict_date = date('now', 'localtime')
      ORDER BY time_slot
    `).all(outlet.id);

    const totalQueue = windows.reduce((sum, w) => sum + w.current_queue, 0);
    const openWindows = windows.filter(w => w.is_open).length;
    const avgWait = Math.round(windows.reduce((sum, w) => sum + w.avg_wait_time, 0) / windows.length);

    const suggestedWindows = predictions.length > 0
      ? Math.max(...predictions.map(p => p.suggested_windows || 0))
      : Math.ceil(totalQueue / 10);

    return {
      outlet_id: outlet.id,
      outlet_name: outlet.name,
      district: outlet.district,
      total_windows: windows.length,
      open_windows: openWindows,
      suggested_windows: suggestedWindows,
      current_queue: totalQueue,
      avg_wait_time: avgWait,
      load_level: totalQueue > openWindows * 15 ? 'high' : totalQueue > openWindows * 8 ? 'medium' : 'low',
      windows,
      predictions
    };
  });

  res.json({ code: 200, data: result });
});

router.post('/window/dispatch', (req, res) => {
  const { outletId, windowCount } = req.body;

  const windows = db.prepare('SELECT * FROM window_resources WHERE outlet_id = ?').all(outletId);
  
  for (let i = 0; i < windows.length; i++) {
    const shouldOpen = i < windowCount;
    db.prepare('UPDATE window_resources SET is_open = ?, updated_at = datetime("now", "localtime") WHERE id = ?')
      .run(shouldOpen ? 1 : 0, windows[i].id);
  }

  res.json({
    code: 200,
    data: {
      message: `已调整开放窗口数为 ${windowCount}`,
      window_count: windowCount
    }
  });
});

router.get('/service-items', (req, res) => {
  const { category, page = 1, pageSize = 20 } = req.query;

  let sql = 'SELECT * FROM service_items WHERE 1=1';
  const params = [];

  if (category && category !== 'all') {
    sql += ' AND category = ?';
    params.push(category);
  }

  sql += ' ORDER BY id';
  sql += ' LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const list = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM service_items').get().count;

  const categories = db.prepare(`
    SELECT DISTINCT category FROM service_items
  `).all().map(item => item.category);

  res.json({ code: 200, data: list, total, categories });
});

router.get('/operation-logs', (req, res) => {
  const { page = 1, pageSize = 20, module } = req.query;

  let sql = 'SELECT * FROM operation_logs WHERE 1=1';
  const params = [];

  if (module) {
    sql += ' AND module = ?';
    params.push(module);
  }

  sql += ' ORDER BY created_at DESC';
  sql += ' LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const list = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM operation_logs').get().count;

  res.json({ code: 200, data: list, total });
});

router.post('/predict/generate', (req, res) => {
  const { date } = req.body;
  const targetDate = date || new Date().toISOString().split('T')[0];

  db.prepare('DELETE FROM heat_predictions WHERE predict_date = ?').run(targetDate);

  const outlets = db.prepare('SELECT * FROM service_outlets').all();
  const timeSlots = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'];

  const insertPred = db.prepare(`
    INSERT INTO heat_predictions (outlet_id, predict_date, time_slot, predicted_count, actual_count, suggested_windows)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  outlets.forEach(outlet => {
    const baseLoad = outlet.window_count * 8;
    timeSlots.forEach((slot, idx) => {
      let factor = 0.6 + Math.random() * 0.8;
      if (idx === 1 || idx === 4) factor *= 1.3;
      if (idx === 2 || idx === 5) factor *= 0.7;
      
      const predicted = Math.round(baseLoad * factor);
      insertPred.run(
        outlet.id, targetDate, slot,
        predicted, 0,
        Math.max(2, Math.ceil(predicted / 10))
      );
    });
  });

  res.json({
    code: 200,
    data: {
      message: `已生成 ${targetDate} 的热度预测数据`,
      date: targetDate,
      outlet_count: outlets.length
    }
  });
});

module.exports = router;
