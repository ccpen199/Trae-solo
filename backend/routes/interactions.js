import { Router } from 'express';
import db from '../db.js';
import { auth, requireRoomHost } from '../middleware/auth.js';

const router = Router();

router.post('/gift/:roomId', auth, (req, res) => {
  const { to_user_id, gift_id, quantity = 1 } = req.body;
  if (!to_user_id || !gift_id) return res.status(400).json({ error: '缺少参数' });
  const gift = db.prepare('SELECT * FROM gifts WHERE id = ?').get(gift_id);
  if (!gift) return res.status(404).json({ error: '礼物不存在' });
  const totalAmount = gift.price * quantity;
  if (req.user.balance < totalAmount) return res.status(400).json({ error: '余额不足' });
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.roomId);
  if (!room) return res.status(404).json({ error: '房间不存在' });
  const tx = db.transaction(() => {
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(totalAmount, req.user.id);
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(totalAmount, to_user_id);
    db.prepare(`INSERT INTO interactions (room_id, type, from_user_id, to_user_id, gift_id, quantity, amount)
      VALUES (?, 'gift', ?, ?, ?, ?, ?)`)
      .run(req.params.roomId, req.user.id, to_user_id, gift_id, quantity, totalAmount);
    db.prepare(`INSERT INTO payments (user_id, room_id, amount, type, description)
      VALUES (?, ?, ?, 'gift', ?)`)
      .run(req.user.id, req.params.roomId, totalAmount, `赠送${gift.name}x${quantity}`);
    db.prepare(`INSERT INTO room_events (room_id, event_type, user_id, data) VALUES (?, ?, ?, ?)`)
      .run(req.params.roomId, 'gift', req.user.id, JSON.stringify({ gift: gift.name, to: to_user_id, amount: totalAmount, quantity }));
    db.prepare('UPDATE rooms SET popularity = popularity + ? WHERE id = ?').run(Math.floor(totalAmount / 10), req.params.roomId);
  });
  tx();
  res.json({ message: '赠送成功', amount: totalAmount });
});

router.post('/barrage/:roomId', auth, (req, res) => {
  const { content } = req.body;
  if (!content || content.length > 100) return res.status(400).json({ error: '弹幕内容无效' });
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.roomId);
  if (!room) return res.status(404).json({ error: '房间不存在' });
  if (room.status !== 'open') return res.status(400).json({ error: '房间未开放' });
  db.prepare(`INSERT INTO interactions (room_id, type, from_user_id, content) VALUES (?, 'barrage', ?, ?)`)
    .run(req.params.roomId, req.user.id, content);
  db.prepare(`INSERT INTO room_events (room_id, event_type, user_id, data) VALUES (?, ?, ?, ?)`)
    .run(req.params.roomId, 'barrage', req.user.id, JSON.stringify({ content }));
  res.json({ message: '弹幕发送成功' });
});

router.get('/barrage/:roomId', auth, (req, res) => {
  const { limit = 20 } = req.query;
  const barrages = db.prepare(`
    SELECT i.*, u.nickname, u.avatar FROM interactions i
    LEFT JOIN users u ON i.from_user_id = u.id
    WHERE i.room_id = ? AND i.type = 'barrage' ORDER BY i.created_at DESC LIMIT ?
  `).all(req.params.roomId, Number(limit));
  res.json({ barrages: barrages.reverse() });
});

router.post('/announcement/:roomId', auth, requireRoomHost, (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: '公告内容必填' });
  db.prepare('INSERT INTO announcements (room_id, content, created_by) VALUES (?, ?, ?)')
    .run(req.params.roomId, content, req.user.id);
  db.prepare(`INSERT INTO room_events (room_id, event_type, user_id, data) VALUES (?, ?, ?, ?)`)
    .run(req.params.roomId, 'announcement', req.user.id, JSON.stringify({ content }));
  res.json({ message: '公告已发布' });
});

router.get('/announcements/:roomId', auth, (req, res) => {
  const announcements = db.prepare(`
    SELECT a.*, u.nickname as creator_name FROM announcements a
    LEFT JOIN users u ON a.created_by = u.id WHERE a.room_id = ? ORDER BY a.created_at DESC LIMIT 10
  `).all(req.params.roomId);
  res.json({ announcements });
});

router.get('/gifts', auth, (req, res) => {
  const gifts = db.prepare('SELECT * FROM gifts').all();
  res.json({ gifts });
});

router.post('/task/:roomId', auth, requireRoomHost, (req, res) => {
  const { title, description, reward } = req.body;
  if (!title) return res.status(400).json({ error: '任务标题必填' });
  const info = db.prepare(`INSERT INTO room_tasks (room_id, title, description, reward, created_by)
    VALUES (?, ?, ?, ?, ?)`)
    .run(req.params.roomId, title, description || '', reward || 0, req.user.id);
  res.json({ id: info.lastInsertRowid, message: '任务已创建' });
});

router.get('/tasks/:roomId', auth, (req, res) => {
  const tasks = db.prepare(`
    SELECT t.*, u.nickname as creator_name FROM room_tasks t
    LEFT JOIN users u ON t.created_by = u.id WHERE t.room_id = ? ORDER BY t.created_at DESC
  `).all(req.params.roomId);
  res.json({ tasks });
});

router.post('/task/complete/:taskId', auth, (req, res) => {
  const task = db.prepare('SELECT * FROM room_tasks WHERE id = ?').get(req.params.taskId);
  if (!task) return res.status(404).json({ error: '任务不存在' });
  if (task.completed) return res.status(400).json({ error: '任务已完成' });
  if (task.reward > 0) {
    const host = db.prepare('SELECT host_id FROM rooms WHERE id = ?').get(task.room_id);
    if (host) {
      db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(task.reward, host.host_id);
    }
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(task.reward, req.user.id);
  }
  db.prepare('UPDATE room_tasks SET completed = 1 WHERE id = ?').run(task.id);
  db.prepare(`INSERT INTO room_events (room_id, event_type, user_id, data) VALUES (?, ?, ?, ?)`)
    .run(task.room_id, 'task_complete', req.user.id, JSON.stringify({ taskId: task.id, reward: task.reward }));
  res.json({ message: '任务已完成', reward: task.reward });
});

router.post('/game/:roomId', auth, (req, res) => {
  const { game_type, data } = req.body;
  if (!game_type) return res.status(400).json({ error: '游戏类型必填' });
  db.prepare(`INSERT INTO interactions (room_id, type, from_user_id, content) VALUES (?, 'game', ?, ?)`)
    .run(req.params.roomId, req.user.id, JSON.stringify({ game_type, ...(data || {}) }));
  db.prepare(`INSERT INTO room_events (room_id, event_type, user_id, data) VALUES (?, ?, ?, ?)`)
    .run(req.params.roomId, 'game', req.user.id, JSON.stringify({ game_type, ...(data || {}) }));
  res.json({ message: '游戏互动已记录' });
});

router.get('/events/:roomId', auth, (req, res) => {
  const { limit = 50, type } = req.query;
  let sql = `
    SELECT re.*, u.nickname, u.avatar FROM room_events re
    LEFT JOIN users u ON re.user_id = u.id WHERE re.room_id = ?
  `;
  const params = [req.params.roomId];
  if (type) { sql += ' AND re.event_type = ?'; params.push(type); }
  sql += ' ORDER BY re.created_at DESC LIMIT ?';
  params.push(Number(limit));
  const events = db.prepare(sql).all(...params);
  res.json({ events: events.reverse() });
});

export default router;
