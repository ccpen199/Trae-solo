const express = require('express');
const { db } = require('../db');
const { logCommand, detectDeviceTypeByCommand, updateLastUsed } = require('../middleware/commandLogger');

const router = express.Router();

function normalizeBody(body) {
  const normalized = { ...body };
  const mappings = {
    deviceTypeId: 'device_type_id',
    device_type: 'device_type_id',
    typeId: 'device_type_id',
    type_id: 'device_type_id',
    brandId: 'brand_id',
    modelId: 'model_id',
    powerConsumptionWatts: 'power_consumption_watts',
    dailyUsageHours: 'daily_usage_hours'
  };

  for (const [from, to] of Object.entries(mappings)) {
    if (body[from] !== undefined && normalized[to] === undefined) {
      normalized[to] = body[from];
    }
  }

  return normalized;
}

function inferUiType(device) {
  const haystack = [
    device.device_type_name,
    device.name,
    device.model_number,
    device.brand_name
  ].filter(Boolean).join(' ').toLowerCase();

  if (device.device_category === 'cooling') return 'ac';
  if (device.device_category === 'lighting') return 'light';
  if (device.device_category === 'AV' && /投影|projector|xgimi|vpl|lsp|z6x|z8x|\bh2\b|\bh3\b/.test(haystack)) return 'projector';
  if (device.device_category === 'AV') return 'tv';
  return 'default';
}

function withDeviceAliases(device, codes = []) {
  return {
    ...device,
    commands: codes,
    ir_codes: codes,
    irCodes: codes,
    type: inferUiType(device),
    category: device.device_category,
    brand: device.brand_name,
WHERE cl.user_id = ?
  AND cl.command NOT LIKE 'stats:%'
  AND cl.command NOT LIKE 'admin:%'
  AND cl.command NOT LIKE 'offline:%'WHERE cl.user_id = ?
  AND cl.command NOT LIKE 'stats:%'
  AND cl.command NOT LIKE 'admin:%'
  AND cl.command NOT LIKE 'offline:%'WHERE cl.user_id = ?
  AND cl.command NOT LIKE 'stats:%'
  AND cl.command NOT LIKE 'admin:%'
  AND cl.command NOT LIKE 'offline:%'WHERE cl.user_id = ?
  AND cl.command NOT LIKE 'stats:%'
  AND cl.command NOT LIKE 'admin:%'
  AND cl.command NOT LIKE 'offline:%'const isNewDataValid = 
  newOverview.totalDevices > 0 ||
  existingOverview.totalDevices === undefined ||
  existingOverview.totalDevices === 0const isNewDataValid = 
  newOverview.totalDevices > 0 ||
  existingOverview.totalDevices === undefined ||
  existingOverview.totalDevices === 0const isNewDataValid = 
  newOverview.totalDevices > 0 ||
  existingOverview.totalDevices === undefined ||
  existingOverview.totalDevices === 0const isNewDataValid = 
  newOverview.totalDevices > 0 ||
  existingOverview.totalDevices === undefined ||
  existingOverview.totalDevices === 0totalDevices: data.totalDevices ?? fallback?.totalDevices ?? 0totalDevices: data.totalDevices ?? fallback?.totalDevices ?? 0totalDevices: data.totalDevices ?? fallback?.totalDevices ?? 0totalDevices: data.totalDevices ?? fallback?.totalDevices ?? 0scenes: rollback_strategy TEXT DEFAULT 'stop'
scenes: retry_count INTEGER DEFAULT 1
scenes: action_count INTEGER DEFAULT 0
scene_actions: retry_count INTEGER DEFAULT 1scenes: rollback_strategy TEXT DEFAULT 'stop'
scenes: retry_count INTEGER DEFAULT 1
scenes: action_count INTEGER DEFAULT 0
scene_actions: retry_count INTEGER DEFAULT 1scenes: rollback_strategy TEXT DEFAULT 'stop'
scenes: retry_count INTEGER DEFAULT 1
scenes: action_count INTEGER DEFAULT 0
scene_actions: retry_count INTEGER DEFAULT 1scenes: rollback_strategy TEXT DEFAULT 'stop'
scenes: retry_count INTEGER DEFAULT 1
scenes: action_count INTEGER DEFAULT 0
scene_actions: retry_count INTEGER DEFAULT 1typeDisplayName: device.device_type_name || device.type_name || '-'typeDisplayName: device.device_type_name || device.type_name || '-'typeDisplayName: device.device_type_name || device.type_name || '-'typeDisplayName: device.device_type_name || device.type_name || '-'    model: device.model_number,
    status: device.last_used_at && Date.now() - new Date(device.last_used_at).getTime() < 3600000 ? 'online' : 'offline',
    lastUsed: device.last_used_at
  };
}

router.get('/', (req, res) => {
  const { user } = req;
  const { includeLogs } = req.query;
  
  const devices = db.prepare(`
    SELECT ud.*,
      dt.name as device_type_name,
      dt.category as device_category,
      dt.icon as device_type_icon,
      b.name as brand_name,
      b.logo as brand_logo,
      m.model_number,
      m.code_format,
      m.frequency,
      m.version as firmware_version
    FROM user_devices ud
    JOIN device_types dt ON ud.device_type_id = dt.id
    JOIN brands b ON ud.brand_id = b.id
    JOIN ir_code_models m ON ud.model_id = m.id
    WHERE ud.user_id = ?
    ORDER BY ud.room, ud.created_at DESC
  `).all(user.id);

  const devicesWithCodes = devices.map(d => {
    const codes = db.prepare(`
      SELECT id, command_name, code_data, created_at
      FROM ir_codes
      WHERE ir_code_model_id = ?
      ORDER BY command_name
    `).all(d.model_id);
    return withDeviceAliases(d, codes);
  });

  if (includeLogs) {
    const commandLogs = db.prepare(`
      SELECT cl.*,
        ud.name as device_name,
        dt.category as device_category
      FROM command_logs cl
      LEFT JOIN user_devices ud ON cl.device_id = ud.id
      LEFT JOIN device_types dt ON ud.device_type_id = dt.id
      WHERE cl.user_id = ?
      ORDER BY cl.created_at DESC
      LIMIT 50
    `).all(user.id);
    
    return res.json({
      data: devicesWithCodes,
      commandLogs: commandLogs,
      total: devicesWithCodes.length
    });
  }

  res.json(devicesWithCodes);
});

router.get('/:id', (req, res) => {
  const { user } = req;
  const { id } = req.params;
  
  const device = db.prepare(`
    SELECT ud.*,
      dt.name as device_type_name,
      dt.category as device_category,
      dt.icon as device_type_icon,
      b.name as brand_name,
      b.logo as brand_logo,
      m.model_number,
      m.code_format,
      m.frequency,
      m.version as firmware_version
    FROM user_devices ud
    JOIN device_types dt ON ud.device_type_id = dt.id
    JOIN brands b ON ud.brand_id = b.id
    JOIN ir_code_models m ON ud.model_id = m.id
    WHERE ud.id = ? AND ud.user_id = ?
  `).get(id, user.id);

  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  const codes = db.prepare(`
    SELECT id, command_name, code_data, created_at
    FROM ir_codes
    WHERE ir_code_model_id = ?
    ORDER BY command_name
  `).all(device.model_id);

  res.json(withDeviceAliases(device, codes));
});

router.post('/', (req, res) => {
  const { user } = req;
  const body = normalizeBody(req.body || {});
  const { device_type_id, brand_id, model_id, name, room, power_consumption_watts, daily_usage_hours } = body;

  if (!device_type_id || !brand_id || !model_id || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const result = db.prepare(`
    INSERT INTO user_devices (user_id, device_type_id, brand_id, model_id, name, room, power_consumption_watts, daily_usage_hours)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(user.id, device_type_id, brand_id, model_id, name, room || null, power_consumption_watts || 0, daily_usage_hours || 0);

  const device = db.prepare(`
    SELECT ud.*,
      dt.name as device_type_name,
      dt.category as device_category,
      b.name as brand_name,
      m.model_number
    FROM user_devices ud
    JOIN device_types dt ON ud.device_type_id = dt.id
    JOIN brands b ON ud.brand_id = b.id
    JOIN ir_code_models m ON ud.model_id = m.id
    WHERE ud.id = ?
  `).get(result.lastInsertRowid);

  logCommand(user.id, device.id, null, 'device_create', true, null, req.networkStatus);
  res.status(201).json(device);
});

router.put('/:id', (req, res) => {
  const { user } = req;
  const { id } = req.params;
  const body = normalizeBody(req.body || {});
  const { name, room, power_consumption_watts, daily_usage_hours } = body;

  const existing = db.prepare('SELECT id FROM user_devices WHERE id = ? AND user_id = ?').get(id, user.id);
  if (!existing) {
    return res.status(404).json({ error: 'Device not found' });
  }

  db.prepare(`
    UPDATE user_devices
    SET name = COALESCE(?, name),
        room = COALESCE(?, room),
        power_consumption_watts = COALESCE(?, power_consumption_watts),
        daily_usage_hours = COALESCE(?, daily_usage_hours)
    WHERE id = ? AND user_id = ?
  `).run(name || null, room || null, power_consumption_watts || null, daily_usage_hours || null, id, user.id);

  const device = db.prepare('SELECT * FROM user_devices WHERE id = ?').get(id);
  
  logCommand(user.id, id, null, 'device_update', true, null, req.networkStatus);
  res.json(device);
});

router.get('/:id/status', (req, res) => {
  const { user } = req;
  const { id } = req.params;

  const device = db.prepare(`
    SELECT id, name, last_used_at
    FROM user_devices
    WHERE id = ? AND user_id = ?
  `).get(id, user.id);

  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  const online = device.last_used_at && Date.now() - new Date(device.last_used_at).getTime() < 3600000;
  res.json({
    device_id: device.id,
    name: device.name,
    status: online ? 'online' : 'offline',
    last_used_at: device.last_used_at
  });
});

router.delete('/:id', (req, res) => {
  const { user } = req;
  const { id } = req.params;

  const existing = db.prepare('SELECT id FROM user_devices WHERE id = ? AND user_id = ?').get(id, user.id);
  if (!existing) {
    return res.status(404).json({ error: 'Device not found' });
  }

  db.exec('BEGIN TRANSACTION');
  try {
    db.prepare('DELETE FROM scene_actions WHERE device_id = ?').run(id);
    db.prepare('DELETE FROM schedule_tasks WHERE device_id = ?').run(id);
    db.prepare('DELETE FROM device_bindings WHERE primary_device_id = ? OR secondary_device_id = ?').run(id, id);
    db.prepare('DELETE FROM power_statistics WHERE device_id = ?').run(id);
    db.prepare('DELETE FROM command_logs WHERE device_id = ?').run(id);
    db.prepare('DELETE FROM learned_ir_codes WHERE device_id = ?').run(id);
    db.prepare('DELETE FROM error_feedbacks WHERE device_id = ?').run(id);
    db.prepare('DELETE FROM user_devices WHERE id = ? AND user_id = ?').run(id, user.id);
    db.exec('COMMIT');
    
    logCommand(user.id, null, null, 'device_delete', true, null, req.networkStatus);
    res.json({ success: true, message: 'Device deleted' });
  } catch (err) {
    db.exec('ROLLBACK');
    logCommand(user.id, id, null, 'device_delete', false, err.message, req.networkStatus);
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

router.get('/:id/commands', (req, res) => {
  const { user } = req;
  const { id } = req.params;

  const device = db.prepare('SELECT model_id FROM user_devices WHERE id = ? AND user_id = ?').get(id, user.id);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  const commands = db.prepare(`
    SELECT c.id, c.command_name, c.code_data, c.created_at,
      m.code_format, m.frequency
    FROM ir_codes c
    JOIN ir_code_models m ON c.ir_code_model_id = m.id
    WHERE c.ir_code_model_id = ?
    ORDER BY c.command_name
  `).all(device.model_id);

  res.json(commands);
});

module.exports = router;
