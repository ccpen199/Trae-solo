const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const { success, error, wrapAsync } = require('../utils/response');

const router = express.Router();

router.get('/', wrapAsync(async (req, res) => {
  const homes = db.prepare('SELECT * FROM homes ORDER BY createdAt DESC').all();
  res.json(success(homes));
}));

router.get('/:id', wrapAsync(async (req, res) => {
  const { id } = req.params;
  const home = db.prepare('SELECT * FROM homes WHERE id = ?').get(id);
  
  if (!home) {
    return res.status(404).json(error('家庭不存在'));
  }
  
  const deviceCount = db.prepare('SELECT COUNT(*) as count FROM devices WHERE homeId = ?').get(id).count;
  const roomCount = db.prepare('SELECT COUNT(*) as count FROM rooms WHERE homeId = ?').get(id).count;
  
  res.json(success({ ...home, deviceCount, roomCount }));
}));

router.get('/:id/detail', wrapAsync(async (req, res) => {
  const { id } = req.params;
  const home = db.prepare('SELECT * FROM homes WHERE id = ?').get(id);
  
  if (!home) {
    return res.status(404).json(error('家庭不存在'));
  }
  
  const rooms = db.prepare('SELECT * FROM rooms WHERE homeId = ? ORDER BY sortOrder ASC').all(id);
  const devices = db.prepare('SELECT * FROM devices WHERE homeId = ? ORDER BY createdAt DESC').all(id);
  
  const devicesWithState = devices.map(d => ({
    ...d,
    capabilities: d.capabilities ? JSON.parse(d.capabilities) : {},
    state: d.state ? JSON.parse(d.state) : {},
  }));
  
  res.json(success({
    home,
    rooms,
    devices: devicesWithState,
  }));
}));

router.post('/', wrapAsync(async (req, res) => {
  const { name, location = '', wallpaper = '' } = req.body;
  
  if (!name?.trim()) {
    return res.status(400).json(error('家庭名称不能为空'));
  }
  
  const id = `home-${Date.now()}`;
  const now = Date.now();
  
  db.prepare(`
    INSERT INTO homes (id, name, location, wallpaper, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name.trim(), location, wallpaper, now, now);
  
  const defaultRooms = ['客厅', '卧室', '厨房', '卫生间'];
  const insertRoom = db.prepare('INSERT INTO rooms (id, homeId, name, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)');
  
  defaultRooms.forEach((roomName, index) => {
    insertRoom.run(`room-${Date.now()}-${index}`, id, roomName, index, now, now);
  });
  
  const home = db.prepare('SELECT * FROM homes WHERE id = ?').get(id);
  res.json(success(home, '家庭创建成功'));
}));

router.put('/:id', wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { name, location, wallpaper } = req.body;
  
  const home = db.prepare('SELECT * FROM homes WHERE id = ?').get(id);
  if (!home) {
    return res.status(404).json(error('家庭不存在'));
  }
  
  const now = Date.now();
  db.prepare(`
    UPDATE homes 
    SET name = COALESCE(?, name),
        location = COALESCE(?, location),
        wallpaper = COALESCE(?, wallpaper),
        updatedAt = ?
    WHERE id = ?
  `).run(name, location, wallpaper, now, id);
  
  const updatedHome = db.prepare('SELECT * FROM homes WHERE id = ?').get(id);
  res.json(success(updatedHome, '家庭信息更新成功'));
}));

router.delete('/:id', wrapAsync(async (req, res) => {
  const { id } = req.params;
  
  const result = db.prepare('DELETE FROM homes WHERE id = ?').run(id);
  
  if (result.changes === 0) {
    return res.status(404).json(error('家庭不存在'));
  }
  
  res.json(success(null, '家庭删除成功'));
}));

module.exports = router;
