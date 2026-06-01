import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', (req: AuthRequest, res) => {
  const devices = db.prepare(`
    SELECT d.*, 
      CASE WHEN dp.access_level IS NOT NULL THEN dp.access_level ELSE 'owner' END as access_level
    FROM devices d
    LEFT JOIN device_permissions dp ON d.id = dp.device_id AND dp.user_id = ?
  `).all(req.user!.id);

  const formatted = devices.map((d: any) => ({
    ...d,
    state: d.state ? JSON.parse(d.state) : null
  }));

  res.json(formatted);
});

router.get('/:id', (req: AuthRequest, res) => {
  const device = db.prepare(`
    SELECT d.*,
      CASE WHEN dp.access_level IS NOT NULL THEN dp.access_level ELSE 'owner' END as access_level
    FROM devices d
    LEFT JOIN device_permissions dp ON d.id = dp.device_id AND dp.user_id = ?
    WHERE d.id = ?
  `).get(req.user!.id, req.params.id);

  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  res.json({
    ...device,
    state: device.state ? JSON.parse(device.state) : null
  });
});

router.post('/', (req: AuthRequest, res) => {
  const { name, type, manufacturer, model, protocol } = req.body;

  if (!name || !type || !manufacturer || !model) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const deviceId = uuidv4();
  const now = Math.floor(Date.now() / 1000);

  db.prepare(`
    INSERT INTO devices (id, name, type, manufacturer, model, protocol, status, online, state, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    deviceId,
    name,
    type,
    manufacturer,
    model,
    protocol || 'matter',
    'pending',
    0,
    JSON.stringify({}),
    now,
    now
  );

  db.prepare('INSERT INTO operation_logs (id, user_id, module, action, details) VALUES (?, ?, ?, ?, ?)').run(
    uuidv4(),
    req.user!.id,
    'devices',
    'create',
    JSON.stringify({ deviceId, name })
  );

  res.status(201).json({ id: deviceId, name, type, manufacturer, model });
});

router.put('/:id', (req: AuthRequest, res) => {
  const { name, state } = req.body;
  const deviceId = req.params.id;
  const now = Math.floor(Date.now() / 1000);

  const device = db.prepare('SELECT id FROM devices WHERE id = ?').get(deviceId);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  db.prepare('UPDATE devices SET name = ?, state = ?, updated_at = ? WHERE id = ?').run(
    name,
    JSON.stringify(state || {}),
    now,
    deviceId
  );

  db.prepare('INSERT INTO device_logs (id, device_id, action, details, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    uuidv4(),
    deviceId,
    'update',
    JSON.stringify({ name, state }),
    req.user!.id,
    now
  );

  res.json({ success: true });
});

router.delete('/:id', (req: AuthRequest, res) => {
  const deviceId = req.params.id;

  const device = db.prepare('SELECT id FROM devices WHERE id = ?').get(deviceId);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  db.prepare('DELETE FROM devices WHERE id = ?').run(deviceId);

  db.prepare('INSERT INTO operation_logs (id, user_id, module, action, details) VALUES (?, ?, ?, ?, ?)').run(
    uuidv4(),
    req.user!.id,
    'devices',
    'delete',
    JSON.stringify({ deviceId })
  );

  res.json({ success: true });
});

router.post('/:id/command', (req: AuthRequest, res) => {
  const { command, params } = req.body;
  const deviceId = req.params.id;
  const now = Math.floor(Date.now() / 1000);

  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(deviceId);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  let newState = device.state ? JSON.parse(device.state) : {};
  let newOnline = device.online;
  let newStatus = device.status;

  if (command === 'turn_on') {
    newState.power = true;
    if (!device.online) { newOnline = 1; newStatus = 'online'; }
  } else if (command === 'turn_off') {
    newState.power = false;
  } else if (command === 'set_brightness' && params?.value !== undefined) {
    newState.brightness = params.value;
  } else if (command === 'set_temperature' && params?.value !== undefined) {
    newState.temperature = params.value;
  } else if (command === 'reboot') {
    newOnline = 0;
    newStatus = 'rebooting';
    setTimeout(() => {
      db.prepare('UPDATE devices SET online = 1, status = ?, updated_at = ? WHERE id = ?').run('online', Math.floor(Date.now() / 1000), deviceId);
    }, 3000);
  } else if (command === 'refresh') {
    if (device.online) { newStatus = 'online'; }
  }

  db.prepare('UPDATE devices SET state = ?, online = ?, status = ?, last_seen = ?, updated_at = ? WHERE id = ?').run(
    JSON.stringify(newState),
    newOnline,
    newStatus,
    now,
    now,
    deviceId
  );

  db.prepare('INSERT INTO device_logs (id, device_id, action, details, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    uuidv4(),
    deviceId,
    'command',
    JSON.stringify({ command, params, result: 'success' }),
    req.user!.id,
    now
  );

  res.json({ success: true, message: 'Command executed', command, params, state: newState, online: newOnline, status: newStatus });
});

router.post('/discover', (req: AuthRequest, res) => {
  const mockDevices = [
    {
      id: uuidv4(),
      name: '智能灯泡 A19',
      type: 'light',
      manufacturer: 'Xiaomi',
      model: 'MJTDP',
      protocol: 'matter'
    },
    {
      id: uuidv4(),
      name: '智能空调',
      type: 'ac',
      manufacturer: 'Mijia',
      model: 'KFR-35GW',
      protocol: 'miot'
    },
    {
      id: uuidv4(),
      name: '温湿度传感器',
      type: 'sensor',
      manufacturer: 'Aqara',
      model: 'WSDCGQ11LM',
      protocol: 'thread'
    }
  ];

  db.prepare('INSERT INTO operation_logs (id, user_id, module, action, details) VALUES (?, ?, ?, ?, ?)').run(
    uuidv4(),
    req.user!.id,
    'devices',
    'discover',
    JSON.stringify({ found: mockDevices.length })
  );

  res.json({ devices: mockDevices });
});

router.post('/:id/onboard', (req: AuthRequest, res) => {
  const deviceId = req.params.id;
  const { ssid, password } = req.body;

  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(deviceId);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  const now = Math.floor(Date.now() / 1000);

  db.prepare('UPDATE devices SET status = ?, online = ?, updated_at = ? WHERE id = ?').run(
    'online',
    1,
    now,
    deviceId
  );

  db.prepare('INSERT INTO device_logs (id, device_id, action, details, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    uuidv4(),
    deviceId,
    'onboard',
    JSON.stringify({ ssid: ssid || 'default-ssid' }),
    req.user!.id,
    now
  );

  res.json({ success: true, status: 'online' });
});

router.get('/:id/logs', (req: AuthRequest, res) => {
  const deviceId = req.params.id;
  const limit = parseInt(req.query.limit as string) || 50;

  const logs = db.prepare(`
    SELECT dl.*, u.username
    FROM device_logs dl
    LEFT JOIN users u ON dl.user_id = u.id
    WHERE dl.device_id = ?
    ORDER BY dl.created_at DESC
    LIMIT ?
  `).all(deviceId, limit);

  res.json(logs);
});

router.post('/:id/firmware-upgrade', (req: AuthRequest, res) => {
  const deviceId = req.params.id;
  const { firmware_id, version } = req.body;
  const now = Math.floor(Date.now() / 1000);

  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(deviceId);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  db.prepare('UPDATE devices SET firmware_version = ?, status = ?, updated_at = ? WHERE id = ?').run(
    version || '2.1.0',
    'upgrading',
    now,
    deviceId
  );

  db.prepare('INSERT INTO device_logs (id, device_id, action, details, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    uuidv4(),
    deviceId,
    'firmware_upgrade',
    JSON.stringify({ firmware_id, version: version || '2.1.0', from_version: device.firmware_version }),
    req.user!.id,
    now
  );

  setTimeout(() => {
    const ts = Math.floor(Date.now() / 1000);
    db.prepare('UPDATE devices SET status = ?, online = 1, updated_at = ? WHERE id = ?').run('online', ts, deviceId);
    db.prepare('INSERT INTO device_logs (id, device_id, action, details, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      uuidv4(), deviceId, 'firmware_upgrade_complete',
      JSON.stringify({ version: version || '2.1.0', success: true }),
      req.user!.id, ts
    );
  }, 5000);

  res.json({ success: true, message: 'Firmware upgrade initiated', version: version || '2.1.0' });
});

router.get('/:id/alerts', (req: AuthRequest, res) => {
  const deviceId = req.params.id;

  const alerts = db.prepare(`
    SELECT * FROM alerts
    WHERE device_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(deviceId);

  res.json(alerts);
});

export default router;
