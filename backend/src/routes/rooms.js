const express = require('express');
const db = require('../database/db');
const { success, error, wrapAsync } = require('../utils/response');

const router = express.Router();

router.get('/home/:homeId', wrapAsync(async (req, res) => {
  const { homeId } = req.params;
  const rooms = db.prepare('SELECT * FROM rooms WHERE homeId = ? ORDER BY sortOrder ASC').all(homeId);
  res.json(success(rooms));
}));

router.post('/', wrapAsync(async (req, res) => {
  const { homeId, name, icon = '', sortOrder = 0 } = req.body;
  
  if (!homeId || !name?.trim()) {
    return res.status(400).json(error('参数不完整'));
  }
  
  const id = `room-${Date.now()}`;
  const now = Date.now();
  
  db.prepare(`
    INSERT INTO rooms (id, homeId, name, icon, sortOrder, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, homeId, name.trim(), icon, sortOrder, now, now);
  
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
  res.json(success(room, '房间创建成功'));
}));

router.put('/:id', wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { name, icon, sortOrder } = req.body;
  
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
  if (!room) {
    return res.status(404).json(error('房间不存在'));
  }
  
  const now = Date.now();
  db.prepare(`
    UPDATE rooms 
    SET name = COALESCE(?, name),
        icon = COALESCE(?, icon),
        sortOrder = COALESCE(?, sortOrder),
        updatedAt = ?
    WHERE id = ?
  `).run(name, icon, sortOrder, now, id);
  
  const updatedRoom = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
  res.json(success(updatedRoom, '房间信息更新成功'));
}));

router.delete('/:id', wrapAsync(async (req, res) => {
  const { id } = req.params;
  
  const result = db.prepare('DELETE FROM rooms WHERE id = ?').run(id);
  
  if (result.changes === 0) {
    return res.status(404).json(error('房间不存在'));
  }
  
  res.json(success(null, '房间删除成功'));
}));

module.exports = router;
