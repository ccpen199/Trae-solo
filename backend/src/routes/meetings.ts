import express from 'express';
import db from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

function generateMeetingNumber() {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
}

router.post('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { title, password, duration } = req.body;
    const hostId = req.user?.id;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: '会议主题不能为空' });
    }

    let meetingNumber = generateMeetingNumber();
    while (db.prepare('SELECT id FROM meetings WHERE meeting_number = ?').get(meetingNumber)) {
      meetingNumber = generateMeetingNumber();
    }

    const user = db.prepare('SELECT plan FROM users WHERE id = ?').get(hostId) as any;
    const maxParticipants = user.plan === 'pro' ? 500 : 100;
    const enableRecording = user.plan === 'pro' ? 1 : 0;

    const stmt = db.prepare(`
      INSERT INTO meetings (meeting_number, title, host_id, duration, max_participants, enable_recording, password, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `);
    const result = stmt.run(meetingNumber, title, hostId, duration || 60, maxParticipants, enableRecording, password || null);

    db.prepare(`
      INSERT INTO meeting_participants (meeting_id, user_id, username, role)
      SELECT ?, id, username, 'host' FROM users WHERE id = ?
    `).run(result.lastInsertRowid, hostId);

    const meeting = db.prepare(`
      SELECT m.*, u.username as host_name
      FROM meetings m
      JOIN users u ON m.host_id = u.id
      WHERE m.id = ?
    `).get(result.lastInsertRowid);

    res.json(meeting);
  } catch (err: any) {
    console.error('Create meeting error:', err);
    res.status(500).json({ error: '创建会议失败: ' + err.message });
  }
});

router.get('/:meetingNumber', authenticateToken, (req: AuthRequest, res) => {
  const { meetingNumber } = req.params;

  const meeting = db.prepare(`
    SELECT m.*, u.username as host_name
    FROM meetings m
    JOIN users u ON m.host_id = u.id
    WHERE m.meeting_number = ?
  `).get(meetingNumber);

  if (!meeting) {
    return res.status(404).json({ error: '会议不存在' });
  }

  const participants = db.prepare(`
    SELECT * FROM meeting_participants WHERE meeting_id = ? AND is_online = 1
  `).all((meeting as any).id);

  res.json({ ...meeting as any, participants });
});

router.post('/:meetingNumber/join', authenticateToken, (req: AuthRequest, res) => {
  const { meetingNumber } = req.params;
  const { password } = req.body;
  const userId = req.user?.id;

  const meeting = db.prepare('SELECT * FROM meetings WHERE meeting_number = ?').get(meetingNumber) as any;

  if (!meeting) {
    return res.status(404).json({ error: '会议号无效' });
  }

  if (meeting.password && meeting.password !== password) {
    return res.status(403).json({ error: '会议密码错误' });
  }

  if (meeting.status !== 'active') {
    return res.status(400).json({ error: '会议已结束或未开始' });
  }

  const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId) as any;

  let participant = db.prepare(`
    SELECT * FROM meeting_participants WHERE meeting_id = ? AND user_id = ?
  `).get(meeting.id, userId);

  if (participant) {
    db.prepare('UPDATE meeting_participants SET is_online = 1, join_time = CURRENT_TIMESTAMP WHERE id = ?').run((participant as any).id);
  } else {
    db.prepare(`
      INSERT INTO meeting_participants (meeting_id, user_id, username, role)
      VALUES (?, ?, ?, 'participant')
    `).run(meeting.id, userId, user.username);
  }

  participant = db.prepare(`
    SELECT * FROM meeting_participants WHERE meeting_id = ? AND user_id = ?
  `).get(meeting.id, userId);

  const host = db.prepare(`
    SELECT username FROM meeting_participants WHERE meeting_id = ? AND role = 'host'
  `).get(meeting.id);

  res.json({
    meeting: {
      ...meeting,
      host_name: (host as any)?.username
    },
    participant
  });
});

router.post('/:meetingNumber/leave', authenticateToken, (req: AuthRequest, res) => {
  const { meetingNumber } = req.params;
  const userId = req.user?.id;

  const meeting = db.prepare('SELECT id FROM meetings WHERE meeting_number = ?').get(meetingNumber) as any;

  if (meeting) {
    db.prepare(`
      UPDATE meeting_participants 
      SET is_online = 0, leave_time = CURRENT_TIMESTAMP 
      WHERE meeting_id = ? AND user_id = ?
    `).run(meeting.id, userId);

    const onlineCount = db.prepare(`
      SELECT COUNT(*) as count FROM meeting_participants WHERE meeting_id = ? AND is_online = 1
    `).get(meeting.id);

    if ((onlineCount as any).count === 0) {
      db.prepare('UPDATE meetings SET status = ? WHERE id = ?').run('ended', meeting.id);
    }
  }

  res.json({ message: '已离开会议' });
});

router.get('/history/list', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.user?.id;

  const meetings = db.prepare(`
    SELECT DISTINCT m.*, u.username as host_name
    FROM meetings m
    JOIN meeting_participants mp ON m.id = mp.meeting_id
    JOIN users u ON m.host_id = u.id
    WHERE mp.user_id = ?
    ORDER BY m.created_at DESC
  `).all(userId);

  res.json(meetings);
});

router.delete('/:meetingId', authenticateToken, (req: AuthRequest, res) => {
  const { meetingId } = req.params;
  const userId = req.user?.id;

  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ? AND host_id = ?').get(meetingId, userId);

  if (!meeting) {
    return res.status(403).json({ error: '无权限删除' });
  }

  db.prepare('DELETE FROM meeting_chats WHERE meeting_id = ?').run(meetingId);
  db.prepare('DELETE FROM meeting_participants WHERE meeting_id = ?').run(meetingId);
  db.prepare('DELETE FROM meetings WHERE id = ?').run(meetingId);

  res.json({ message: '删除成功' });
});

router.post('/chat/:meetingId', authenticateToken, (req: AuthRequest, res) => {
  const { meetingId } = req.params;
  const { content } = req.body;
  const userId = req.user?.id;
  const username = req.user?.username;

  const stmt = db.prepare(`
    INSERT INTO meeting_chats (meeting_id, user_id, username, content)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(meetingId, userId, username, content);

  const chat = db.prepare('SELECT * FROM meeting_chats WHERE id = ?').get(result.lastInsertRowid);
  res.json(chat);
});

router.get('/chat/:meetingId', authenticateToken, (req: AuthRequest, res) => {
  const { meetingId } = req.params;

  const chats = db.prepare(`
    SELECT * FROM meeting_chats 
    WHERE meeting_id = ? 
    ORDER BY timestamp ASC
  `).all(meetingId);

  res.json(chats);
});

router.get('/participants/:meetingId', authenticateToken, (req: AuthRequest, res) => {
  const { meetingId } = req.params;

  const participants = db.prepare(`
    SELECT * FROM meeting_participants 
    WHERE meeting_id = ? 
    ORDER BY join_time ASC
  `).all(meetingId);

  res.json(participants);
});

export default router;
