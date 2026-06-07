const express = require('express');
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

router.get('/', (req, res) => {
  const homes = db.prepare('SELECT * FROM homes ORDER BY created_at DESC').all();
  res.json({ success: true, data: homes });
});

router.get('/:homeId/rooms', (req, res) => {
  const rooms = db.prepare(`
    SELECT r.*, 
      (SELECT COUNT(*) FROM devices d WHERE d.room_id = r.id) as device_count,
      (SELECT COALESCE(SUM(total_consumption), 0) FROM energy_meters em WHERE em.room_id = r.id) as energy_usage
    FROM rooms r 
    WHERE home_id = ? 
    ORDER BY topology_order ASC
  `).all(req.params.homeId);
  
  const roomTree = buildRoomTree(rooms);
  res.json({ success: true, data: roomTree });
});

function buildRoomTree(rooms, parentId = null) {
  return rooms
    .filter(r => r.parent_id === parentId)
    .map(r => ({
      ...r,
      children: buildRoomTree(rooms, r.id)
    }));
}

router.post('/:homeId/rooms', (req, res) => {
  const { name, parentId, topologyOrder } = req.body;
  const id = `room-${uuidv4().slice(0, 8)}`;
  const now = Date.now();
  
  db.prepare(`
    INSERT INTO rooms (id, home_id, name, parent_id, topology_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.params.homeId, name, parentId || null, topologyOrder || 0, now, now);
  
  res.json({ success: true, data: { id } });
});

router.put('/rooms/:roomId', (req, res) => {
  const { name, topologyOrder } = req.body;
  const now = Date.now();
  
  db.prepare('UPDATE rooms SET name = ?, topology_order = ?, updated_at = ? WHERE id = ?')
    .run(name, topologyOrder, now, req.params.roomId);
  
  res.json({ success: true });
});

router.delete('/rooms/:roomId', (req, res) => {
  db.prepare('DELETE FROM rooms WHERE id = ?').run(req.params.roomId);
  res.json({ success: true });
});

router.get('/:homeId/topology', (req, res) => {
  const rooms = db.prepare('SELECT * FROM rooms WHERE home_id = ?').all(req.params.homeId);
  const devices = db.prepare('SELECT id, name, room_id, status FROM devices').all();
  
  const topology = {
    homeId: req.params.homeId,
    rooms: rooms.map(r => ({
      ...r,
      devices: devices.filter(d => d.room_id === r.id)
    }))
  };
  
  res.json({ success: true, data: topology });
});

router.post('/groups', (req, res) => {
  const { roomId, name, strategy } = req.body;
  const id = `group-${uuidv4().slice(0, 8)}`;
  const now = Date.now();
  
  db.prepare(`
    INSERT INTO device_groups (id, room_id, name, strategy, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, roomId || null, name, JSON.stringify(strategy || {}), now);
  
  res.json({ success: true, data: { id } });
});

router.get('/groups/:roomId?', (req, res) => {
  let query = 'SELECT * FROM device_groups';
  const params = [];
  
  if (req.params.roomId) {
    query += ' WHERE room_id = ?';
    params.push(req.params.roomId);
  }
  
  const groups = db.prepare(query).all(...params).map(g => ({
    ...g,
    strategy: JSON.parse(g.strategy || '{}')
  }));
  
  res.json({ success: true, data: groups });
});

router.post('/groups/:groupId/members', (req, res) => {
  const { deviceId } = req.body;
  const now = Date.now();
  
  db.prepare(`
    INSERT OR IGNORE INTO device_group_members (group_id, device_id, joined_at)
    VALUES (?, ?, ?)
  `).run(req.params.groupId, deviceId, now);
  
  res.json({ success: true });
});

router.delete('/groups/:groupId/members/:deviceId', (req, res) => {
  db.prepare('DELETE FROM device_group_members WHERE group_id = ? AND device_id = ?')
    .run(req.params.groupId, req.params.deviceId);
  
  res.json({ success: true });
});

module.exports = router;
