import express from 'express';
import db from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware.js';

const router = express.Router();

router.get('/stats/overview', authenticateToken, (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM devices').get().count;
  const online = db.prepare("SELECT COUNT(*) as count FROM devices WHERE status = 'online'").get().count;
  const offline = db.prepare("SELECT COUNT(*) as count FROM devices WHERE status = 'offline'").get().count;
  const running = db.prepare("SELECT COUNT(*) as count FROM devices WHERE status = 'running'").get().count;
  
  const buildingStats = db.prepare(`
    SELECT building, 
           COUNT(*) as total,
           SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online_count,
           SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) as offline_count,
           SUM(CASE WHEN fault_code IS NOT NULL AND fault_code != '' THEN 1 ELSE 0 END) as fault_count
    FROM devices GROUP BY building
  `).all();
  
  const offlineDevices = db.prepare(`
    SELECT id, name, building, location, fault_code, last_online, updated_at
    FROM devices WHERE status = 'offline'
    ORDER BY updated_at ASC
  `).all();
  
  res.json({
    total, online, offline, running,
    onlineRate: total > 0 ? ((online + running) / total * 100).toFixed(1) : 0,
    buildingStats,
    offlineDevices
  });
});

router.get('/', authenticateToken, (req, res) => {
  const { building, status, page = 1, pageSize = 20 } = req.query;
  
  let query = 'SELECT * FROM devices WHERE 1=1';
  const params = [];
  
  if (building) {
    query += ' AND building = ?';
    params.push(building);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
  
  const devices = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM devices WHERE 1=1' + 
    (building ? ' AND building = ?' : '') + 
    (status ? ' AND status = ?' : '')
  ).get(...params.slice(0, params.length - 2));
  
  res.json({ devices, total: total.count });
});

router.get('/:id', authenticateToken, (req, res) => {
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
  if (!device) {
    return res.status(404).json({ error: '设备不存在' });
  }
  res.json(device);
});

router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const { id, name, location, building, floor, bluetooth_mac, nfc_id } = req.body;
  
  try {
    db.prepare(`
      INSERT INTO devices (id, name, location, building, floor, status, bluetooth_mac, nfc_id)
      VALUES (?, ?, ?, ?, ?, 'offline', ?, ?)
    `).run(id, name, location, building, floor || 1, bluetooth_mac, nfc_id);
    
    const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
    res.status(201).json(device);
  } catch (err) {
    res.status(400).json({ error: '创建设备失败', message: err.message });
  }
});

router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { name, location, building, floor, status, fault_code, bluetooth_mac, nfc_id } = req.body;
  
  db.prepare(`
    UPDATE devices 
    SET name = ?, location = ?, building = ?, floor = ?, status = ?, 
        fault_code = ?, bluetooth_mac = ?, nfc_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, location, building, floor, status, fault_code, bluetooth_mac, nfc_id, req.params.id);
  
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
  res.json(device);
});

router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM devices WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: '设备不存在' });
  }
  res.json({ message: '设备已删除' });
});

router.get('/:id/realtime', authenticateToken, (req, res) => {
  const data = db.prepare(`
    SELECT * FROM realtime_data 
    WHERE device_id = ? 
    ORDER BY timestamp DESC 
    LIMIT 1
  `).get(req.params.id);
  if (!data) {
    return res.json({ temperature: null, flow_rate: null, cumulative_volume: null, is_running: 0, is_full_flow: 0 });
  }
  res.json(data);
});

router.post('/:id/realtime', (req, res) => {
  const { temperature, flow_rate, cumulative_volume, is_running } = req.body;
  
  db.prepare(`
    INSERT INTO realtime_data (device_id, temperature, flow_rate, cumulative_volume, is_running)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, temperature, flow_rate, cumulative_volume, is_running ? 1 : 0);
  
  db.prepare(`
    UPDATE devices 
    SET status = ?, last_online = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(is_running ? 'running' : 'online', req.params.id);
  
  res.json({ success: true });
});

router.get('/stats/overview', authenticateToken, requireAdmin, (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM devices').get().count;
  const online = db.prepare("SELECT COUNT(*) as count FROM devices WHERE status = 'online' OR status = 'running'").get().count;
  const offline = db.prepare("SELECT COUNT(*) as count FROM devices WHERE status = 'offline'").get().count;
  const running = db.prepare("SELECT COUNT(*) as count FROM devices WHERE status = 'running'").get().count;
  const faulty = db.prepare('SELECT COUNT(*) as count FROM devices WHERE fault_code IS NOT NULL').get().count;
  
  const faultDistribution = db.prepare(`
    SELECT fault_code, COUNT(*) as count 
    FROM devices 
    WHERE fault_code IS NOT NULL 
    GROUP BY fault_code
  `).all();
  
  const buildingStats = db.prepare(`
    SELECT building, 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'online' OR status = 'running' THEN 1 ELSE 0 END) as online
    FROM devices 
    GROUP BY building
  `).all();
  
  res.json({
    total,
    online,
    offline,
    running,
    faulty,
    offlineRate: total > 0 ? (offline / total * 100).toFixed(2) : 0,
    faultDistribution,
    buildingStats
  });
});

export default router;
