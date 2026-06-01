require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 44850;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:45850',
  credentials: true
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/user/state', (req, res) => {
  const state = db.prepare('SELECT * FROM user_state WHERE user_id = ?').get('default');
  res.json({ success: true, data: state });
});

app.post('/api/user/guide-complete', (req, res) => {
  db.prepare('UPDATE user_state SET guide_shown = 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run('default');
  db.prepare('INSERT INTO analytics (event_type, data) VALUES (?, ?)').run('guide_complete', JSON.stringify({}));
  res.json({ success: true });
});

app.get('/api/devices/templates', (req, res) => {
  const templates = db.prepare('SELECT * FROM device_templates WHERE is_enabled = 1 ORDER BY sort_order').all();
  templates.forEach(t => {
    t.default_config = JSON.parse(t.default_config);
  });
  res.json({ success: true, data: templates });
});

app.get('/api/devices', (req, res) => {
  const devices = db.prepare(`
    SELECT d.*, v.animation_data, v.last_run_result, v.is_playing, dt.icon, dt.animation_duration
    FROM devices d
    LEFT JOIN virtual_devices v ON d.device_id = v.device_id
    LEFT JOIN device_templates dt ON v.template_id = dt.template_id
    ORDER BY d.is_virtual DESC, d.position ASC, d.created_at ASC
  `).all();

  devices.forEach(d => {
    if (d.config) d.config = JSON.parse(d.config);
    if (d.animation_data) d.animation_data = JSON.parse(d.animation_data);
    if (d.last_run_result) d.last_run_result = JSON.parse(d.last_run_result);
  });

  res.json({ success: true, data: devices });
});

app.post('/api/devices/virtual/:templateId', (req, res) => {
  const { templateId } = req.params;
  const template = db.prepare('SELECT * FROM device_templates WHERE template_id = ?').get(templateId);
  
  if (!template) {
    return res.status(404).json({ success: false, error: 'Template not found' });
  }

  const deviceId = `virtual-${Date.now()}`;
  const config = JSON.parse(template.default_config);

  db.prepare(`
    INSERT INTO devices (device_id, name, type, category, is_virtual, status, config, position)
    VALUES (?, ?, ?, ?, 1, 'online', ?, 0)
  `).run(deviceId, template.name, template.type, 'virtual', JSON.stringify(config));

  db.prepare(`
    INSERT INTO virtual_devices (device_id, template_id, animation_data)
    VALUES (?, ?, ?)
  `).run(deviceId, templateId, JSON.stringify({ frame: 0, totalFrames: template.animation_duration * 30 }));

  db.prepare('INSERT INTO analytics (event_type, device_id, data) VALUES (?, ?, ?)').run(
    'device_added',
    deviceId,
    JSON.stringify({ templateId, name: template.name })
  );

  const device = db.prepare(`
    SELECT d.*, v.animation_data, v.last_run_result, v.is_playing, dt.icon, dt.animation_duration
    FROM devices d
    LEFT JOIN virtual_devices v ON d.device_id = v.device_id
    LEFT JOIN device_templates dt ON v.template_id = dt.template_id
    WHERE d.device_id = ?
  `).get(deviceId);

  device.config = JSON.parse(device.config);
  device.animation_data = JSON.parse(device.animation_data);

  res.json({ success: true, data: device });
});

app.delete('/api/devices/:deviceId', (req, res) => {
  const { deviceId } = req.params;
  const device = db.prepare('SELECT * FROM devices WHERE device_id = ?').get(deviceId);
  
  if (!device) {
    return res.status(404).json({ success: false, error: 'Device not found' });
  }

  db.prepare('DELETE FROM virtual_devices WHERE device_id = ?').run(deviceId);
  db.prepare('DELETE FROM devices WHERE device_id = ?').run(deviceId);
  
  db.prepare('INSERT INTO analytics (event_type, device_id, data) VALUES (?, ?, ?)').run(
    'device_deleted',
    deviceId,
    JSON.stringify({ name: device.name, is_virtual: device.is_virtual })
  );

  res.json({ success: true });
});

app.post('/api/devices/:deviceId/run', (req, res) => {
  const { deviceId } = req.params;
  const device = db.prepare('SELECT * FROM devices WHERE device_id = ?').get(deviceId);
  
  if (!device || !device.is_virtual) {
    return res.status(404).json({ success: false, error: 'Virtual device not found' });
  }

  db.prepare('UPDATE virtual_devices SET is_playing = 1 WHERE device_id = ?').run(deviceId);
  db.prepare('INSERT INTO analytics (event_type, device_id, data) VALUES (?, ?, ?)').run(
    'device_run_start',
    deviceId,
    JSON.stringify({})
  );

  res.json({ success: true });
});

app.post('/api/devices/:deviceId/pause', (req, res) => {
  const { deviceId } = req.params;
  db.prepare('UPDATE virtual_devices SET is_playing = 0 WHERE device_id = ?').run(deviceId);
  res.json({ success: true });
});

app.post('/api/devices/:deviceId/complete', (req, res) => {
  const { deviceId, result } = req.body;
  db.prepare('UPDATE virtual_devices SET is_playing = 0, last_run_result = ? WHERE device_id = ?').run(
    JSON.stringify(result),
    deviceId
  );
  db.prepare('INSERT INTO analytics (event_type, device_id, data) VALUES (?, ?, ?)').run(
    'device_run_complete',
    deviceId,
    JSON.stringify(result)
  );
  res.json({ success: true });
});

app.post('/api/devices/:deviceId/purchase', (req, res) => {
  const { deviceId } = req.params;
  const device = db.prepare('SELECT * FROM devices WHERE device_id = ?').get(deviceId);
  
  db.prepare('INSERT INTO analytics (event_type, device_id, data) VALUES (?, ?, ?)').run(
    'purchase_click',
    deviceId,
    JSON.stringify({ name: device.name })
  );

  res.json({ success: true, data: { url: 'https://www.mi.com/buy' } });
});

app.get('/api/scenes', (req, res) => {
  const scenes = db.prepare('SELECT * FROM scenes ORDER BY is_recommended DESC, created_at ASC').all();
  scenes.forEach(s => {
    if (s.devices) s.devices = JSON.parse(s.devices);
    if (s.config) s.config = JSON.parse(s.config);
  });
  res.json({ success: true, data: scenes });
});

app.post('/api/scenes/:sceneId/devices/:deviceId', (req, res) => {
  const { sceneId, deviceId } = req.params;
  const scene = db.prepare('SELECT * FROM scenes WHERE scene_id = ?').get(sceneId);
  
  if (!scene) {
    return res.status(404).json({ success: false, error: 'Scene not found' });
  }

  let devices = JSON.parse(scene.devices || '[]');
  if (!devices.includes(deviceId)) {
    devices.push(deviceId);
    db.prepare('UPDATE scenes SET devices = ?, updated_at = CURRENT_TIMESTAMP WHERE scene_id = ?').run(
      JSON.stringify(devices),
      sceneId
    );
  }

  db.prepare('INSERT INTO analytics (event_type, scene_id, device_id, data) VALUES (?, ?, ?, ?)').run(
    'device_added_to_scene',
    sceneId,
    deviceId,
    JSON.stringify({})
  );

  res.json({ success: true });
});

app.post('/api/scenes/:sceneId/run', (req, res) => {
  const { sceneId } = req.params;
  db.prepare('INSERT INTO analytics (event_type, scene_id, data) VALUES (?, ?, ?)').run(
    'scene_run',
    sceneId,
    JSON.stringify({})
  );
  res.json({ success: true });
});

app.delete('/api/scenes/:sceneId/devices/:deviceId', (req, res) => {
  const { sceneId, deviceId } = req.params;
  const scene = db.prepare('SELECT * FROM scenes WHERE scene_id = ?').get(sceneId);
  
  let devices = JSON.parse(scene.devices || '[]');
  devices = devices.filter(d => d !== deviceId);
  
  db.prepare('UPDATE scenes SET devices = ?, updated_at = CURRENT_TIMESTAMP WHERE scene_id = ?').run(
    JSON.stringify(devices),
    sceneId
  );

  res.json({ success: true });
});

app.get('/api/analytics', (req, res) => {
  const totalDevices = db.prepare('SELECT COUNT(*) as count FROM devices WHERE is_virtual = 1').get();
  const totalRuns = db.prepare('SELECT COUNT(*) as count FROM analytics WHERE event_type = ?').get('device_run_complete');
  const totalSceneRuns = db.prepare('SELECT COUNT(*) as count FROM analytics WHERE event_type = ?').get('scene_run');
  const totalDeleted = db.prepare('SELECT COUNT(*) as count FROM analytics WHERE event_type = ?').get('device_deleted');
  const purchaseClicks = db.prepare('SELECT COUNT(*) as count FROM analytics WHERE event_type = ?').get('purchase_click');

  const recentEvents = db.prepare('SELECT * FROM analytics ORDER BY created_at DESC LIMIT 20').all();
  recentEvents.forEach(e => {
    if (e.data) e.data = JSON.parse(e.data);
  });

  res.json({
    success: true,
    data: {
      summary: {
        virtualDevicesAdded: totalDevices.count,
        deviceRuns: totalRuns.count,
        sceneRuns: totalSceneRuns.count,
        devicesDeleted: totalDeleted.count,
        purchaseClicks: purchaseClicks.count
      },
      recentEvents
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Smart Home Backend running on http://localhost:${PORT}`);
});
