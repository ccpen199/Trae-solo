const express = require('express');
const { v4: uuidv4 } = require('uuid');

module.exports = (db) => {
  const router = express.Router();
  const { authenticateToken, optionalAuth } = require('../middleware/auth')(db);

  const generateMeetingNumber = () => {
    return Math.floor(100000000 + Math.random() * 900000000).toString();
  };

  const addLog = (meetingId, userId, action, details = null) => {
    db.prepare('INSERT INTO meeting_logs (meeting_id, user_id, action, details) VALUES (?, ?, ?, ?)')
      .run(meetingId, userId, action, details ? JSON.stringify(details) : null);
  };

  router.post('/quick', authenticateToken, (req, res) => {
    const { title, videoEnabled = true } = req.body;

    const meetingNumber = generateMeetingNumber();
    const startTime = new Date().toISOString();

    const result = db.prepare(`
      INSERT INTO meetings (meeting_number, title, host_id, start_time, status)
      VALUES (?, ?, ?, ?, 'ongoing')
    `).run(meetingNumber, title || '快速会议', req.user.id, startTime);

    const meetingId = result.lastInsertRowid;

    db.prepare(`
      INSERT INTO meeting_participants (meeting_id, user_id, role, status, video_enabled)
      VALUES (?, ?, 'host', 'joined', ?)
    `).run(meetingId, req.user.id, videoEnabled ? 1 : 0);

    addLog(meetingId, req.user.id, 'meeting_created', { type: 'quick' });
    addLog(meetingId, req.user.id, 'participant_joined', { role: 'host' });

    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meetingId);

    res.json({ success: true, meeting });
  });

  router.post('/schedule', authenticateToken, (req, res) => {
    const {
      title,
      startTime,
      duration,
      password,
      description,
      waitingRoomEnabled = false,
      muteOnEntry = false,
      documentUrl
    } = req.body;

    if (!title || !startTime) {
      return res.status(400).json({ error: 'Title and start time are required' });
    }

    const meetingNumber = generateMeetingNumber();

    const result = db.prepare(`
      INSERT INTO meetings (
        meeting_number, title, host_id, start_time, duration, password,
        description, waiting_room_enabled, mute_on_entry, document_url, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')
    `).run(
      meetingNumber, title, req.user.id, startTime, duration, password,
      description, waitingRoomEnabled ? 1 : 0, muteOnEntry ? 1 : 0, documentUrl
    );

    const meetingId = result.lastInsertRowid;
    addLog(meetingId, req.user.id, 'meeting_scheduled');

    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meetingId);

    res.json({ success: true, meeting });
  });

  router.get('/:meetingNumber', optionalAuth, (req, res) => {
    const { meetingNumber } = req.params;

    const meeting = db.prepare(`
      SELECT m.*, u.nickname as host_name, u.avatar as host_avatar
      FROM meetings m
      LEFT JOIN users u ON m.host_id = u.id
      WHERE m.meeting_number = ?
    `).get(meetingNumber);

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const participants = db.prepare(`
      SELECT mp.*, u.nickname, u.avatar
      FROM meeting_participants mp
      LEFT JOIN users u ON mp.user_id = u.id
      WHERE mp.meeting_id = ? AND mp.leave_time IS NULL
    `).all(meeting.id);

    const logs = db.prepare(`
      SELECT ml.*, u.nickname
      FROM meeting_logs ml
      LEFT JOIN users u ON ml.user_id = u.id
      WHERE ml.meeting_id = ?
      ORDER BY ml.timestamp DESC
      LIMIT 50
    `).all(meeting.id);

    const messages = db.prepare(`
      SELECT cm.*, u.nickname, u.username
      FROM chat_messages cm
      LEFT JOIN users u ON cm.user_id = u.id
      WHERE cm.meeting_id = ?
      ORDER BY cm.timestamp ASC
    `).all(meeting.id);

    const isHost = req.user?.id === meeting.host_id;

    res.json({ success: true, meeting, participants, logs, messages, is_host: isHost });
  });

  router.post('/:meetingNumber/join', optionalAuth, (req, res) => {
    const { meetingNumber } = req.params;
    const { password, guestName } = req.body;

    const meeting = db.prepare('SELECT * FROM meetings WHERE meeting_number = ?').get(meetingNumber);

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    if (meeting.password && meeting.password !== password) {
      return res.status(403).json({ error: 'Incorrect meeting password' });
    }

    if (meeting.status === 'ended' || meeting.status === 'cancelled') {
      return res.status(400).json({ error: 'Meeting has ended or been cancelled' });
    }

    const userId = req.user?.id;
    const role = userId === meeting.host_id ? 'host' : 'participant';
    const status = meeting.waiting_room_enabled && role !== 'host' ? 'waiting' : 'joined';
    const isMuted = meeting.mute_on_entry ? 1 : 0;

    let participant;
    if (userId) {
      participant = db.prepare('SELECT * FROM meeting_participants WHERE meeting_id = ? AND user_id = ? AND leave_time IS NULL')
        .get(meeting.id, userId);
    }

    if (!participant) {
      const result = db.prepare(`
        INSERT INTO meeting_participants (meeting_id, user_id, guest_name, role, status, is_muted)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(meeting.id, userId, guestName, role, status, isMuted);

      participant = db.prepare('SELECT * FROM meeting_participants WHERE id = ?').get(result.lastInsertRowid);
      addLog(meeting.id, userId, 'participant_joined', { role, status, guestName });
    }

    if (meeting.status === 'pending' || meeting.status === 'scheduled') {
      db.prepare('UPDATE meetings SET status = ? WHERE id = ?').run('ongoing', meeting.id);
      addLog(meeting.id, meeting.host_id, 'meeting_started');
    }

    const participants = db.prepare(`
      SELECT mp.*, u.nickname, u.avatar
      FROM meeting_participants mp
      LEFT JOIN users u ON mp.user_id = u.id
      WHERE mp.meeting_id = ? AND mp.leave_time IS NULL
    `).all(meeting.id);

    res.json({ success: true, participant, participants });
  });

  router.put('/:meetingId', authenticateToken, (req, res) => {
    const { meetingId } = req.params;
    const {
      title, startTime, duration, password, description,
      waitingRoomEnabled, muteOnEntry, documentUrl
    } = req.body;

    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meetingId);

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    if (meeting.host_id !== req.user.id) {
      return res.status(403).json({ error: 'Only host can modify meeting' });
    }

    db.prepare(`
      UPDATE meetings SET
        title = COALESCE(?, title),
        start_time = COALESCE(?, start_time),
        duration = COALESCE(?, duration),
        password = COALESCE(?, password),
        description = COALESCE(?, description),
        waiting_room_enabled = COALESCE(?, waiting_room_enabled),
        mute_on_entry = COALESCE(?, mute_on_entry),
        document_url = COALESCE(?, document_url)
      WHERE id = ?
    `).run(title, startTime, duration, password, description,
           waitingRoomEnabled, muteOnEntry, documentUrl, meetingId);

    addLog(meeting.id, req.user.id, 'meeting_updated');

    const updatedMeeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meetingId);
    res.json({ success: true, meeting: updatedMeeting });
  });

  router.delete('/:meetingId', authenticateToken, (req, res) => {
    const { meetingId } = req.params;

    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meetingId);

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    if (meeting.host_id !== req.user.id) {
      return res.status(403).json({ error: 'Only host can cancel meeting' });
    }

    db.prepare('UPDATE meetings SET status = ? WHERE id = ?').run('cancelled', meetingId);
    addLog(meeting.id, req.user.id, 'meeting_cancelled');

    res.json({ success: true, message: 'Meeting cancelled' });
  });

  return router;
};
