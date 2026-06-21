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

  const todayCompletedAppointments = db.prepare(`
    SELECT COUNT(*) as count FROM appointments
    WHERE status = 'completed' AND appointment_date = date('now', 'localtime')
  `).get().count;

  const todayPendingAppointments = db.prepare(`
    SELECT COUNT(*) as count FROM appointments
    WHERE status = 'pending' AND appointment_date = date('now', 'localtime')
  `).get().count;

  const todayConfirmedAppointments = db.prepare(`
    SELECT COUNT(*) as count FROM appointments
    WHERE status = 'confirmed' AND appointment_date = date('now', 'localtime')
  `).get().count;

  const todayLogsCount = db.prepare(`
    SELECT COUNT(*) as count FROM operation_logs
    WHERE created_at >= datetime('now', 'localtime', 'start of day')
  `).get().count;

  const activeAuthorizationsCount = db.prepare(`
    SELECT COUNT(*) as count FROM agent_authorizations
    WHERE status = 'active' AND end_time >= datetime('now', 'localtime')
  `).get().count;

  const pendingAgentOpsCount = db.prepare(`
    SELECT COUNT(*) as count FROM agent_operations
    WHERE is_confirmed = 0
  `).get().count;

  const windowDispatchSummary = db.prepare(`
    SELECT 
      so.id as outlet_id,
      so.name as outlet_name,
      SUM(CASE WHEN wr.is_open = 1 THEN 1 ELSE 0 END) as open_windows,
      COUNT(wr.id) as total_windows,
      SUM(wr.current_queue) as current_queue,
      COALESCE((
        SELECT MAX(hp.suggested_windows) 
        FROM heat_predictions hp 
        WHERE hp.outlet_id = so.id AND hp.predict_date = date('now', 'localtime')
      ), 0) as suggested_windows
    FROM service_outlets so
    LEFT JOIN window_resources wr ON so.id = wr.outlet_id
    GROUP BY so.id, so.name
    ORDER BY current_queue DESC
    LIMIT 3
  `).all().map(item => ({
    outlet_id: item.outlet_id,
    outlet_name: item.outlet_name,
    open_windows: item.open_windows || 0,
    total_windows: item.total_windows || 0,
    current_queue: item.current_queue || 0,
    suggested_windows: item.suggested_windows || 0,
    load_level: (item.current_queue || 0) > (item.open_windows || 0) * 15 ? 'high' : 
               (item.current_queue || 0) > (item.open_windows || 0) * 8 ? 'medium' : 'low'
  }));

  const todayPeakRow = db.prepare(`
    SELECT 
      hp.outlet_id,
      so.name as outlet_name,
      hp.time_slot as peak_slot,
      hp.actual_count as peak_count,
      hp.suggested_windows
    FROM heat_predictions hp
    LEFT JOIN service_outlets so ON hp.outlet_id = so.id
    WHERE hp.predict_date = date('now', 'localtime')
    ORDER BY hp.actual_count DESC
    LIMIT 1
  `).get();

  const todayPeak = todayPeakRow ? {
    outlet_id: todayPeakRow.outlet_id,
    outlet_name: todayPeakRow.outlet_name,
    peak_slot: todayPeakRow.peak_slot,
    peak_count: todayPeakRow.peak_count || 0,
    suggested_windows: todayPeakRow.suggested_windows || 0
  } : null;

  const identityTodayRow = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM identity_codes WHERE date(created_at) = date('now', 'localtime')) as today_codes_count,
      (SELECT COUNT(*) FROM identity_codes) as codes_total_count,
      (SELECT ROUND(AVG(risk_score)) FROM identity_codes) as avg_risk_score
  `).get();

  const identityToday = {
    today_codes_count: identityTodayRow.today_codes_count || 0,
    codes_total_count: identityTodayRow.codes_total_count || 0,
    avg_risk_score: identityTodayRow.avg_risk_score || 0
  };

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
      today_completed_appointments: todayCompletedAppointments,
      today_pending_appointments: todayPendingAppointments,
      today_confirmed_appointments: todayConfirmedAppointments,
      today_logs_count: todayLogsCount,
      active_authorizations_count: activeAuthorizationsCount,
      pending_agent_ops_count: pendingAgentOpsCount,
      window_dispatch_summary: windowDispatchSummary,
      today_peak: todayPeak,
      identity_today: identityToday,
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

router.get('/identity-stats/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);

  const certIntegratedCount = db.prepare(`
    SELECT COUNT(*) as count FROM certificates WHERE user_id = ?
  `).get(userId).count;

  const todayCodesCount = db.prepare(`
    SELECT COUNT(*) as count FROM identity_codes
    WHERE user_id = ? AND date(created_at) = date('now', 'localtime')
  `).get(userId).count;

  const pendingAgentOpsCount = db.prepare(`
    SELECT COUNT(*) as count FROM agent_authorizations a
    INNER JOIN agent_operations o ON a.id = o.auth_id
    WHERE a.principal_id = ? AND o.is_confirmed = 0
  `).get(userId).count;

  const activeAuthCount = db.prepare(`
    SELECT COUNT(*) as count FROM agent_authorizations
    WHERE principal_id = ? AND status = 'active'
  `).get(userId).count;

  const riskScoreRow = db.prepare(`
    SELECT ROUND(AVG(risk_score)) as avg_score FROM (
      SELECT risk_score FROM identity_codes
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 5
    )
  `).get(userId);

  const riskScore = riskScoreRow.avg_score !== null ? parseInt(riskScoreRow.avg_score) : 25;

  let riskLevel;
  if (riskScore < 30) {
    riskLevel = 'low';
  } else if (riskScore < 65) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }

  const latestCodeRow = db.prepare(`
    SELECT created_at FROM identity_codes
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(userId);

  const latestCodeTime = latestCodeRow ? latestCodeRow.created_at : null;

  const offlineCodesCount = db.prepare(`
    SELECT COUNT(*) as count FROM identity_codes
    WHERE is_offline = 1 AND user_id = ? AND expire_at >= datetime('now', 'localtime')
  `).get(userId).count;

  res.json({
    code: 200,
    data: {
      cert_integrated_count: certIntegratedCount,
      cert_total_types: 12,
      today_codes_count: todayCodesCount,
      pending_agent_ops_count: pendingAgentOpsCount,
      active_auth_count: activeAuthCount,
      risk_score: riskScore,
      risk_level: riskLevel,
      latest_code_time: latestCodeTime,
      offline_codes_count: offlineCodesCount
    }
  });
});

module.exports = router;
