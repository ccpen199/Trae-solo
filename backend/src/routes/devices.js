const express = require('express');
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

router.get('/', (req, res) => {
  const { roomId, status, protocol } = req.query;
  
  let query = 'SELECT * FROM devices WHERE 1=1';
  const params = [];
  
  if (roomId) {
    query += ' AND room_id = ?';
    params.push(roomId);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (protocol) {
    query += ' AND protocol = ?';
    params.push(protocol);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const devices = db.prepare(query).all(...params).map(d => ({
    ...d,
    capability_schema: JSON.parse(d.capability_schema || '{}')
  }));
  
  res.json({ success: true, data: devices });
});

router.get('/:id', (req, res) => {
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
  
  if (!device) {
    return res.status(404).json({ success: false, error: 'Device not found' });
  }
  
  device.capability_schema = JSON.parse(device.capability_schema || '{}');
  res.json({ success: true, data: device });
});

router.post('/', (req, res) => {
  const { name, vendorId, firmwareVersion, protocol, capabilitySchema, roomId } = req.body;
  const id = `dev-${uuidv4().slice(0, 8)}`;
  const now = Date.now();
  
  db.prepare(`
    INSERT INTO devices (id, name, vendor_id, firmware_version, protocol, capability_schema, status, last_heartbeat, room_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'online', ?, ?, ?, ?)
  `).run(id, name, vendorId, firmwareVersion, protocol, JSON.stringify(capabilitySchema || {}), now, roomId || null, now, now);
  
  db.prepare('INSERT INTO device_heartbeats (device_id, timestamp, status, metrics) VALUES (?, ?, ?, ?)')
    .run(id, now, 'online', '{}');
  
  res.json({ success: true, data: { id } });
});

router.put('/:id', (req, res) => {
  const { name, status, roomId, firmwareVersion } = req.body;
  const now = Date.now();
  
  const updates = [];
  const params = [];
  
  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }
  if (roomId !== undefined) { updates.push('room_id = ?'); params.push(roomId); }
  if (firmwareVersion !== undefined) { updates.push('firmware_version = ?'); params.push(firmwareVersion); }
  
  updates.push('updated_at = ?');
  params.push(now, req.params.id);
  
  if (updates.length > 1) {
    db.prepare(`UPDATE devices SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  
  res.json({ success: true });
});

router.post('/:id/heartbeat', (req, res) => {
  const { status = 'online', metrics = {} } = req.body;
  const now = Date.now();
  
  db.prepare('UPDATE devices SET status = ?, last_heartbeat = ?, updated_at = ? WHERE id = ?')
    .run(status, now, now, req.params.id);
  
  db.prepare('INSERT INTO device_heartbeats (device_id, timestamp, status, metrics) VALUES (?, ?, ?, ?)')
    .run(req.params.id, now, status, JSON.stringify(metrics));
  
  res.json({ success: true, timestamp: now });
});

router.post('/:id/control', (req, res) => {
  const { action } = req.body;
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
  
  if (!device) {
    return res.status(404).json({ success: false, error: 'Device not found' });
  }
  
  console.log(`[Device Control] ${device.id}:`, action);
  
  const now = Date.now();
  let targetStatus = device.status;
  
  if (action && typeof action.power === 'boolean') {
    targetStatus = action.power ? 'online' : 'offline';
    db.prepare('UPDATE devices SET status = ?, last_heartbeat = ?, updated_at = ? WHERE id = ?')
      .run(targetStatus, now, now, req.params.id);
    
    db.prepare('INSERT INTO device_heartbeats (device_id, timestamp, status, metrics) VALUES (?, ?, ?, ?)')
      .run(req.params.id, now, targetStatus, JSON.stringify({ action, manual_control: true }));
    
    db.prepare('INSERT INTO device_health_logs (device_id, status_change, health_score, timestamp) VALUES (?, ?, ?, ?)')
      .run(req.params.id, `${device.status} → ${targetStatus}`, targetStatus === 'online' ? 100 : 50, now);
  }
  
  const updatedDevice = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
  updatedDevice.capability_schema = JSON.parse(updatedDevice.capability_schema || '{}');
  
  res.json({ 
    success: true, 
    data: { 
      deviceId: req.params.id, 
      action, 
      executed: true,
      timestamp: now,
      previousStatus: device.status,
      currentStatus: targetStatus,
      device: updatedDevice
    } 
  });
});

router.post('/discover', (req, res) => {
  const { protocol = 'all' } = req.body;
  const protocols = protocol === 'all' ? ['matter', 'thread', 'zigbee', 'wifi'] : [protocol];
  
  const discovered = [];
  const handshakeResults = [];
  const now = Date.now();
  
  const vendorMap = {
    matter: { name: 'Matter联盟厂商', prefix: 'MTR' },
    thread: { name: 'Thread认证厂商', prefix: 'THR' },
    zigbee: { name: 'Zigbee联盟厂商', prefix: 'ZIG' },
    wifi: { name: 'Wi-Fi联盟厂商', prefix: 'WIFI' }
  };
  
  const deviceTemplates = {
    matter: [
      { name: '智能网关 Pro', type: 'gateway', properties: { power: { type: 'boolean' }, connectivity: { type: 'string' }, nodes: { type: 'number' } } },
      { name: '智能门锁', type: 'lock', properties: { power: { type: 'boolean' }, locked: { type: 'boolean' }, battery: { type: 'number' } } }
    ],
    thread: [
      { name: '温湿度传感器', type: 'sensor', properties: { power: { type: 'boolean' }, temperature: { type: 'number' }, humidity: { type: 'number' } } },
      { name: '智能窗帘', type: 'curtain', properties: { power: { type: 'boolean' }, position: { type: 'number' }, autoMode: { type: 'boolean' } } }
    ],
    zigbee: [
      { name: '人体感应器', type: 'motion', properties: { power: { type: 'boolean' }, detected: { type: 'boolean' }, sensitivity: { type: 'string' } } },
      { name: '烟雾报警器', type: 'smoke', properties: { power: { type: 'boolean' }, alarm: { type: 'boolean' }, battery: { type: 'number' } } }
    ],
    wifi: [
      { name: '智能音箱', type: 'speaker', properties: { power: { type: 'boolean' }, volume: { type: 'number' }, playing: { type: 'boolean' } } },
      { name: '空气净化器', type: 'purifier', properties: { power: { type: 'boolean' }, pm25: { type: 'number' }, mode: { type: 'string' } } }
    ]
  };
  
  protocols.forEach(p => {
    const templates = deviceTemplates[p] || [];
    templates.forEach((tpl, i) => {
      const deviceId = `disc-${p}-${uuidv4().slice(0, 8)}`;
      const vendorInfo = vendorMap[p];
      const vendorId = `${vendorInfo.prefix}-${uuidv4().slice(0, 6).toUpperCase()}`;
      
      const handshake = {
        deviceId,
        protocol: p,
        steps: [
          { step: '广播发现', status: 'success', duration: Math.random() * 100 + 50 },
          { step: '协议握手', status: 'success', duration: Math.random() * 150 + 100 },
          { step: '能力协商', status: 'success', duration: Math.random() * 200 + 100 },
          { step: '安全认证', status: 'success', duration: Math.random() * 300 + 200 }
        ],
        totalTime: Math.random() * 800 + 400,
        signalStrength: Math.round(Math.random() * 40 + 60)
      };
      
      handshakeResults.push(handshake);
      
      discovered.push({
        id: deviceId,
        name: tpl.name,
        type: tpl.type,
        protocol: p,
        vendorId,
        vendorName: vendorInfo.name,
        firmwareVersion: `${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
        discoveredAt: now,
        signalStrength: handshake.signalStrength,
        handshakeDuration: Math.round(handshake.totalTime),
        securityLevel: p === 'matter' ? 'high' : p === 'zigbee' ? 'medium' : 'standard',
        capability_schema: {
          type: 'object',
          $schema: 'http://json-schema.org/draft-07/schema#',
          title: tpl.name,
          description: `${tpl.name} 设备能力描述`,
          properties: tpl.properties,
          required: ['power']
        },
        alreadyPaired: false
      });
    });
  });
  
  const byProtocol = {};
  protocols.forEach(p => { byProtocol[p] = discovered.filter(d => d.protocol === p).length; });
  
  res.json({ 
    success: true, 
    data: {
      found: discovered.length,
      byProtocol,
      devices: discovered,
      handshakeResults,
      scanDuration: Math.round(Math.random() * 2000 + 1000),
      existingDevicesUnaffected: true
    }
  });
});

router.get('/:id/heartbeats', (req, res) => {
  const { limit = 50 } = req.query;
  const heartbeats = db.prepare(`
    SELECT * FROM device_heartbeats 
    WHERE device_id = ? 
    ORDER BY timestamp DESC 
    LIMIT ?
  `).all(req.params.id, parseInt(limit)).map(h => ({
    ...h,
    metrics: JSON.parse(h.metrics || '{}')
  }));
  
  res.json({ success: true, data: heartbeats });
});

module.exports = router;
