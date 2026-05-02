const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const { inverterDataValidation, stationIdParamValidation } = require('../middleware/validation');
const PREfficiencyEngine = require('../engines/pr-efficiency.engine');
const FaultDiagnosisEngine = require('../engines/fault-diagnosis.engine');
const AuditService = require('../services/audit.service');

router.get('/station/:stationId', authenticateToken, stationIdParamValidation, (req, res) => {
  try {
    const { stationId } = req.params;

    const inverters = db.prepare(`
      SELECT i.*,
             (SELECT COUNT(*) FROM strings WHERE inverter_id = i.id) as string_count,
             (SELECT collect_time FROM inverter_data 
              WHERE inverter_id = i.id ORDER BY collect_time DESC LIMIT 1) as last_data_time
      FROM inverters i
      WHERE i.station_id = ?
    `).all(stationId);

    res.json({ data: inverters });
  } catch (err) {
    console.error('Get inverters error:', err);
    res.status(500).json({ error: '获取逆变器列表失败' });
  }
});

router.get('/:inverterId', authenticateToken, (req, res) => {
  try {
    const { inverterId } = req.params;

    const inverter = db.prepare(`
      SELECT i.*, s.name as station_name
      FROM inverters i
      JOIN stations s ON i.station_id = s.id
      WHERE i.id = ?
    `).get(inverterId);

    if (!inverter) {
      return res.status(404).json({ error: '逆变器不存在' });
    }

    const strings = db.prepare(`
      SELECT * FROM strings WHERE inverter_id = ? ORDER BY string_number
    `).all(inverterId);

    const recentData = db.prepare(`
      SELECT * FROM inverter_data
      WHERE inverter_id = ?
      ORDER BY collect_time DESC
      LIMIT 50
    `).all(inverterId);

    res.json({
      inverter,
      strings,
      recent_data: recentData
    });
  } catch (err) {
    console.error('Get inverter error:', err);
    res.status(500).json({ error: '获取逆变器详情失败' });
  }
});

router.post('/data', inverterDataValidation, (req, res) => {
  try {
    const {
      inverter_id, collect_time, dc_voltage, dc_current,
      ac_voltage, ac_current, active_power, reactive_power,
      power_factor, efficiency, temperature,
      daily_generation_kwh, total_generation_kwh,
      status_code, alarm_code
    } = req.body;

    const inverter = db.prepare('SELECT * FROM inverters WHERE id = ?').get(inverter_id);
    if (!inverter) {
      return res.status(404).json({ error: '逆变器不存在' });
    }

    const collectTime = collect_time || new Date().toISOString();
    const id = uuidv4();

    db.prepare(`
      INSERT INTO inverter_data (
        id, inverter_id, station_id, collect_time,
        dc_voltage, dc_current, ac_voltage, ac_current,
        active_power, reactive_power, power_factor,
        efficiency, temperature,
        daily_generation_kwh, total_generation_kwh,
        status_code, alarm_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, inverter_id, inverter.station_id, collectTime,
      dc_voltage, dc_current, ac_voltage, ac_current,
      active_power, reactive_power, power_factor,
      efficiency, temperature,
      daily_generation_kwh, total_generation_kwh,
      status_code, alarm_code
    );

    db.prepare(`
      UPDATE inverters SET
        last_communication = ?,
        status = ?
      WHERE id = ?
    `).run(collectTime, alarm_code ? 'fault' : 'operating', inverter_id);

    const alarms = FaultDiagnosisEngine.analyzeInverterAlarm({
      inverter_id, dc_voltage, dc_current, temperature, efficiency, alarm_code
    });

    if (alarms.length > 0) {
      const createdFaults = FaultDiagnosisEngine.createFault({
        inverter_id,
        station_id: inverter.station_id,
        dc_voltage, dc_current, temperature, efficiency, alarm_code
      }, alarms);
    }

    const efficiencyData = PREfficiencyEngine.processInverterData({
      inverter_id,
      station_id: inverter.station_id,
      active_power: active_power || 0,
      dc_voltage, dc_current, temperature, efficiency
    });

    const rawMessage = JSON.stringify(req.body);
    const messageId = uuidv4();
    const crypto = require('crypto');
    const hashValue = crypto.createHash('sha256')
      .update(inverter_id + collectTime + rawMessage + process.env.JWT_SECRET)
      .digest('hex');

    db.prepare(`
      INSERT INTO inverter_messages (
        id, inverter_id, station_id, message_time, message_type,
        raw_message, parsed_data, hash_value
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      messageId, inverter_id, inverter.station_id, collectTime,
      alarm_code ? 'alarm' : 'telemetry',
      rawMessage, JSON.stringify(efficiencyData), hashValue
    );

    res.json({
      message: '数据上报成功',
      efficiency_analysis: efficiencyData,
      alarms_detected: alarms.length
    });
  } catch (err) {
    console.error('Inverter data error:', err);
    res.status(500).json({ error: '数据处理失败' });
  }
});

router.get('/:inverterId/trend', authenticateToken, (req, res) => {
  try {
    const { inverterId } = req.params;
    const { hours = 24 } = req.query;

    const data = db.prepare(`
      SELECT 
        collect_time,
        active_power,
        dc_voltage,
        dc_current,
        ac_voltage,
        ac_current,
        efficiency,
        temperature
      FROM inverter_data
      WHERE inverter_id = ?
        AND collect_time >= datetime('now', '-' || ? || ' hours')
      ORDER BY collect_time
    `).all(inverterId, parseInt(hours));

    const inverter = db.prepare(`
      SELECT i.serial_number, i.model, i.capacity_kw, s.name as station_name
      FROM inverters i
      JOIN stations s ON i.station_id = s.id
      WHERE i.id = ?
    `).get(inverterId);

    res.json({
      inverter,
      hours: parseInt(hours),
      data_points: data.length,
      trend_data: data
    });
  } catch (err) {
    console.error('Get inverter trend error:', err);
    res.status(500).json({ error: '获取趋势数据失败' });
  }
});

module.exports = router;
