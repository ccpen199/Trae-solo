import db from '../db.js';

export function auth(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: '未登录' });
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(401).json({ error: '用户不存在' });
  }
  if (user.banned) {
    return res.status(403).json({ error: '账号已被封禁' });
  }
  req.user = user;
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: '未登录' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
}

export function requireHostOrAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: '未登录' });
  if (req.user.role === 'admin' || req.user.role === 'host') {
    return next();
  }
  const roomId = req.params.roomId || req.body.room_id;
  if (roomId) {
    const room = db.prepare('SELECT host_id FROM rooms WHERE id = ?').get(roomId);
    if (room && room.host_id === req.user.id) {
      return next();
    }
  }
  return res.status(403).json({ error: '需要房主权限' });
}

export function requireRoomHost(req, res, next) {
  if (!req.user) return res.status(401).json({ error: '未登录' });
  const roomId = req.params.roomId || req.body.room_id;
  if (!roomId) return res.status(400).json({ error: '缺少房间ID' });
  const room = db.prepare('SELECT host_id FROM rooms WHERE id = ?').get(roomId);
  if (!room) return res.status(404).json({ error: '房间不存在' });
  if (room.host_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '非房间房主' });
  }
  req.room = room;
  next();
}
