const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const devices = db.prepare(`
    SELECT d.*, u.username as owner_name 
    FROM devices d 
    LEFT JOIN users u ON d.user_id = u.id
    WHERE d.user_id = ? OR ? = 'admin'
  `).all(req.user.id, req.user.role);

  res.json({ devices });
});

router.get('/:vin', authenticateToken, (req, res) => {
  const device = db.prepare(`
    SELECT d.*, u.username as owner_name, u.email as owner_email
    FROM devices d 
    LEFT JOIN users u ON d.user_id = u.id
    WHERE d.vin = ?
  `).get(req.params.vin);

  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  if (device.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'No permission to view this device' });
  }

  res.json({ device });
});

router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const { vin, model, firmware_version } = req.body;

  if (!vin || !model) {
    return res.status(400).json({ error: 'VIN and model are required' });
  }

  const existing = db.prepare('SELECT id FROM devices WHERE vin = ?').get(vin);
  if (existing) {
    return res.status(400).json({ error: 'VIN already exists' });
  }

  const result = db.prepare(`
    INSERT INTO devices (vin, model, firmware_version, status)
    VALUES (?, ?, ?, 'inactive')
  `).run(vin, model, firmware_version || '1.0.0');

  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ device });
});

router.post('/activate', authenticateToken, (req, res) => {
  const { vin } = req.body;

  if (!vin) {
    return res.status(400).json({ error: 'VIN is required' });
  }

  const device = db.prepare('SELECT * FROM devices WHERE vin = ?').get(vin);

  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  if (device.status === 'active') {
    return res.status(400).json({ error: 'Device already activated' });
  }

  if (device.user_id && device.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Device belongs to another user' });
  }

  db.prepare(`
    UPDATE devices 
    SET user_id = ?, status = 'active', activated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.user.id, device.id);

  const updatedDevice = db.prepare('SELECT * FROM devices WHERE id = ?').get(device.id);
  res.json({ device: updatedDevice });
});

router.post('/:vin/heartbeat', authenticateToken, (req, res) => {
  const { battery_level, mileage, lat, lng } = req.body;

  const device = db.prepare('SELECT * FROM devices WHERE vin = ?').get(req.params.vin);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  if (device.user_id !== req.user.id) {
    return res.status(403).json({ error: 'No permission' });
  }

  db.prepare(`
    UPDATE devices 
    SET battery_level = ?, mileage = ?, last_heartbeat = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(battery_level ?? device.battery_level, mileage ?? device.mileage, device.id);

  res.json({ status: 'ok' });
});

router.get('/:vin/ota/available', authenticateToken, (req, res) => {
  const device = db.prepare('SELECT * FROM devices WHERE vin = ?').get(req.params.vin);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  const latestFirmware = db.prepare(`
    SELECT * FROM firmware_versions 
    WHERE model = ? AND released_at <= CURRENT_TIMESTAMP
    ORDER BY released_at DESC LIMIT 1
  `).get(device.model);

  if (!latestFirmware) {
    return res.json({ available: false });
  }

  const hasUpdate = latestFirmware.version !== device.firmware_version;
  res.json({
    available: hasUpdate,
    firmware: hasUpdate ? latestFirmware : null,
    current_version: device.firmware_version
  });
});

router.post('/:vin/ota/upgrade', authenticateToken, (req, res) => {
  const { firmware_id } = req.body;

  const device = db.prepare('SELECT * FROM devices WHERE vin = ?').get(req.params.vin);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  if (device.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'No permission' });
  }

  let firmware;
  if (firmware_id) {
    firmware = db.prepare('SELECT * FROM firmware_versions WHERE id = ?').get(firmware_id);
  } else {
    firmware = db.prepare(`
      SELECT * FROM firmware_versions 
      WHERE model = ? AND released_at <= CURRENT_TIMESTAMP
      ORDER BY released_at DESC LIMIT 1
    `).get(device.model);
  }

  if (!firmware) {
    return res.status(400).json({ error: 'No firmware available' });
  }

  const existingTask = db.prepare(`
    SELECT * FROM ota_tasks 
    WHERE device_id = ? AND status IN ('pending', 'downloading', 'installing')
  `).get(device.id);

  if (existingTask) {
    return res.status(400).json({ error: 'OTA task already in progress' });
  }

  const result = db.prepare(`
    INSERT INTO ota_tasks (device_id, firmware_id, status, started_at)
    VALUES (?, ?, 'downloading', CURRENT_TIMESTAMP)
  `).run(device.id, firmware.id);

  setTimeout(() => {
    db.prepare('UPDATE ota_tasks SET progress = 50, status = ? WHERE id = ?').run('installing', result.lastInsertRowid);
    
    setTimeout(() => {
      db.prepare(`
        UPDATE ota_tasks SET progress = 100, status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(result.lastInsertRowid);
      db.prepare('UPDATE devices SET firmware_version = ? WHERE id = ?').run(firmware.version, device.id);
    }, 3000);
  }, 2000);

  const task = db.prepare('SELECT * FROM ota_tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ task });
});

router.get('/:vin/ota/tasks', authenticateToken, (req, res) => {
  const device = db.prepare('SELECT * FROM devices WHERE vin = ?').get(req.params.vin);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  const tasks = db.prepare(`
    SELECT t.*, f.version, f.changelog 
    FROM ota_tasks t
    JOIN firmware_versions f ON t.firmware_id = f.id
    WHERE t.device_id = ?
    ORDER BY t.id DESC
  `).all(device.id);

  res.json({ tasks });
});

module.exports = router;
