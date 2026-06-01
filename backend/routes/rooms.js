import { Router } from 'express';
import db from '../db.js';
import { auth, requireRole, requireRoomHost } from '../middleware/auth.js';

const router = Router();

router.get('/', auth, (req, res) => {
  const { status, category, hostId, page = 1, pageSize = 20 } = req.query;
  let sql = `
    SELECT r.*, u.nickname as host_name, u.avatar as host_avatar,
      (SELECT COUNT(*) FROM mic_slots WHERE room_id = r.id AND user_id IS NOT NULL) as mic_used
    FROM rooms r
    LEFT JOIN users u ON r.host_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (status) { sql += ' AND r.status = ?'; params.push(status); }
  if (category) { sql += ' AND r.category = ?'; params.push(category); }
  if (hostId) { sql += ' AND r.host_id = ?'; params.push(hostId); }
  sql += ' ORDER BY r.popularity DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
  const rooms = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as cnt FROM rooms WHERE 1=1' +
    (status ? ' AND status = ?' : '') +
    (category ? ' AND category = ?' : '') +
    (hostId ? ' AND host_id = ?' : '')
  ).get(...(status ? [status] : []).concat(category ? [category] : []).concat(hostId ? [hostId] : [])).cnt;
  res.json({ rooms, total, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/:id', auth, (req, res) => {
  const room = db.prepare(`
    SELECT r.*, u.nickname as host_name, u.avatar as host_avatar
    FROM rooms r LEFT JOIN users u ON r.host_id = u.id WHERE r.id = ?
  `).get(req.params.id);
  if (!room) return res.status(404).json({ error: '房间不存在' });
  const micSlots = db.prepare(`
    SELECT ms.*, u.nickname, u.avatar, u.role
    FROM mic_slots ms LEFT JOIN users u ON ms.user_id = u.id
    WHERE ms.room_id = ? ORDER BY ms.slot_index
  `).all(room.id);
  const queue = db.prepare(`
    SELECT mq.*, u.nickname, u.avatar
    FROM mic_queue mq LEFT JOIN users u ON mq.user_id = u.id
    WHERE mq.room_id = ? AND mq.status = 'pending' ORDER BY mq.requested_at
  `).all(room.id);
  const announcements = db.prepare(`
    SELECT a.*, u.nickname as creator_name FROM announcements a
    LEFT JOIN users u ON a.created_by = u.id WHERE a.room_id = ? ORDER BY a.created_at DESC LIMIT 5
  `).all(room.id);
  res.json({ ...room, micSlots, queue, announcements });
});

router.post('/', auth, requireRole('host', 'admin'), (req, res) => {
  const { topic, category, mic_count = 8, password = '', max_viewers = 500 } = req.body;
  if (!topic || !category) return res.status(400).json({ error: '主题和分类必填' });
  const info = db.prepare(`
    INSERT INTO rooms (topic, category, host_id, mic_count, password, max_viewers)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(topic, category, req.user.id, mic_count, password, max_viewers);
  const roomId = info.lastInsertRowid;
  const insertSlot = db.prepare('INSERT INTO mic_slots (room_id, slot_index) VALUES (?, ?)');
  const insertSlots = db.transaction(() => {
    for (let i = 0; i < mic_count; i++) insertSlot.run(roomId, i);
  });
  insertSlots();
  db.prepare('INSERT INTO room_events (room_id, event_type, user_id, data) VALUES (?, ?, ?, ?)')
    .run(roomId, 'room_open', req.user.id, '{}');
  res.json({ id: roomId, message: '房间创建成功' });
});

router.put('/:id', auth, requireRoomHost, (req, res) => {
  const { topic, category, mic_count, password, max_viewers, status } = req.body;
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
  const updates = [];
  const params = [];
  if (topic !== undefined) { updates.push('topic = ?'); params.push(topic); }
  if (category !== undefined) { updates.push('category = ?'); params.push(category); }
  if (password !== undefined) { updates.push('password = ?'); params.push(password); }
  if (max_viewers !== undefined) { updates.push('max_viewers = ?'); params.push(max_viewers); }
  if (status !== undefined) {
    updates.push('status = ?');
    params.push(status);
    if (status === 'closed') {
      updates.push('closed_at = datetime(\'now\',\'localtime\')');
      db.prepare('INSERT INTO room_events (room_id, event_type, user_id, data) VALUES (?, ?, ?, ?)')
        .run(req.params.id, 'room_close', req.user.id, '{}');
    }
  }
  if (mic_count !== undefined && mic_count > room.mic_count) {
    const insertSlot = db.prepare('INSERT INTO mic_slots (room_id, slot_index) VALUES (?, ?)');
    for (let i = room.mic_count; i < mic_count; i++) insertSlot.run(req.params.id, i);
    updates.push('mic_count = ?'); params.push(mic_count);
  }
  if (updates.length > 0) {
    params.push(req.params.id);
    db.prepare(`UPDATE rooms SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  res.json({ message: '房间已更新' });
});

router.delete('/:id', auth, requireRoomHost, (req, res) => {
  db.prepare('UPDATE rooms SET status = ? WHERE id = ?').run('closed', req.params.id);
  db.prepare('INSERT INTO room_events (room_id, event_type, user_id, data) VALUES (?, ?, ?, ?)')
    .run(req.params.id, 'room_close', req.user.id, '{}');
  res.json({ message: '房间已关闭' });
});

router.post('/:id/enter', auth, (req, res) => {
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
  if (!room) return res.status(404).json({ error: '房间不存在' });
  if (room.status !== 'open') return res.status(400).json({ error: '房间未开放' });
  if (room.online_count >= room.max_viewers) return res.status(400).json({ error: '房间已满' });
  db.prepare('UPDATE rooms SET online_count = online_count + 1 WHERE id = ?').run(req.params.id);
  db.prepare('INSERT INTO room_sessions (room_id, user_id) VALUES (?, ?)').run(req.params.id, req.user.id);
  db.prepare('INSERT INTO room_events (room_id, event_type, user_id, data) VALUES (?, ?, ?, ?)')
    .run(req.params.id, 'user_enter', req.user.id, '{}');
  res.json({ message: '已进入房间' });
});

router.post('/:id/leave', auth, (req, res) => {
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
  if (!room) return res.status(404).json({ error: '房间不存在' });
  if (room.online_count > 0) {
    db.prepare('UPDATE rooms SET online_count = online_count - 1 WHERE id = ?').run(req.params.id);
  }
  const session = db.prepare(`
    SELECT * FROM room_sessions WHERE room_id = ? AND user_id = ? AND left_at IS NULL
    ORDER BY joined_at DESC LIMIT 1
  `).get(req.params.id, req.user.id);
  if (session) {
    const dur = Math.floor((Date.now() - new Date(session.joined_at).getTime()) / 1000);
    db.prepare('UPDATE room_sessions SET left_at = datetime(\'now\',\'localtime\'), duration_seconds = ? WHERE id = ?')
      .run(dur, session.id);
  }
  db.prepare('INSERT INTO room_events (room_id, event_type, user_id, data) VALUES (?, ?, ?, ?)')
    .run(req.params.id, 'user_leave', req.user.id, '{}');
  res.json({ message: '已离开房间' });
});

export default router;
