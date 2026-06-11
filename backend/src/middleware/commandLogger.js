const { db } = require('../db');

function detectDeviceTypeByCommand(command) {
  const acPatterns = /temp|mode|fan|swing|sleep|turbo|eco|cool|heat|dry/i;
  const tvPatterns = /volume|channel|mute|input|hdmi|netflix|youtube|tv/i;
  const lightPatterns = /brightness|color|romantic|reading|movie|timer|light/i;
  const projectorPatterns = /focus|zoom|keystone|lamp|projector/i;

  if (acPatterns.test(command)) return { typeId: 1, category: 'cooling' };
  if (tvPatterns.test(command)) return { typeId: 2, category: 'AV' };
  if (lightPatterns.test(command)) return { typeId: 3, category: 'lighting' };
  if (projectorPatterns.test(command)) return { typeId: 4, category: 'AV' };
  return { typeId: null, category: 'other' };
}

function logCommand(userId, deviceId, irCodeId, command, success, errorMessage, networkStatus) {
  const stmt = db.prepare(`
    INSERT INTO command_logs (user_id, device_id, ir_code_id, command, success, error_message, network_status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(userId, deviceId, irCodeId, command, success ? 1 : 0, errorMessage, networkStatus);
}

function updatePowerStats(userId, deviceId, runtimeMinutes) {
  const device = db.prepare('SELECT power_consumption_watts FROM user_devices WHERE id = ?').get(deviceId);
  if (!device) return;

  const powerKwh = (runtimeMinutes / 60) * (device.power_consumption_watts / 1000);
  const today = new Date().toISOString().split('T')[0];

  db.prepare(`
    INSERT INTO power_statistics (user_id, device_id, date, runtime_minutes, power_used_kwh)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, device_id, date) DO UPDATE SET
      runtime_minutes = runtime_minutes + excluded.runtime_minutes,
      power_used_kwh = power_used_kwh + excluded.power_used_kwh
  `).run(userId, deviceId, today, runtimeMinutes, Number(powerKwh.toFixed(4)));
}

function updateLastUsed(deviceId) {
  db.prepare('UPDATE user_devices SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?').run(deviceId);
}

module.exports = { logCommand, detectDeviceTypeByCommand, updatePowerStats, updateLastUsed };
