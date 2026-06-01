const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const { type, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT r.*, u.nickname as owner_name, u.avatar as owner_avatar 
    FROM rooms r 
    JOIN users u ON r.owner_id = u.id 
  `;
  const params = [];

  if (type) {
    query += 'WHERE r.type = ? ';
    params.push(type);
  }

  query += 'ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rooms = db.prepare(query).all(...params);

  rooms.forEach(room => {
    const members = db.prepare(`
      SELECT rm.*, u.nickname, u.avatar 
      FROM room_members rm 
      JOIN users u ON rm.user_id = u.id 
      WHERE rm.room_id = ?
    `).all(room.id);
    room.members = members;
  });

  res.json(rooms);
});

router.get('/types', authMiddleware, (req, res) => {
  res.json([
    { type: '1+8', name: '1+8语音房', description: '1个房主+8个麦位' },
    { type: '1+1', name: '1+1双人房', description: '私密双人聊天' },
    { type: 'fm', name: 'FM电台', description: '主播单向直播' },
    { type: 'game', name: '游戏房', description: '开黑一起玩' }
  ]);
});

router.post('/', authMiddleware, [
  body('name').notEmpty().withMessage('房间名称不能为空'),
  body('type').notEmpty().withMessage('房间类型不能为空')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, type, cover, password } = req.body;

  const maxMembers = type === '1+1' ? 2 : type === 'fm' ? 100 : 9;

  const result = db.prepare(
    'INSERT INTO rooms (name, type, cover, owner_id, max_members, is_locked, password) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    name,
    type,
    cover || null,
    req.user.userId,
    maxMembers,
    password ? 1 : 0,
    password || null
  );

  db.prepare('INSERT INTO room_members (room_id, user_id, role, seat_index) VALUES (?, ?, ?, ?)').run(
    result.lastInsertRowid,
    req.user.userId,
    'owner',
    0
  );

  const room = db.prepare(`
    SELECT r.*, u.nickname as owner_name, u.avatar as owner_avatar 
    FROM rooms r 
    JOIN users u ON r.owner_id = u.id 
    WHERE r.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(room);
});

router.post('/:id/join', authMiddleware, (req, res) => {
  const roomId = req.params.id;
  const { password } = req.body;

  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
  if (!room) {
    return res.status(404).json({ error: '房间不存在' });
  }

  if (room.is_locked && room.password !== password) {
    return res.status(403).json({ error: '房间密码错误' });
  }

  if (room.current_members >= room.max_members) {
    return res.status(403).json({ error: '房间已满' });
  }

  try {
    db.prepare('INSERT INTO room_members (room_id, user_id, role) VALUES (?, ?, ?)').run(
      roomId,
      req.user.userId,
      'listener'
    );
    db.prepare('UPDATE rooms SET current_members = current_members + 1 WHERE id = ?').run(roomId);
    res.json({ success: true });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.json({ success: true, message: '已在房间中' });
    } else {
      res.status(500).json({ error: '加入失败' });
    }
  }
});

router.post('/:id/leave', authMiddleware, (req, res) => {
  const roomId = req.params.id;

  db.prepare('DELETE FROM room_members WHERE room_id = ? AND user_id = ?').run(roomId, req.user.userId);
  db.prepare('UPDATE rooms SET current_members = current_members - 1 WHERE id = ?').run(roomId);

  const remaining = db.prepare('SELECT COUNT(*) as count FROM room_members WHERE room_id = ?').get(roomId);
  if (remaining.count === 0) {
    db.prepare('DELETE FROM rooms WHERE id = ?').run(roomId);
  }

  res.json({ success: true });
});

module.exports = router;
