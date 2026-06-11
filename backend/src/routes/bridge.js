const express = require('express');
const { db } = require('../db');
const { logCommand, updateLastUsed } = require('../middleware/commandLogger');

const router = express.Router();

function normalizeBody(body) {
  const normalized = { ...body };
  if (body.deviceId !== undefined && normalized.device_id === undefined) normalized.device_id = body.deviceId;
  if (body.irCode !== undefined && normalized.ir_code === undefined) normalized.ir_code = body.irCode;
  return normalized;
}

router.get('/status', (req, res) => {
  res.json({
    android: { connected: true, infrared: true, status: 'ready' },
    airplay: { connected: true, devices: 2, status: 'ready' }
  });
});

router.get('/android/status', (req, res) => {
  res.json({ connected: true, infrared: true, status: 'ready' });
});

router.post('/android/ir-send', (req, res) => {
  const { user } = req;
  const body = normalizeBody(req.body || {});
  const device = db.prepare('SELECT id, name FROM user_devices WHERE id = ? AND user_id = ?').get(body.device_id, user.id);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }
  updateLastUsed(device.id);
  logCommand(user.id, device.id, null, 'bridge:android:ir-send', true, null, req.networkStatus);
  res.json({ success: true, deviceId: device.id, deviceName: device.name, sentAt: new Date().toISOString() });
});

router.post('/android/ir-learn', (req, res) => {
  const body = normalizeBody(req.body || {});
  res.json({
    success: true,
    deviceId: body.device_id,
    sessionId: `android-learn-${Date.now()}`,
    status: 'listening'
  });
});

router.get('/airplay/devices', (req, res) => {
  const devices = db.prepare(`
    SELECT id, name, room
    FROM user_devices
    WHERE user_id = ?
    ORDER BY room, name
    LIMIT 10
  `).all(req.user.id);
  res.json(devices.map(device => ({
    id: `airplay-${device.id}`,
    deviceId: device.id,
    name: device.name,
    room: device.room,
    status: 'available'
  })));
});

router.post('/airplay/send', (req, res) => {
  const { user } = req;
  const body = normalizeBody(req.body || {});
  const device = db.prepare('SELECT id, name FROM user_devices WHERE id = ? AND user_id = ?').get(body.device_id, user.id);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }
  updateLastUsed(device.id);
  logCommand(user.id, device.id, null, `bridge:airplay:${body.command || 'command'}`, true, null, req.networkStatus);
  res.json({ success: true, deviceId: device.id, command: body.command || null, sentAt: new Date().toISOString() });
});

router.get('/airplay/status/:deviceId', (req, res) => {
  res.json({ deviceId: req.params.deviceId, connected: true, status: 'available' });
});

module.exports = router;
