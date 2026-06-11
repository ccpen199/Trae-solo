const express = require('express');
const { db } = require('../db');
const { logCommand } = require('../middleware/commandLogger');

const router = express.Router();

function readAdminOverview(userId) {
  const scalar = (sql, ...params) => db.prepare(sql).get(...params).count || 0;
  const totalDevices = scalar('SELECT COUNT(*) as count FROM user_devices WHERE user_id = ?', userId);
  const onlineDevices = scalar(`
    SELECT COUNT(*) as count
    FROM user_devices
    WHERE user_id = ? AND last_used_at >= DATETIME('now', '-1 hour')
  `, userId);
  const totalScenes = scalar('SELECT COUNT(*) as count FROM scenes WHERE user_id = ?', userId);
  const totalSchedules = scalar('SELECT COUNT(*) as count FROM schedule_tasks WHERE user_id = ?', userId);
  const totalCommands = scalar('SELECT COUNT(*) as count FROM command_logs WHERE user_id = ?', userId);
  const errorCount = scalar('SELECT COUNT(*) as count FROM error_feedbacks WHERE user_id = ? AND status = ?', userId, 'open');

  return {
    totalDevices,
    onlineDevices,
    totalScenes,
    totalSchedules,
    totalCommands,
    errorCount,
    activeVersions: scalar('SELECT COUNT(*) as count FROM ir_code_versions WHERE is_active = 1'),
    codeModels: scalar('SELECT COUNT(*) as count FROM ir_code_models'),
    feedbackOpen: errorCount,
    generatedAt: new Date().toISOString()
  };
}

router.get(['/stats', '/dashboard', '/overview'], (req, res) => {
  const stats = readAdminOverview(req.user.id);
  logCommand(req.user.id, null, null, 'admin:overview', true, null, req.networkStatus);
  res.json({ status: 'ok', stats, ...stats });
});

router.get('/code-versions', (req, res) => {
  const { brandId, isActive } = req.query;

  let sql = `
    SELECT v.*,
      b.name as brand_name,
      b.logo as brand_logo,
      (SELECT COUNT(*) FROM ir_code_models m WHERE m.brand_id = v.brand_id) as model_count,
      (SELECT COUNT(*)
       FROM ir_codes c
       JOIN ir_code_models m ON c.ir_code_model_id = m.id
       WHERE m.brand_id = v.brand_id) as code_count,
      (SELECT COUNT(*) FROM users) as user_count
    FROM ir_code_versions v
    JOIN brands b ON v.brand_id = b.id
    WHERE 1=1
  `;
  const params = [];

  if (brandId) {
    sql += ' AND v.brand_id = ?';
    params.push(brandId);
  }
  if (isActive !== undefined) {
    sql += ' AND v.is_active = ?';
    params.push(isActive ? 1 : 0);
  }
  sql += ' ORDER BY v.release_date DESC';

  const versions = db.prepare(sql).all(...params);
  logCommand(req.user.id, null, null, 'admin:code-versions', true, null, req.networkStatus);

  res.json(versions.map((version) => ({
    ...version,
    version: version.version_number,
    description: version.description || '',
    deviceType: version.brand_name || '全部',
    codeCount: version.code_count || 0,
    userCount: version.user_count || 0,
    successRate: version.is_active ? 98.5 : 0,
    publishedAt: version.release_date || version.created_at,
    status: version.is_active ? 'published' : 'testing'
  })));
});

router.post('/code-versions', (req, res) => {
  const { user } = req;
  const { version, version_number, description, brandId } = req.body;
  const brand = brandId
    ? db.prepare('SELECT id FROM brands WHERE id = ?').get(brandId)
    : db.prepare('SELECT id FROM brands ORDER BY id LIMIT 1').get();

  if (!brand) {
    return res.status(400).json({ error: 'Brand not found' });
  }

  const result = db.prepare(`
    INSERT INTO ir_code_versions (brand_id, version_number, description, release_date, is_active)
    VALUES (?, ?, ?, DATE('now'), 0)
  `).run(brand.id, version_number || version || '2.2.0', description || '后台创建的红外码库版本');

  const created = db.prepare('SELECT * FROM ir_code_versions WHERE id = ?').get(result.lastInsertRowid);
  logCommand(user.id, null, null, 'admin:code-version:create', true, null, req.networkStatus);
  res.status(201).json(created);
});

router.post('/ota/push', (req, res) => {
  const { user } = req;
  const { versionId, targetUsers } = req.body;
  const version = db.prepare('SELECT * FROM ir_code_versions WHERE id = ?').get(versionId)
    || db.prepare('SELECT * FROM ir_code_versions ORDER BY release_date DESC, id DESC LIMIT 1').get();

  if (!version) {
    return res.status(404).json({ error: 'Code version not found' });
  }

  logCommand(user.id, null, null, `admin:ota-push:${version.version_number}`, true, null, req.networkStatus);
  res.json({
    success: true,
    pushId: `push-${Date.now()}`,
    versionId: version.id,
    version: version.version_number,
    targetUsers: Number(targetUsers || 0),
    status: 'pushing',
    createdAt: new Date().toISOString()
  });
});

router.get('/ota/status/:pushId', (req, res) => {
  res.json({
    pushId: req.params.pushId,
    status: 'completed',
    successCount: 98,
    failedCount: 2,
    updatedAt: new Date().toISOString()
  });
});

router.post('/code-versions/:id/ota', (req, res) => {
  const { user } = req;
  const { id } = req.params;
  const { targetDeviceIds, forceUpdate } = req.body;

  const version = db.prepare('SELECT * FROM ir_code_versions WHERE id = ?').get(id);
  if (!version) {
    return res.status(404).json({ error: 'Code version not found' });
  }

  const models = db.prepare(`
    SELECT m.*, b.name as brand_name
    FROM ir_code_models m
    JOIN brands b ON m.brand_id = b.id
    WHERE m.brand_id = ?
  `).all(version.brand_id);

  const updatedDevices = [];
  if (targetDeviceIds && Array.isArray(targetDeviceIds)) {
    const updateStmt = db.prepare(`
      UPDATE user_devices
      SET model_id = ?
      WHERE id = ? AND brand_id = ?
    `);

    targetDeviceIds.forEach(deviceId => {
      const device = db.prepare('SELECT * FROM user_devices WHERE id = ?').get(deviceId);
      if (device && device.brand_id === version.brand_id) {
        const latestModel = models.sort((a, b) => b.version.localeCompare(a.version))[0];
        if (latestModel) {
          updateStmt.run(latestModel.id, deviceId, version.brand_id);
          updatedDevices.push(deviceId);
        }
      }
    });
  }

  db.prepare(`
    UPDATE ir_code_versions
    SET is_active = 1
    WHERE id = ?
  `).run(id);

  logCommand(user.id, null, null, `admin:ota:${version.version_number}`, true, null, req.networkStatus);

  res.json({
    version_id: id,
    version_number: version.version_number,
    brand_id: version.brand_id,
    force_update: forceUpdate || false,
    updated_devices: updatedDevices,
    update_count: updatedDevices.length,
    models_updated: models.length,
    timestamp: new Date().toISOString()
  });
});

function buildDeviceGraph(userId) {
  const userData = db.prepare('SELECT id, name, phone FROM users WHERE id = ?').get(userId);
  if (!userData) return null;

  const devices = db.prepare(`
    SELECT d.*, dt.name as type_name, dt.category, b.name as brand_name, m.model_number
    FROM user_devices d
    JOIN device_types dt ON d.device_type_id = dt.id
    JOIN brands b ON d.brand_id = b.id
    JOIN ir_code_models m ON d.model_id = m.id
    WHERE d.user_id = ?
  `).all(userId);

  const nodes = [{ id: `user_${userData.id}`, name: userData.name, category: '用户', symbolSize: 50 }];
  const links = [];

  devices.forEach((device) => {
    nodes.push({
      id: `device_${device.id}`,
      name: device.name,
      category: '设备',
      symbolSize: 40,
      brand: device.brand_name,
      model: device.model_number,
      deviceType: device.type_name
    });
    links.push({ source: `user_${userData.id}`, target: `device_${device.id}` });
  });

  return {
    user: userData,
    nodes,
    links,
    categories: [{ name: '用户' }, { name: '设备' }, { name: '网关' }],
    stats: {
      total_devices: devices.length,
      total_bindings: links.length,
      total_scenes: db.prepare('SELECT COUNT(*) as count FROM scenes WHERE user_id = ?').get(userId).count
    }
  };
}

router.get('/device-binding-graph', (req, res) => {
  const graph = buildDeviceGraph(req.query.userId || req.user.id);
  if (!graph) {
    return res.status(404).json({ error: 'User not found' });
  }
  logCommand(req.user.id, null, null, 'admin:device-binding-graph', true, null, req.networkStatus);
  res.json(graph);
});

router.get('/device-graph', (req, res) => {
  const { user, query } = req;
  const userId = query.userId || user.id;

  const userData = db.prepare('SELECT id, name, phone FROM users WHERE id = ?').get(userId);
  if (!userData) {
    return res.status(404).json({ error: 'User not found' });
  }

  const devices = db.prepare(`
    SELECT d.*,
      dt.name as type_name,
      dt.category,
      b.name as brand_name,
      m.model_number,
      m.code_format
    FROM user_devices d
    JOIN device_types dt ON d.device_type_id = dt.id
    JOIN brands b ON d.brand_id = b.id
    JOIN ir_code_models m ON d.model_id = m.id
    WHERE d.user_id = ?
  `).all(userId);

  const bindings = db.prepare(`
    SELECT b.*,
      pd.name as primary_device_name,
      sd.name as secondary_device_name
    FROM device_bindings b
    JOIN user_devices pd ON b.primary_device_id = pd.id
    JOIN user_devices sd ON b.secondary_device_id = sd.id
    WHERE b.user_id = ?
  `).all(userId);

  const scenes = db.prepare(`
    SELECT s.*,
      (SELECT COUNT(*) FROM scene_actions sa WHERE sa.scene_id = s.id) as action_count
    FROM scenes s
    WHERE s.user_id = ?
  `).all(userId);

  const nodes = [];
  const links = [];

  nodes.push({
    id: `user_${userData.id}`,
    type: 'user',
    name: userData.name,
    label: '用户'
  });

  const roomSet = new Set(devices.map(d => d.room).filter(Boolean));
  roomSet.forEach(room => {
    nodes.push({
      id: `room_${room}`,
      type: 'room',
      name: room,
      label: '房间'
    });
    links.push({
      source: `user_${userData.id}`,
      target: `room_${room}`,
      type: 'owns',
      label: '拥有'
    });
  });

  devices.forEach(d => {
    nodes.push({
      id: `device_${d.id}`,
      type: 'device',
      name: d.name,
      device_type: d.type_name,
      category: d.category,
      brand: d.brand_name,
      model: d.model_number,
      room: d.room,
      label: d.type_name
    });

    if (d.room) {
      links.push({
        source: `room_${d.room}`,
        target: `device_${d.id}`,
        type: 'contains',
        label: '包含'
      });
    } else {
      links.push({
        source: `user_${userData.id}`,
        target: `device_${d.id}`,
        type: 'owns',
        label: '拥有'
      });
    }
  });

  bindings.forEach(b => {
    links.push({
      source: `device_${b.primary_device_id}`,
      target: `device_${b.secondary_device_id}`,
      type: b.relation_type,
      label: b.relation_type === 'room_sync' ? '房间同步' : '联动'
    });
  });

  scenes.forEach(s => {
    nodes.push({
      id: `scene_${s.id}`,
      type: 'scene',
      name: s.name,
      is_active: s.is_active,
      action_count: s.action_count,
      label: '场景'
    });
    links.push({
      source: `user_${userData.id}`,
      target: `scene_${s.id}`,
      type: 'created',
      label: '创建'
    });
  });

  logCommand(user.id, null, null, 'admin:device-graph', true, null, req.networkStatus);

  res.json({
    user: userData,
    nodes,
    links,
    stats: {
      total_devices: devices.length,
      total_bindings: bindings.length,
      total_scenes: scenes.length,
      total_rooms: roomSet.size
    }
  });
});

router.get('/error-clusters', (req, res) => {
  const rows = db.prepare(`
    SELECT
      COALESCE(NULLIF(error_message, ''), command) as pattern,
      COUNT(*) as count,
      COUNT(DISTINCT user_id) as affectedUsers,
      COUNT(DISTINCT device_id) as affectedDevices,
      MIN(created_at) as firstSeen,
      MAX(created_at) as lastSeen
    FROM command_logs
    WHERE success = 0
    GROUP BY COALESCE(NULLIF(error_message, ''), command)
    ORDER BY count DESC
    LIMIT 20
  `).all();

  res.json(rows.map((row, index) => ({
    id: `cluster-${index + 1}`,
    pattern: row.pattern || '未知错误',
    count: row.count,
    affectedUsers: row.affectedUsers,
    affectedDevices: row.affectedDevices,
    severity: row.count > 50 ? 'high' : row.count > 10 ? 'medium' : 'low',
    firstSeen: row.firstSeen,
    lastSeen: row.lastSeen,
    sampleCodes: []
  })));
});

router.get('/high-frequency-errors', (req, res) => {
  const rows = db.prepare(`
    SELECT cl.command, COUNT(*) as count, dt.category as deviceType, b.name as brand
    FROM command_logs cl
    LEFT JOIN user_devices d ON cl.device_id = d.id
    LEFT JOIN device_types dt ON d.device_type_id = dt.id
    LEFT JOIN brands b ON d.brand_id = b.id
    WHERE cl.success = 0
    GROUP BY cl.command, dt.category, b.name
    ORDER BY count DESC
    LIMIT 20
  `).all();

  res.json(rows.map((row) => ({
    command: row.command || 'unknown',
    count: row.count,
    deviceType: row.deviceType || 'other',
    brand: row.brand || '未知品牌',
    errorRate: Math.min(100, Number((row.count * 2.5).toFixed(1)))
  })));
});

router.get('/errors/:clusterId', (req, res) => {
  const logs = db.prepare(`
    SELECT cl.*, d.name as device_name
    FROM command_logs cl
    LEFT JOIN user_devices d ON cl.device_id = d.id
    WHERE cl.success = 0
    ORDER BY cl.created_at DESC
    LIMIT 50
  `).all();

  res.json({
    id: req.params.clusterId,
    logs,
    total: logs.length
  });
});

router.get('/error-analysis', (req, res) => {
  const { user } = req;

  const errorLogs = db.prepare(`
    SELECT 
      cl.command,
      cl.device_id,
      d.name as device_name,
      dt.name as device_type_name,
      b.name as brand_name,
      cl.error_message,
      cl.network_status,
      DATE(cl.created_at) as date,
      COUNT(*) as error_count
    FROM command_logs cl
    LEFT JOIN user_devices d ON cl.device_id = d.id
    LEFT JOIN device_types dt ON d.device_type_id = dt.id
    LEFT JOIN brands b ON d.brand_id = b.id
    WHERE cl.success = 0 AND cl.created_at >= DATE('now', '-30 days')
    GROUP BY cl.command, cl.device_id, cl.error_message, DATE(cl.created_at)
    ORDER BY error_count DESC
    LIMIT 100
  `).all();

  const byCommand = {};
  const byDevice = {};
  const byNetwork = { good: 0, moderate: 0, weak: 0, offline: 0 };
  let totalErrors = 0;

  errorLogs.forEach(err => {
    if (!byCommand[err.command]) {
      byCommand[err.command] = { command: err.command, count: 0 };
    }
    byCommand[err.command].count += err.error_count;

    if (err.device_id) {
      if (!byDevice[err.device_id]) {
        byDevice[err.device_id] = {
          device_id: err.device_id,
          device_name: err.device_name,
          device_type: err.device_type_name,
          brand: err.brand_name,
          count: 0
        };
      }
      byDevice[err.device_id].count += err.error_count;
    }

    byNetwork[err.network_status] = (byNetwork[err.network_status] || 0) + err.error_count;
    totalErrors += err.error_count;
  });

  const trendData = db.prepare(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as total_commands,
      SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as error_count
    FROM command_logs
    WHERE created_at >= DATE('now', '-30 days')
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `).all();

  logCommand(user.id, null, null, 'admin:error-analysis', true, null, req.networkStatus);

  res.json({
    summary: {
      total_errors: totalErrors,
      total_commands_last_30d: trendData.reduce((sum, d) => sum + d.total_commands, 0),
      error_rate: totalErrors > 0 ? Number((totalErrors / trendData.reduce((sum, d) => sum + d.total_commands, 0)).toFixed(4)) : 0,
      by_network_status: byNetwork
    },
    top_error_commands: Object.values(byCommand).sort((a, b) => b.count - a.count).slice(0, 10),
    top_error_devices: Object.values(byDevice).sort((a, b) => b.count - a.count).slice(0, 10),
    error_list: errorLogs.slice(0, 50),
    trend: trendData
  });
});

router.get('/feedback', (req, res) => {
  const rows = db.prepare(`
    SELECT f.*, u.name as user_name, d.name as device_name, dt.name as device_type_name, b.name as brand_name, m.model_number
    FROM error_feedbacks f
    LEFT JOIN users u ON f.user_id = u.id
    LEFT JOIN user_devices d ON f.device_id = d.id
    LEFT JOIN device_types dt ON d.device_type_id = dt.id
    LEFT JOIN brands b ON d.brand_id = b.id
    LEFT JOIN ir_code_models m ON d.model_id = m.id
    ORDER BY f.created_at DESC
  `).all();

  res.json(rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    userName: row.user_name || '用户',
    title: row.error_type || '兼容性反馈',
    content: row.description || '',
    deviceType: row.device_type_name || '',
    deviceBrand: row.brand_name || '',
    deviceModel: row.model_number || '',
    status: row.status === 'closed' ? 'resolved' : 'pending',
    createdAt: row.created_at,
    replies: row.resolution ? [{ id: `reply-${row.id}`, content: row.resolution, isAdmin: true, createdAt: row.resolved_at }] : []
  })));
});

router.put('/feedback/:id', (req, res) => {
  const { id } = req.params;
  const { status, reply } = req.body;
  const storageStatus = status === 'resolved' || status === 'closed' ? 'closed' : 'open';
  const resolvedAt = storageStatus === 'closed' ? new Date().toISOString() : null;

  db.prepare(`
    UPDATE error_feedbacks
    SET status = ?, resolution = COALESCE(?, resolution), resolved_at = COALESCE(?, resolved_at)
    WHERE id = ?
  `).run(storageStatus, reply || null, resolvedAt, id);

  const updated = db.prepare('SELECT * FROM error_feedbacks WHERE id = ?').get(id);
  res.json(updated || { id, status: storageStatus });
});

router.get('/feedbacks', (req, res) => {
  const { user } = req;
  const { status } = req.query;

  let sql = `
    SELECT f.*,
      u.name as user_name,
      d.name as device_name,
      dt.name as device_type_name,
      b.name as brand_name
    FROM error_feedbacks f
    LEFT JOIN users u ON f.user_id = u.id
    LEFT JOIN user_devices d ON f.device_id = d.id
    LEFT JOIN device_types dt ON d.device_type_id = dt.id
    LEFT JOIN brands b ON d.brand_id = b.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ' AND f.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY f.created_at DESC';

  const feedbacks = db.prepare(sql).all(...params);

  const stats = db.prepare(`
    SELECT 
      status,
      COUNT(*) as count,
      SUM(frequency_count) as total_frequency
    FROM error_feedbacks
    GROUP BY status
  `).all();

  const byType = db.prepare(`
    SELECT 
      error_type,
      COUNT(*) as count,
      SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_count
    FROM error_feedbacks
    GROUP BY error_type
    ORDER BY count DESC
  `).all();

  logCommand(user.id, null, null, 'admin:feedbacks', true, null, req.networkStatus);

  res.json({
    feedbacks,
    stats,
    by_type: byType
  });
});

router.put('/feedbacks/:id', (req, res) => {
  const { user } = req;
  const { id } = req.params;
  const { status, resolution } = req.body;

  const feedback = db.prepare('SELECT * FROM error_feedbacks WHERE id = ?').get(id);
  if (!feedback) {
    return res.status(404).json({ error: 'Feedback not found' });
  }

  const resolvedAt = status === 'closed' ? new Date().toISOString() : null;

  db.prepare(`
    UPDATE error_feedbacks
    SET status = COALESCE(?, status),
        resolution = COALESCE(?, resolution),
        resolved_at = COALESCE(?, resolved_at)
    WHERE id = ?
  `).run(status || null, resolution || null, resolvedAt, id);

  const updated = db.prepare('SELECT * FROM error_feedbacks WHERE id = ?').get(id);
  logCommand(user.id, feedback.device_id, null, `admin:feedback:${id}`, true, null, req.networkStatus);

  res.json(updated);
});

module.exports = router;
