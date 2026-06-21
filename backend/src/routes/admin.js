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

  const totalAgentOpsCount = db.prepare(`
    SELECT COUNT(*) as count FROM agent_operations
  `).get().count;

  const windowDispatchSummaryRaw = db.prepare(`
    SELECT
      so.id as outlet_id,
      so.name as outlet_name,
      SUM(CASE WHEN wr.is_open = 1 THEN 1 ELSE 0 END) as open_windows,
      COUNT(wr.id) as total_windows,
      SUM(wr.current_queue) as current_queue
    FROM service_outlets so
    LEFT JOIN window_resources wr ON so.id = wr.outlet_id
    GROUP BY so.id, so.name
    ORDER BY current_queue DESC
    LIMIT 3
  `).all().map(item => {
    const q = item.current_queue || 0;
    const open = item.open_windows || 0;
    const total = item.total_windows || 0;
    const suggested = calcSuggestedWindows(q, open, total);
    return {
      outlet_id: item.outlet_id,
      outlet_name: item.outlet_name,
      open_windows: open,
      total_windows: total,
      current_queue: q,
      suggested_windows: suggested,
      load_level: calcLoadLevel(q, open)
    };
  });

  const totalOpenAll = db.prepare("SELECT SUM(CASE WHEN is_open=1 THEN 1 ELSE 0 END) c FROM window_resources").get().c || 0;
  const totalWindowsAll = db.prepare("SELECT COUNT(*) c FROM window_resources").get().c || 0;
  const totalQueueAll = db.prepare("SELECT SUM(current_queue) c FROM window_resources").get().c || 0;
  const totalSuggestedAll = Math.max(totalOpenAll, Math.ceil(totalQueueAll / 8));
  const windowDispatchSummary = {
    details: windowDispatchSummaryRaw,
    total_open: totalOpenAll,
    total_windows: totalWindowsAll,
    total_suggested: Math.min(totalSuggestedAll, totalWindowsAll || 1),
    total_queue: totalQueueAll,
    overall_load_level: calcLoadLevel(totalQueueAll, Math.max(totalOpenAll, 1)),
  };

  const todayPeakRow = db.prepare(`
    SELECT
      hp.outlet_id,
      so.name as outlet_name,
      hp.time_slot as peak_slot,
      hp.predicted_count as peak_count,
      hp.actual_count as peak_actual
    FROM heat_predictions hp
    LEFT JOIN service_outlets so ON hp.outlet_id = so.id
    WHERE hp.predict_date = date('now', 'localtime')
    ORDER BY hp.predicted_count DESC
    LIMIT 1
  `).get();

  let todayPeak = null;
  if (todayPeakRow) {
    const peakWindows = db.prepare('SELECT * FROM window_resources WHERE outlet_id = ?').all(todayPeakRow.outlet_id);
    const peakQueue = peakWindows.reduce((sum, w) => sum + w.current_queue, 0);
    const peakOpen = peakWindows.filter(w => w.is_open).length;
    todayPeak = {
      outlet_id: todayPeakRow.outlet_id,
      outlet_name: todayPeakRow.outlet_name,
      peak_slot: todayPeakRow.peak_slot,
      peak_count: todayPeakRow.peak_count || 0,
      predicted_count: todayPeakRow.peak_count || 0,
      peak_actual: todayPeakRow.peak_actual || 0,
      suggested_windows: calcSuggestedWindows(peakQueue, peakOpen, peakWindows.length),
      current_queue: peakQueue,
    };
  }

  const heatPredictionCount = db.prepare(`
    SELECT COUNT(*) as count FROM heat_predictions
    WHERE predict_date = date('now', 'localtime')
  `).get().count;

  const identityTodayRow = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM identity_codes WHERE date(created_at) = date('now', 'localtime')) as today_codes_count,
      (SELECT COUNT(*) FROM identity_codes) as codes_total_count,
      (SELECT ROUND(AVG(risk_score)) FROM identity_codes) as avg_risk_score,
      (SELECT COUNT(*) FROM identity_codes WHERE is_offline = 1 AND expire_at >= datetime('now', 'localtime')) as active_offline_count
  `).get();

  const identityToday = {
    today_codes_count: identityTodayRow.today_codes_count || 0,
    codes_total_count: identityTodayRow.codes_total_count || 0,
    avg_risk_score: identityTodayRow.avg_risk_score || 0,
    active_offline_count: identityTodayRow.active_offline_count || 0,
  };

  const districtStats = db.prepare(`
    SELECT district, COUNT(*) as count
    FROM service_outlets
    GROUP BY district
  `).all();

  const recentLogs = db.prepare(`
    SELECT id, user_id, operation, module, ip, created_at
    FROM operation_logs
    ORDER BY created_at DESC
    LIMIT 5
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
      today_confirmed: todayConfirmedAppointments,
      today_pending: todayPendingAppointments,
      today_completed: todayCompletedAppointments,
      today_logs_count: todayLogsCount,
      active_authorizations_count: activeAuthorizationsCount,
      pending_agent_ops_count: pendingAgentOpsCount,
      total_agent_ops_count: totalAgentOpsCount,
      window_dispatch_summary: windowDispatchSummary,
      today_peak: todayPeak,
      identity_today: identityToday,
      active_offline_count: identityToday.active_offline_count,
      district_stats: districtStats,
      heat_prediction_count: heatPredictionCount,
      recent_logs: recentLogs,
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
    const avgWait = windows.length > 0 ? Math.round(windows.reduce((sum, w) => sum + w.avg_wait_time, 0) / windows.length) : 15;

    const suggestedWindows = calcSuggestedWindows(totalQueue, openWindows, windows.length);

    return {
      outlet_id: outlet.id,
      outlet_name: outlet.name,
      district: outlet.district,
      total_windows: windows.length,
      open_windows: openWindows,
      suggested_windows: suggestedWindows,
      current_queue: totalQueue,
      avg_wait_time: avgWait,
      load_level: calcLoadLevel(totalQueue, openWindows),
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

  db.prepare(`
    INSERT INTO operation_logs (user_id, operation, module, ip, user_agent)
    VALUES (?, ?, ?, ?, ?)
  `).run(1, `调整窗口调度-网点${outletId}开放${windowCount}窗`, 'window', '127.0.0.1', 'admin');

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

  let countSql = 'SELECT COUNT(*) as count FROM operation_logs WHERE 1=1';
  const countParams = [];
  if (module) {
    countSql += ' AND module = ?';
    countParams.push(module);
  }
  const total = db.prepare(countSql).get(...countParams).count;

  const moduleStats = db.prepare(`
    SELECT module, COUNT(*) as count
    FROM operation_logs
    GROUP BY module
  `).all();

  res.json({ code: 200, data: list, total, moduleStats });
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
      const windows = db.prepare('SELECT * FROM window_resources WHERE outlet_id = ?').all(outlet.id);
      const openWins = windows.filter(w => w.is_open).length;
      const suggested = calcSuggestedWindows(predicted, openWins, windows.length);

      insertPred.run(
        outlet.id, targetDate, slot,
        predicted, 0, suggested
      );
    });
  });

  db.prepare(`
    INSERT INTO operation_logs (user_id, operation, module, ip, user_agent)
    VALUES (?, ?, ?, ?, ?)
  `).run(1, `生成${targetDate}热度预测`, 'window', '127.0.0.1', 'admin');

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

  const totalCodesCount = db.prepare(`
    SELECT COUNT(*) as count FROM identity_codes WHERE user_id = ?
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

  const offlineCodesList = db.prepare(`
    SELECT id, code_token, risk_level, risk_score, expire_at, created_at
    FROM identity_codes
    WHERE is_offline = 1 AND user_id = ? AND expire_at >= datetime('now', 'localtime')
    ORDER BY created_at DESC
    LIMIT 3
  `).all(userId);

  const recentCodeRecords = db.prepare(`
    SELECT id, code_token, risk_level, risk_score, is_offline, expire_at, created_at
    FROM identity_codes
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 5
  `).all(userId);

  const authList = db.prepare(`
    SELECT a.id, a.auth_scope, a.start_time, a.end_time, a.status, a.require_confirm,
           u.real_name as agent_name
    FROM agent_authorizations a
    LEFT JOIN users u ON a.agent_id = u.id
    WHERE a.principal_id = ?
    ORDER BY a.created_at DESC
    LIMIT 5
  `).all(userId);

  const certificates = db.prepare(`
    SELECT id, cert_type, cert_name, cert_number, issue_date, expire_date, status
    FROM certificates
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId);

  res.json({
    code: 200,
    data: {
      cert_integrated_count: certIntegratedCount,
      cert_total_types: 12,
      today_codes_count: todayCodesCount,
      total_codes_count: totalCodesCount,
      total_codes: totalCodesCount,
      pending_agent_ops_count: pendingAgentOpsCount,
      active_auth_count: activeAuthCount,
      risk_score: riskScore,
      risk_level: riskLevel,
      current_risk: { level: riskLevel, score: riskScore },
      latest_code_time: latestCodeTime,
      offline_codes_count: offlineCodesCount,
      offline_count: offlineCodesCount,
      offline_codes_list: offlineCodesList,
      recent_code_records: recentCodeRecords,
      auth_list: authList,
      certificates: certificates,
    }
  });
});

module.exports = router;
