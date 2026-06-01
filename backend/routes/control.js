const express = require('express');

module.exports = (db) => {
  const router = express.Router();
  const { authenticateToken } = require('../middleware/auth')(db);

  const addLog = (meetingId, userId, action, details = null) => {
    db.prepare('INSERT INTO meeting_logs (meeting_id, user_id, action, details) VALUES (?, ?, ?, ?)')
      .run(meetingId, userId, action, details ? JSON.stringify(details) : null);
  };

  const getMeetingAndCheckHost = (meetingIdentifier, userId) => {
    let meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meetingIdentifier);
    if (!meeting) {
      meeting = db.prepare('SELECT * FROM meetings WHERE meeting_number = ?').get(meetingIdentifier);
    }
    if (!meeting) return { error: 'Meeting not found', status: 404 };
    if (meeting.host_id !== userId) return { error: 'Only host can perform this action', status: 403 };
    return { meeting };
  };

  router.post('/:meetingId/end', authenticateToken, (req, res) => {
    const { meetingId } = req.params;

    const check = getMeetingAndCheckHost(meetingId, req.user.id);
    if (check.error) return res.status(check.status).json({ error: check.error });
    const meetingDbId = check.meeting.id;

    db.prepare('UPDATE meetings SET status = ?, end_time = CURRENT_TIMESTAMP WHERE id = ?')
      .run('ended', meetingDbId);

    db.prepare('UPDATE meeting_participants SET leave_time = CURRENT_TIMESTAMP WHERE meeting_id = ? AND leave_time IS NULL')
      .run(meetingDbId);

    addLog(meetingDbId, req.user.id, 'meeting_ended');

    res.json({ success: true, message: 'Meeting ended' });
  });

  router.post('/:meetingId/mute-all', authenticateToken, (req, res) => {
    const { meetingId } = req.params;

    const check = getMeetingAndCheckHost(meetingId, req.user.id);
    if (check.error) return res.status(check.status).json({ error: check.error });
    const meetingDbId = check.meeting.id;

    db.prepare('UPDATE meeting_participants SET is_muted = 1 WHERE meeting_id = ? AND role != ? AND leave_time IS NULL')
      .run(meetingDbId, 'host');

    addLog(meetingDbId, req.user.id, 'mute_all');

    res.json({ success: true, message: 'All participants muted' });
  });

  router.post('/:meetingId/mute/:participantId', authenticateToken, (req, res) => {
    const { meetingId, participantId } = req.params;

    const check = getMeetingAndCheckHost(meetingId, req.user.id);
    if (check.error) return res.status(check.status).json({ error: check.error });
    const meetingDbId = check.meeting.id;

    db.prepare('UPDATE meeting_participants SET is_muted = 1 WHERE id = ? AND meeting_id = ?')
      .run(participantId, meetingDbId);

    addLog(meetingDbId, req.user.id, 'mute_participant', { participantId });

    res.json({ success: true, message: 'Participant muted' });
  });

  router.post('/:meetingId/unmute/:participantId', authenticateToken, (req, res) => {
    const { meetingId, participantId } = req.params;

    const check = getMeetingAndCheckHost(meetingId, req.user.id);
    if (check.error) return res.status(check.status).json({ error: check.error });
    const meetingDbId = check.meeting.id;

    db.prepare('UPDATE meeting_participants SET is_muted = 0 WHERE id = ? AND meeting_id = ?')
      .run(participantId, meetingDbId);

    addLog(meetingDbId, req.user.id, 'unmute_participant', { participantId });

    res.json({ success: true, message: 'Participant unmuted' });
  });

  router.post('/:meetingId/remove/:participantId', authenticateToken, (req, res) => {
    const { meetingId, participantId } = req.params;

    const check = getMeetingAndCheckHost(meetingId, req.user.id);
    if (check.error) return res.status(check.status).json({ error: check.error });
    const meetingDbId = check.meeting.id;

    const participant = db.prepare('SELECT * FROM meeting_participants WHERE id = ? AND meeting_id = ?')
      .get(participantId, meetingDbId);

    if (!participant) return res.status(404).json({ error: 'Participant not found' });
    if (participant.role === 'host') return res.status(400).json({ error: 'Cannot remove host' });

    db.prepare('UPDATE meeting_participants SET status = ?, leave_time = CURRENT_TIMESTAMP WHERE id = ?')
      .run('removed', participantId);

    addLog(meetingDbId, req.user.id, 'remove_participant', { participantId });

    res.json({ success: true, message: 'Participant removed' });
  });

  router.post('/:meetingId/admit/:participantId', authenticateToken, (req, res) => {
    const { meetingId, participantId } = req.params;

    const check = getMeetingAndCheckHost(meetingId, req.user.id);
    if (check.error) return res.status(check.status).json({ error: check.error });
    const meetingDbId = check.meeting.id;

    db.prepare('UPDATE meeting_participants SET status = ? WHERE id = ? AND meeting_id = ? AND status = ?')
      .run('joined', participantId, meetingDbId, 'waiting');

    addLog(meetingDbId, req.user.id, 'admit_participant', { participantId });

    res.json({ success: true, message: 'Participant admitted' });
  });

  router.post('/:meetingId/admit-all', authenticateToken, (req, res) => {
    const { meetingId } = req.params;

    const check = getMeetingAndCheckHost(meetingId, req.user.id);
    if (check.error) return res.status(check.status).json({ error: check.error });
    const meetingDbId = check.meeting.id;

    db.prepare('UPDATE meeting_participants SET status = ? WHERE meeting_id = ? AND status = ?')
      .run('joined', meetingDbId, 'waiting');

    addLog(meetingDbId, req.user.id, 'admit_all');

    res.json({ success: true, message: 'All waiting participants admitted' });
  });

  router.post('/:meetingId/recording/start', authenticateToken, (req, res) => {
    const { meetingId } = req.params;

    const check = getMeetingAndCheckHost(meetingId, req.user.id);
    if (check.error) return res.status(check.status).json({ error: check.error });
    const meetingDbId = check.meeting.id;

    db.prepare('UPDATE meetings SET is_recording = 1 WHERE id = ?').run(meetingDbId);
    addLog(meetingDbId, req.user.id, 'recording_started');

    res.json({ success: true, message: 'Recording started' });
  });

  router.post('/:meetingId/recording/stop', authenticateToken, (req, res) => {
    const { meetingId } = req.params;

    const check = getMeetingAndCheckHost(meetingId, req.user.id);
    if (check.error) return res.status(check.status).json({ error: check.error });
    const meetingDbId = check.meeting.id;

    db.prepare('UPDATE meetings SET is_recording = 0 WHERE id = ?').run(meetingDbId);
    addLog(meetingDbId, req.user.id, 'recording_stopped');

    res.json({ success: true, message: 'Recording stopped' });
  });

  router.post('/:meetingId/screen-share/start', authenticateToken, (req, res) => {
    const { meetingId } = req.params;

    const check = getMeetingAndCheckHost(meetingId, req.user.id);
    if (check.error) return res.status(check.status).json({ error: check.error });
    const meetingDbId = check.meeting.id;

    db.prepare('UPDATE meetings SET is_sharing = 1 WHERE id = ?').run(meetingDbId);
    addLog(meetingDbId, req.user.id, 'screen_share_started');

    res.json({ success: true, message: 'Screen sharing started' });
  });

  router.post('/:meetingId/screen-share/stop', authenticateToken, (req, res) => {
    const { meetingId } = req.params;

    const check = getMeetingAndCheckHost(meetingId, req.user.id);
    if (check.error) return res.status(check.status).json({ error: check.error });
    const meetingDbId = check.meeting.id;

    db.prepare('UPDATE meetings SET is_sharing = 0 WHERE id = ?').run(meetingDbId);
    addLog(meetingDbId, req.user.id, 'screen_share_stopped');

    res.json({ success: true, message: 'Screen sharing stopped' });
  });

  router.post('/:meetingId/toggle-waiting-room', authenticateToken, (req, res) => {
    const { meetingId } = req.params;

    const check = getMeetingAndCheckHost(meetingId, req.user.id);
    if (check.error) return res.status(check.status).json({ error: check.error });
    const meetingDbId = check.meeting.id;

    const newStatus = check.meeting.waiting_room_enabled ? 0 : 1;
    db.prepare('UPDATE meetings SET waiting_room_enabled = ? WHERE id = ?').run(newStatus, meetingDbId);

    addLog(meetingDbId, req.user.id, 'waiting_room_toggled', { enabled: newStatus === 1 });

    res.json({ success: true, waitingRoomEnabled: newStatus === 1 });
  });

  router.post('/:meetingId/leave', authenticateToken, (req, res) => {
    const { meetingId } = req.params;

    let meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meetingId);
    if (!meeting) {
      meeting = db.prepare('SELECT * FROM meetings WHERE meeting_number = ?').get(meetingId);
    }
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    const meetingDbId = meeting.id;

    db.prepare(`
      UPDATE meeting_participants 
      SET leave_time = CURRENT_TIMESTAMP 
      WHERE meeting_id = ? AND user_id = ? AND leave_time IS NULL
    `).run(meetingDbId, req.user.id);

    addLog(meetingDbId, req.user.id, 'participant_left');

    const remaining = db.prepare(`
      SELECT COUNT(*) as count FROM meeting_participants 
      WHERE meeting_id = ? AND leave_time IS NULL
    `).get(meetingDbId);

    if (remaining.count === 0) {
      db.prepare('UPDATE meetings SET status = ?, end_time = CURRENT_TIMESTAMP WHERE id = ?')
        .run('ended', meetingDbId);
      addLog(meetingDbId, null, 'meeting_auto_ended');
    }

    res.json({ success: true, message: 'Left meeting' });
  });

  router.patch('/participant/audio', authenticateToken, (req, res) => {
    const { meetingId, enabled } = req.body;

    let meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meetingId);
    if (!meeting) {
      meeting = db.prepare('SELECT * FROM meetings WHERE meeting_number = ?').get(meetingId);
    }
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    const meetingDbId = meeting.id;

    db.prepare(`
      UPDATE meeting_participants 
      SET audio_enabled = ? 
      WHERE meeting_id = ? AND user_id = ? AND leave_time IS NULL
    `).run(enabled ? 1 : 0, meetingDbId, req.user.id);

    res.json({ success: true });
  });

  router.patch('/participant/video', authenticateToken, (req, res) => {
    const { meetingId, enabled } = req.body;

    let meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meetingId);
    if (!meeting) {
      meeting = db.prepare('SELECT * FROM meetings WHERE meeting_number = ?').get(meetingId);
    }
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    const meetingDbId = meeting.id;

    db.prepare(`
      UPDATE meeting_participants 
      SET video_enabled = ? 
      WHERE meeting_id = ? AND user_id = ? AND leave_time IS NULL
    `).run(enabled ? 1 : 0, meetingDbId, req.user.id);

    res.json({ success: true });
  });

  router.post('/:meetingId/chat', authenticateToken, (req, res) => {
    const { meetingId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    let meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meetingId);
    if (!meeting) {
      meeting = db.prepare('SELECT * FROM meetings WHERE meeting_number = ?').get(meetingId);
    }
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    const meetingDbId = meeting.id;

    db.prepare(`
      INSERT INTO chat_messages (meeting_id, user_id, message)
      VALUES (?, ?, ?)
    `).run(meetingDbId, req.user.id, message.trim());

    addLog(meetingDbId, req.user.id, 'chat_message');

    res.json({ success: true });
  });

  router.get('/:meetingId/chat', authenticateToken, (req, res) => {
    const { meetingId } = req.params;

    let meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meetingId);
    if (!meeting) {
      meeting = db.prepare('SELECT * FROM meetings WHERE meeting_number = ?').get(meetingId);
    }
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    const meetingDbId = meeting.id;

    const messages = db.prepare(`
      SELECT cm.*, u.nickname, u.username
      FROM chat_messages cm
      LEFT JOIN users u ON cm.user_id = u.id
      WHERE cm.meeting_id = ?
      ORDER BY cm.timestamp ASC
    `).all(meetingDbId);

    res.json({ success: true, messages });
  });

  return router;
};
