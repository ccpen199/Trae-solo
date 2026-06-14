const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const db = require('./database');
const strategyEngine = require('./strategyEngine');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || '58826');
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '48826');

app.use(cors({
  origin: `http://127.0.0.1:${FRONTEND_PORT}`,
  credentials: true
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), port: PORT });
});

app.post('/api/battery/record', (req, res) => {
  const {
    device_id, device_model, voltage, current, temperature, level,
    health, status, plugged, power_source, usb_protocol,
    is_charging, measurement_baseline, sampling_rate
  } = req.body;

  const stmt = db.prepare(`
    INSERT INTO battery_records (
      device_id, device_model, voltage, current, temperature, level,
      health, status, plugged, power_source, usb_protocol,
      is_charging, measurement_baseline, sampling_rate
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    device_id, device_model || 'Default', voltage, current, temperature, level,
    health, status, plugged, power_source || 'BatteryManager',
    usb_protocol || 'USB_PD', is_charging ? 1 : 0,
    measurement_baseline || 'Android BatteryManager API, 1Hz采样, USB供电协议探测',
    sampling_rate || 1
  );

  const activeSessionStmt = db.prepare(`
    SELECT * FROM optimization_sessions 
    WHERE device_id = ? AND is_active = 1 
    ORDER BY start_time DESC LIMIT 1
  `);
  const activeSession = activeSessionStmt.get(device_id);

  if (activeSession) {
    const fuseIssues = strategyEngine.checkSafetyFuse(
      { temperature, voltage, health },
      activeSession.id,
      device_id
    );

    const adaptation = strategyEngine.getDeviceAdaptation(device_model || 'Default');
    const strategyResult = strategyEngine.calculateOptimalStrategy(
      { temperature, current, level, health, is_charging, voltage },
      device_model || 'Default',
      null
    );

    strategyResult.adjustments.forEach(adj => {
      strategyEngine.logAdjustment(activeSession.id, device_id, adj);
    });

    const updateStmt = db.prepare(`
      UPDATE optimization_sessions 
      SET strategy_snapshot = ? 
      WHERE id = ?
    `);
    updateStmt.run(JSON.stringify(strategyResult.strategy), activeSession.id);

    res.json({
      success: true,
      id: result.lastInsertRowid,
      safety_issues: fuseIssues,
      strategy_updates: strategyResult.adjustments,
      current_strategy: strategyResult.strategy,
      device_adaptation: adaptation
    });
    return;
  }

  res.json({ success: true, id: result.lastInsertRowid });
});

app.get('/api/battery/history/:device_id', (req, res) => {
  const { device_id } = req.params;
  const { limit = 100 } = req.query;
  const stmt = db.prepare(`
    SELECT * FROM battery_records 
    WHERE device_id = ? 
    ORDER BY timestamp DESC 
    LIMIT ?
  `);
  const records = stmt.all(device_id, limit);
  res.json(records);
});

app.get('/api/battery/latest/:device_id', (req, res) => {
  const { device_id } = req.params;
  const stmt = db.prepare(`
    SELECT * FROM battery_records 
    WHERE device_id = ? 
    ORDER BY timestamp DESC 
    LIMIT 1
  `);
  const record = stmt.get(device_id);

  if (record) {
    const historyStmt = db.prepare(`
      SELECT * FROM battery_records 
      WHERE device_id = ? 
      ORDER BY timestamp DESC 
      LIMIT 20
    `);
    const history = historyStmt.all(device_id);

    const estimatedTime = strategyEngine.calculateEstimatedFullTime(record, history);

    res.json({
      ...record,
      estimated_full_time_seconds: estimatedTime,
      measurement_baseline: record.measurement_baseline || 'Android BatteryManager API, 1Hz采样, USB供电协议探测'
    });
    return;
  }

  res.json(null);
});

app.post('/api/optimization/start', (req, res) => {
  const { device_id, start_level, strategy_used, device_model } = req.body;

  const adaptation = strategyEngine.getDeviceAdaptation(device_model || 'Default');

  const stmt = db.prepare(`
    INSERT INTO optimization_sessions (
      device_id, start_level, strategy_used, is_active, strategy_snapshot
    ) VALUES (?, ?, ?, 1, ?)
  `);

  const result = stmt.run(
    device_id,
    start_level,
    strategy_used || 'adaptive',
    JSON.stringify(adaptation.strategy_config)
  );

  res.json({
    success: true,
    session_id: result.lastInsertRowid,
    initial_strategy: adaptation.strategy_config,
    device_adaptation: {
      device_model: adaptation.device_model,
      soc_manufacturer: adaptation.soc_manufacturer,
      soc_model: adaptation.soc_model,
      optimal_voltage: adaptation.optimal_voltage,
      optimal_temperature: adaptation.optimal_temperature,
      temperature_high_threshold: adaptation.temperature_high_threshold,
      temperature_low_threshold: adaptation.temperature_low_threshold
    }
  });
});

app.post('/api/optimization/end/:session_id', (req, res) => {
  const { session_id } = req.params;
  const { end_level, total_time, efficiency } = req.body;

  const sessionStmt = db.prepare('SELECT * FROM optimization_sessions WHERE id = ?');
  const session = sessionStmt.get(session_id);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const recordsStmt = db.prepare(`
    SELECT * FROM battery_records 
    WHERE device_id = ? AND timestamp BETWEEN ? AND ?
  `);
  const endTime = new Date().toISOString();
  const records = recordsStmt.all(session.device_id, session.start_time, endTime);

  let avgVoltage = null, avgCurrent = null, avgTemp = null, maxTemp = null;
  if (records.length > 0) {
    avgVoltage = records.reduce((a, r) => a + r.voltage, 0) / records.length;
    avgCurrent = records.reduce((a, r) => a + r.current, 0) / records.length;
    avgTemp = records.reduce((a, r) => a + r.temperature, 0) / records.length;
    maxTemp = Math.max(...records.map(r => r.temperature));
  }

  const updateStmt = db.prepare(`
    UPDATE optimization_sessions 
    SET end_time = CURRENT_TIMESTAMP, end_level = ?, total_time = ?, efficiency = ?, 
        is_active = 0, avg_voltage = ?, avg_current = ?, avg_temperature = ?, max_temperature = ?
    WHERE id = ?
  `);

  updateStmt.run(end_level, total_time, efficiency, avgVoltage, avgCurrent, avgTemp, maxTemp, session_id);

  const allSessionsStmt = db.prepare(`
    SELECT * FROM optimization_sessions 
    WHERE device_id = ? 
    ORDER BY start_time DESC 
    LIMIT 50
  `);
  const allSessions = allSessionsStmt.all(session.device_id);

  const habitResult = strategyEngine.analyzeUserHabits(session.device_id, allSessions, records);
  const trendResult = strategyEngine.calculateEfficiencyTrend(allSessions);

  res.json({
    success: true,
    summary: {
      avg_voltage: avgVoltage,
      avg_current: avgCurrent,
      avg_temperature: avgTemp,
      max_temperature: maxTemp
    },
    habit_analysis: habitResult,
    efficiency_trend: trendResult
  });
});

app.get('/api/optimization/sessions/:device_id', (req, res) => {
  const { device_id } = req.params;
  const stmt = db.prepare(`
    SELECT * FROM optimization_sessions 
    WHERE device_id = ? 
    ORDER BY start_time DESC 
    LIMIT 50
  `);
  const sessions = stmt.all(device_id);

  const trendResult = strategyEngine.calculateEfficiencyTrend(sessions);

  res.json({
    sessions,
    efficiency_trend: trendResult
  });
});

app.get('/api/optimization/active/:device_id', (req, res) => {
  const { device_id } = req.params;
  const stmt = db.prepare(`
    SELECT * FROM optimization_sessions 
    WHERE device_id = ? AND is_active = 1 
    ORDER BY start_time DESC LIMIT 1
  `);
  const session = stmt.get(device_id);

  if (session) {
    const adjustments = strategyEngine.getAdjustmentHistory(session.id);
    const fuseRecords = strategyEngine.getFuseRecords(device_id, 10);
    const adaptation = strategyEngine.getDeviceAdaptation('Default');

    res.json({
      session,
      strategy_snapshot: session.strategy_snapshot ? JSON.parse(session.strategy_snapshot) : null,
      adjustments,
      fuse_records: fuseRecords,
      adaptation
    });
    return;
  }

  res.json(null);
});

app.get('/api/adaptations', (req, res) => {
  const stmt = db.prepare('SELECT * FROM device_adaptations ORDER BY created_at DESC');
  const adaptations = stmt.all();
  res.json(adaptations.map(a => ({
    ...a,
    strategy_config: JSON.parse(a.strategy_config)
  })));
});

app.get('/api/adaptations/:model', (req, res) => {
  const { model } = req.params;
  const adaptation = strategyEngine.getDeviceAdaptation(model);
  res.json(adaptation);
});

app.get('/api/habits/:device_id', (req, res) => {
  const { device_id } = req.params;
  const stmt = db.prepare(`
    SELECT * FROM user_habits 
    WHERE device_id = ? 
    ORDER BY last_updated DESC 
    LIMIT 1
  `);
  const habit = stmt.get(device_id);

  if (habit) {
    res.json({
      ...habit,
      low_battery_hours: habit.low_battery_hours ? JSON.parse(habit.low_battery_hours) : {},
      charging_patterns: habit.charging_patterns ? JSON.parse(habit.charging_patterns) : {},
      common_charge_levels: habit.common_charge_levels ? JSON.parse(habit.common_charge_levels) : []
    });
    return;
  }

  const sessionsStmt = db.prepare(`
    SELECT * FROM optimization_sessions 
    WHERE device_id = ? 
    ORDER BY start_time DESC 
    LIMIT 50
  `);
  const sessions = sessionsStmt.all(device_id);

  const habitResult = strategyEngine.analyzeUserHabits(device_id, sessions, []);
  res.json(habitResult);
});

app.post('/api/habits/analyze/:device_id', (req, res) => {
  const { device_id } = req.params;

  const sessionsStmt = db.prepare(`
    SELECT * FROM optimization_sessions 
    WHERE device_id = ? 
    ORDER BY start_time DESC 
    LIMIT 50
  `);
  const sessions = sessionsStmt.all(device_id);

  const recordsStmt = db.prepare(`
    SELECT * FROM battery_records 
    WHERE device_id = ? 
    ORDER BY timestamp DESC 
    LIMIT 200
  `);
  const records = recordsStmt.all(device_id);

  const habitResult = strategyEngine.analyzeUserHabits(device_id, sessions, records);
  res.json(habitResult);
});

app.get('/api/safety/fuse/:device_id', (req, res) => {
  const { device_id } = req.params;
  const { limit = 20 } = req.query;
  const records = strategyEngine.getFuseRecords(device_id, limit);
  res.json(records);
});

app.post('/api/safety/resolve/:fuse_id', (req, res) => {
  const { fuse_id } = req.params;
  const stmt = db.prepare(`
    UPDATE safety_fuse_records 
    SET resolved = 1, resolved_time = CURRENT_TIMESTAMP 
    WHERE id = ?
  `);
  const result = stmt.run(fuse_id);
  res.json({ success: result.changes > 0 });
});

app.get('/api/strategy/adjustments/:session_id', (req, res) => {
  const { session_id } = req.params;
  const adjustments = strategyEngine.getAdjustmentHistory(session_id);
  res.json(adjustments);
});

app.get('/api/efficiency/comparison/:device_id', (req, res) => {
  const { device_id } = req.params;
  const { count = 10 } = req.query;

  const sessionsStmt = db.prepare(`
    SELECT * FROM optimization_sessions 
    WHERE device_id = ? AND efficiency IS NOT NULL 
    ORDER BY start_time DESC 
    LIMIT ?
  `);
  const sessions = sessionsStmt.all(device_id, count);

  const trendResult = strategyEngine.calculateEfficiencyTrend(sessions);

  const avgEfficiency = sessions.length > 0
    ? sessions.reduce((a, s) => a + s.efficiency, 0) / sessions.length
    : 0;

  const bestEfficiency = sessions.length > 0
    ? Math.max(...sessions.map(s => s.efficiency))
    : 0;

  res.json({
    sessions: sessions.reverse(),
    trend: trendResult,
    statistics: {
      total_sessions: sessions.length,
      average_efficiency: avgEfficiency,
      best_efficiency: bestEfficiency
    }
  });
});

app.get('/api/dashboard/summary/:device_id', (req, res) => {
  const { device_id } = req.params;

  const latestStmt = db.prepare(`
    SELECT * FROM battery_records 
    WHERE device_id = ? 
    ORDER BY timestamp DESC LIMIT 1
  `);
  const latest = latestStmt.get(device_id);

  const activeSessionStmt = db.prepare(`
    SELECT * FROM optimization_sessions 
    WHERE device_id = ? AND is_active = 1 
    ORDER BY start_time DESC LIMIT 1
  `);
  const activeSession = activeSessionStmt.get(device_id);

  const sessionsStmt = db.prepare(`
    SELECT * FROM optimization_sessions 
    WHERE device_id = ? 
    ORDER BY start_time DESC LIMIT 50
  `);
  const sessions = sessionsStmt.all(device_id);

  const fuseStmt = db.prepare(`
    SELECT * FROM safety_fuse_records 
    WHERE device_id = ? AND resolved = 0 
    ORDER BY trigger_time DESC LIMIT 5
  `);
  const activeFuses = fuseStmt.all(device_id);

  const trendResult = strategyEngine.calculateEfficiencyTrend(sessions);

  let estimatedTime = null;
  if (latest) {
    const historyStmt = db.prepare(`
      SELECT * FROM battery_records 
      WHERE device_id = ? 
      ORDER BY timestamp DESC LIMIT 20
    `);
    const history = historyStmt.all(device_id);
    estimatedTime = strategyEngine.calculateEstimatedFullTime(latest, history);
  }

  res.json({
    latest_battery: latest,
    active_session: activeSession ? {
      ...activeSession,
      strategy_snapshot: activeSession.strategy_snapshot ? JSON.parse(activeSession.strategy_snapshot) : null
    } : null,
    total_sessions: sessions.length,
    active_safety_fuses: activeFuses,
    efficiency_trend: trendResult,
    estimated_full_time_seconds: estimatedTime
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
  console.log(`Frontend allowed from http://127.0.0.1:${FRONTEND_PORT}`);
});
