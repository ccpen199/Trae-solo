import { Router } from 'express';
import db from '../db.js';
import { auth, requireRoomHost } from '../middleware/auth.js';

const router = Router();

router.post('/queue/:roomId', auth, (req, res) => {
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.roomId);
  if (!room) return res.status(404).json({ error: '房间不存在' });
  if (room.status !== 'open') return res.status(400).json({ error: '房间未开放' });
  const existing = db.prepare(`
    SELECT * FROM mic_queue WHERE room_id = ? AND user_id = ? AND status = 'pending'
  `).get(req.params.roomId, req.user.id);
  if (existing) return res.status(400).json({ error: '已在排队中' });
  const onMic = db.prepare('SELECT * FROM mic_slots WHERE room_id = ? AND user_id = ?').get(req.params.roomId, req.user.id);
  if (onMic) return res.status(400).json({ error: '已在麦上' });
  const info = db.prepare('INSERT INTO mic_queue (room_id, user_id) VALUES (?, ?)')
    .run(req.params.roomId, req.user.id);
  db.prepare('INSERT INTO room_events (room_id, event_type, user_id, data) VALUES (?, ?, ?, ?)')
    .run(req.params.roomId, 'queue_apply', req.user.id, JSON.stringify({ queueId: info.lastInsertRowid }));
  res.json({ id: info.lastInsertRowid, message: '已申请排麦' });
});

router.get('/queue/:roomId', auth, (req, res) => {
  const queue = db.prepare(`
    SELECT mq.*, u.nickname, u.avatar, u.role
    FROM mic_queue mq LEFT JOIN users u ON mq.user_id = u.id
    WHERE mq.room_id = ? ORDER BY mq.requested_at
  `).all(req.params.roomId);
  res.json({ queue });
});

router.post('/approve/:roomId/:queueId', auth, requireRoomHost, (req, res) => {
  const queueItem = db.prepare('SELECT * FROM mic_queue WHERE id = ? AND room_id = ?')
    .get(req.params.queueId, req.params.roomId);
  if (!queueItem) return res.status(404).json({ error: '排队项不存在' });
  if (queueItem.status !== 'pending') return res.status(400).json({ error: '已处理' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(queueItem.user_id);
  if (user.banned) return res.status(400).json({ error: '用户已被封禁' });
  const freeSlot = db.prepare(`
    SELECT * FROM mic_slots WHERE room_id = ? AND user_id IS NULL AND locked = 0 ORDER BY slot_index LIMIT 1
  `).get(req.params.roomId);
  if (!freeSlot) return res.status(400).json({ error: '没有空闲麦位' });
  const tx = db.transaction(() => {
    db.prepare('UPDATE mic_slots SET user_id = ?, joined_at = datetime(\'now\',\'localtime\') WHERE id = ?')
      .run(queueItem.user_id, freeSlot.id);
    db.prepare('UPDATE mic_queue SET status = ?, decided_at = datetime(\'now\',\'localtime\') WHERE id = ?')
      .run('approved', queueItem.id);
    db.prepare('INSERT INTO room_events (room_id, event_type, user_id, data) VALUES (?, ?, ?, ?)')
      .run(req.params.roomId, 'mic_approve', req.user.id, JSON.stringify({ userId: queueItem.user_id, slot: freeSlot.slot_index }));
  });
  tx();
  res.json({ message: '已通过上麦', slot: freeSlot.slot_index });
});

router.post('/reject/:roomId/:queueId', auth, requireRoomHost, (req, res) => {
  const queueItem = db.prepare('SELECT * FROM mic_queue WHERE id = ? AND room_id = ?')
    .get(req.params.queueId, req.params.roomId);
  if (!queueItem) return res.status(404).json({ error: '排队项不存在' });
  if (queueItem.status !== 'pending') return res.status(400).json({ error: '已处理' });
  db.prepare('UPDATE mic_queue SET status = ?, decided_at = datetime(\'now\',\'localtime\') WHERE id = ?')
    .run('rejected', queueItem.id);
  db.prepare('INSERT INTO room_events (room_id, event_type, user_id, data) VALUES (?, ?, ?, ?)')
    .run(req.params.roomId, 'queue_reject', req.user.id, JSON.stringify({ userId: queueItem.user_id }));
  res.json({ message: '已拒绝' });
});

router.post('/leave/:roomId', auth, (req, res) => {
  const slot = db.prepare('SELECT * FROM mic_slots WHERE room_id = ? AND user_id = ?')
    .get(req.params.roomId, req.user.id);
  if (!slot) return res.status(400).json({ error: '未在麦上' });
  db.prepare('UPDATE mic_slots SET user_id = NULL, joined_at = NULL, muted = 0 WHERE id = ?').run(slot.id);
  db.prepare('INSERT INTO room_events (room_id, event_type, user_id, data) VALUES (?, ?, ?, ?)')
    .run(req.params.roomId, 'mic_leave', req.user.id, JSON.stringify({ slot: slot.slot_index }));
  res.json({ message: '已下麦' });
});

router.post('/lock/:roomId/:slotId', auth, requireRoomHost, (req, res) => {
  const slot = db.prepare('SELECT * FROM mic_slots WHERE id = ? AND room_id = ?')
    .get(req.params.slotId, req.params.roomId);
  if (!slot) return res.status(404).json({ error: '麦位不存在' });
  const newLocked = slot.locked ? 0 : 1;
  if (newLocked && slot.user_id) {
    db.prepare('UPDATE mic_slots SET user_id = NULL, joined_at = NULL WHERE id = ?').run(slot.id);
  }
  db.prepare('UPDATE mic_slots SET locked = ? WHERE id = ?').run(newLocked, slot.id);
  db.prepare('INSERT INTO room_events (room_id, event_type, user_id, data) VALUES (?, ?, ?, ?)')
    .run(req.params.roomId, newLocked ? 'mic_lock' : 'mic_unlock', req.user.id, JSON.stringify({ slot: slot.slot_index }));
  res.json({ message: newLocked ? '已锁麦' : '已解锁', locked: newLocked });
});

router.post('/mute/:roomId/:slotId', auth, requireRoomHost, (req, res) => {
  const slot = db.prepare('SELECT * FROM mic_slots WHERE id = ? AND room_id = ?')
    .get(req.params.slotId, req.params.roomId);
  if (!slot) return res.status(404).json({ error: '麦位不存在' });
  const newMuted = slot.muted ? 0 : 1;
  db.prepare('UPDATE mic_slots SET muted = ? WHERE id = ?').run(newMuted, slot.id);
  db.prepare('INSERT INTO room_events (room_id, event_type, user_id, data) VALUES (?, ?, ?, ?)')
    .run(req.params.roomId, newMuted ? 'mic_mute' : 'mic_unmute', req.user.id, JSON.stringify({ slot: slot.slot_index, userId: slot.user_id }));
  res.json({ message: newMuted ? '已禁言' : '已解禁', muted: newMuted });
});

router.post('/kick/:roomId/:slotId', auth, requireRoomHost, (req, res) => {
  const slot = db.prepare('SELECT * FROM mic_slots WHERE id = ? AND room_id = ?')
    .get(req.params.slotId, req.params.roomId);
  if (!slot) return res.status(404).json({ error: '麦位不存在' });
  if (!slot.user_id) return res.status(400).json({ error: '该麦位无人' });
  const kickedUserId = slot.user_id;
  db.prepare('UPDATE mic_slots SET user_id = NULL, joined_at = NULL, muted = 0 WHERE id = ?').run(slot.id);
  db.prepare('INSERT INTO room_events (room_id, event_type, user_id, data) VALUES (?, ?, ?, ?)')
    .run(req.params.roomId, 'mic_kick', req.user.id, JSON.stringify({ slot: slot.slot_index, kickedUserId }));
  res.json({ message: '已踢出' });
});

export default router;
