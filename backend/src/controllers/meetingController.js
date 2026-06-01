const { v4: uuidv4 } = require('uuid');
const { db } = require('../models/database');

const generateMeetingNumber = () => {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
};

const createQuickMeeting = async (req, res) => {
  const { usePersonalId = false, title = '快速会议' } = req.body;
  const userId = req.user.id;

  let meetingNumber;
  if (usePersonalId) {
    const user = db.prepare('SELECT personal_meeting_id FROM users WHERE id = ?').get(userId);
    meetingNumber = user.personal_meeting_id;
  } else {
    meetingNumber = generateMeetingNumber();
  }

  const meetingId = uuidv4();
  const startTime = Date.now();
  const endTime = startTime + 60 * 60 * 1000;

  db.prepare(`
    INSERT INTO meetings (id, meeting_number, title, host_id, start_time, end_time, status, use_personal_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(meetingId, meetingNumber, title, userId, startTime, endTime, 'active', usePersonalId ? 1 : 0, Date.now());

  const settingsId = uuidv4();
  db.prepare(`
    INSERT INTO meeting_settings (id, meeting_id, lock_enabled, waiting_room_enabled, share_permission, chat_permission, record_permission, allow_unmute, red_packet_enabled, audio_enhance, video_enhance)
    VALUES (?, ?, 0, 1, 'host_only', 'all', 'host_only', 1, 0, 0, 0)
  `).run(settingsId, meetingId);

  const participantId = uuidv4();
  db.prepare(`
    INSERT INTO meeting_participants (id, meeting_id, user_id, name, role, status, joined_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(participantId, meetingId, userId, req.user.name, 'host', 'joined', Date.now());

  const meeting = db.prepare(`
    SELECT m.*, ms.* FROM meetings m
    LEFT JOIN meeting_settings ms ON m.id = ms.meeting_id
    WHERE m.id = ?
  `).get(meetingId);

  res.json({
    success: true,
    meeting: {
      id: meeting.id,
      meetingNumber: meeting.meeting_number,
      title: meeting.title,
      hostId: meeting.host_id,
      startTime: meeting.start_time,
      status: meeting.status,
      settings: {
        lockEnabled: meeting.lock_enabled,
        waitingRoomEnabled: meeting.waiting_room_enabled,
        sharePermission: meeting.share_permission,
        chatPermission: meeting.chat_permission,
        recordPermission: meeting.record_permission,
        allowUnmute: meeting.allow_unmute
      }
    },
    participant: {
      id: participantId,
      role: 'host',
      name: req.user.name
    }
  });
};

const scheduleMeeting = async (req, res) => {
  const { title, startTime, endTime, isRecurring = false, recurringRule = '', password = '' } = req.body;
  const userId = req.user.id;

  if (!title || !startTime || !endTime) {
    return res.status(400).json({ error: 'Title, start time and end time required' });
  }

  const meetingNumber = generateMeetingNumber();
  const meetingId = uuidv4();

  db.prepare(`
    INSERT INTO meetings (id, meeting_number, title, host_id, start_time, end_time, is_recurring, recurring_rule, password, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(meetingId, meetingNumber, title, userId, startTime, endTime, isRecurring ? 1 : 0, recurringRule, password, 'scheduled', Date.now());

  const settingsId = uuidv4();
  db.prepare(`
    INSERT INTO meeting_settings (id, meeting_id, lock_enabled, waiting_room_enabled, share_permission, chat_permission, record_permission, allow_unmute, red_packet_enabled, audio_enhance, video_enhance)
    VALUES (?, ?, 0, 1, 'host_only', 'all', 'host_only', 1, 0, 0, 0)
  `).run(settingsId, meetingId);

  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meetingId);

  res.json({
    success: true,
    meeting: {
      id: meeting.id,
      meetingNumber: meeting.meeting_number,
      title: meeting.title,
      hostId: meeting.host_id,
      startTime: meeting.start_time,
      endTime: meeting.end_time,
      isRecurring: meeting.is_recurring === 1,
      recurringRule: meeting.recurring_rule,
      status: meeting.status
    }
  });
};

const getScheduledMeetings = async (req, res) => {
  const userId = req.user.id;

  const meetings = db.prepare(`
    SELECT * FROM meetings 
    WHERE host_id = ? AND status = 'scheduled'
    ORDER BY start_time ASC
  `).all(userId);

  res.json({
    success: true,
    meetings: meetings.map(m => ({
      id: m.id,
      meetingNumber: m.meeting_number,
      title: m.title,
      startTime: m.start_time,
      endTime: m.end_time,
      isRecurring: m.is_recurring === 1,
      status: m.status
    }))
  });
};

const getMeetingHistory = async (req, res) => {
  const userId = req.user.id;

  const history = db.prepare(`
    SELECT mh.*, m.title, m.meeting_number FROM meeting_history mh
    JOIN meetings m ON mh.meeting_id = m.id
    WHERE mh.user_id = ?
    ORDER BY mh.joined_at DESC
    LIMIT 20
  `).all(userId);

  res.json({
    success: true,
    history: history.map(h => ({
      id: h.id,
      meetingId: h.meeting_id,
      meetingNumber: h.meeting_number,
      title: h.title,
      role: h.role,
      joinedAt: h.joined_at,
      leftAt: h.left_at,
      duration: h.duration
    }))
  });
};

const joinMeeting = async (req, res) => {
  const { meetingNumber, password = '' } = req.body;
  const userId = req.user.id;

  const meeting = db.prepare('SELECT * FROM meetings WHERE meeting_number = ?').get(meetingNumber);

  if (!meeting) {
    return res.status(404).json({ error: 'Meeting not found' });
  }

  if (meeting.password && meeting.password !== password) {
    return res.status(403).json({ error: 'Invalid meeting password' });
  }

  if (meeting.status !== 'active') {
    if (meeting.host_id === userId) {
      db.prepare('UPDATE meetings SET status = ? WHERE id = ?').run('active', meeting.id);
    } else {
      return res.status(400).json({ error: 'Meeting is not active' });
    }
  }

  const settings = db.prepare('SELECT * FROM meeting_settings WHERE meeting_id = ?').get(meeting.id);

  const existingParticipant = db.prepare(`
    SELECT * FROM meeting_participants 
    WHERE meeting_id = ? AND user_id = ? AND status = 'joined'
  `).get(meeting.id, userId);

  if (existingParticipant) {
    return res.json({
      success: true,
      meeting: {
        id: meeting.id,
        meetingNumber: meeting.meeting_number,
        title: meeting.title,
        hostId: meeting.host_id
      },
      participant: {
        id: existingParticipant.id,
        role: existingParticipant.role,
        name: existingParticipant.name
      },
      settings: {
        waitingRoomEnabled: settings?.waiting_room_enabled === 1
      }
    });
  }

  const participantId = uuidv4();
  const isInWaitingRoom = settings?.waiting_room_enabled === 1 && meeting.host_id !== userId;

  db.prepare(`
    INSERT INTO meeting_participants (id, meeting_id, user_id, name, role, status, is_in_waiting_room, joined_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(participantId, meeting.id, userId, req.user.name, 'participant', isInWaitingRoom ? 'waiting' : 'joined', isInWaitingRoom ? 1 : 0, Date.now());

  res.json({
    success: true,
    meeting: {
      id: meeting.id,
      meetingNumber: meeting.meeting_number,
      title: meeting.title,
      hostId: meeting.host_id
    },
    participant: {
      id: participantId,
      role: meeting.host_id === userId ? 'host' : 'participant',
      name: req.user.name,
      isInWaitingRoom
    },
    settings: {
      waitingRoomEnabled: settings?.waiting_room_enabled === 1
    }
  });
};

const getParticipants = async (req, res) => {
  const { meetingId } = req.params;

  const participants = db.prepare(`
    SELECT * FROM meeting_participants 
    WHERE meeting_id = ? AND status IN ('joined', 'waiting')
    ORDER BY joined_at ASC
  `).all(meetingId);

  res.json({
    success: true,
    participants: participants.map(p => ({
      id: p.id,
      userId: p.user_id,
      name: p.name,
      role: p.role,
      status: p.status,
      isInWaitingRoom: p.is_in_waiting_room === 1,
      audioEnabled: p.audio_enabled === 1,
      videoEnabled: p.video_enabled === 1
    }))
  });
};

const manageParticipant = async (req, res) => {
  const { meetingId, participantId } = req.params;
  const { action, role } = req.body;

  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meetingId);
  if (!meeting) {
    return res.status(404).json({ error: 'Meeting not found' });
  }

  if (meeting.host_id !== req.user.id) {
    return res.status(403).json({ error: 'Only host can manage participants' });
  }

  switch (action) {
    case 'mute':
      db.prepare('UPDATE meeting_participants SET audio_enabled = 0 WHERE id = ?').run(participantId);
      break;
    case 'unmute':
      db.prepare('UPDATE meeting_participants SET audio_enabled = 1 WHERE id = ?').run(participantId);
      break;
    case 'admit':
      db.prepare('UPDATE meeting_participants SET is_in_waiting_room = 0, status = ? WHERE id = ?').run('joined', participantId);
      break;
    case 'remove':
      db.prepare('UPDATE meeting_participants SET status = ? WHERE id = ?').run('left', participantId);
      break;
    case 'set_cohost':
      db.prepare('UPDATE meeting_participants SET role = ? WHERE id = ?').run('cohost', participantId);
      break;
    default:
      break;
  }

  res.json({ success: true });
};

const muteAll = async (req, res) => {
  const { meetingId } = req.params;
  const { allowUnmuteSelf = true } = req.body;

  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meetingId);
  if (!meeting) {
    return res.status(404).json({ error: 'Meeting not found' });
  }

  if (meeting.host_id !== req.user.id) {
    return res.status(403).json({ error: 'Only host can mute all' });
  }

  db.prepare(`
    UPDATE meeting_participants 
    SET audio_enabled = 0 
    WHERE meeting_id = ? AND role != 'host'
  `).run(meetingId);

  db.prepare('UPDATE meeting_settings SET allow_unmute = ? WHERE meeting_id = ?').run(allowUnmuteSelf ? 1 : 0, meetingId);

  res.json({ success: true });
};

const endMeeting = async (req, res) => {
  const { meetingId } = req.params;

  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meetingId);
  if (!meeting) {
    return res.status(404).json({ error: 'Meeting not found' });
  }

  if (meeting.host_id !== req.user.id) {
    return res.status(403).json({ error: 'Only host can end meeting' });
  }

  db.prepare('UPDATE meetings SET status = ?, end_time = ? WHERE id = ?').run('ended', Date.now(), meetingId);

  db.prepare(`
    UPDATE meeting_participants 
    SET status = ?, left_at = ? 
    WHERE meeting_id = ? AND status = 'joined'
  `).run('left', Date.now(), meetingId);

  const participants = db.prepare(`
    SELECT * FROM meeting_participants WHERE meeting_id = ?
  `).all(meetingId);

  for (const p of participants) {
    if (p.user_id) {
      const historyId = uuidv4();
      const duration = p.joined_at ? Math.floor((Date.now() - p.joined_at) / 1000) : 0;
      db.prepare(`
        INSERT INTO meeting_history (id, user_id, meeting_id, role, joined_at, left_at, duration)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(historyId, p.user_id, meetingId, p.role, p.joined_at, Date.now(), duration);
    }
  }

  res.json({ success: true });
};

const getMeetingSettings = async (req, res) => {
  const { meetingId } = req.params;

  const settings = db.prepare('SELECT * FROM meeting_settings WHERE meeting_id = ?').get(meetingId);
  if (!settings) {
    return res.status(404).json({ error: 'Meeting settings not found' });
  }

  res.json({
    success: true,
    settings: {
      lockEnabled: settings.lock_enabled === 1,
      waitingRoomEnabled: settings.waiting_room_enabled === 1,
      sharePermission: settings.share_permission,
      chatPermission: settings.chat_permission,
      recordPermission: settings.record_permission,
      allowUnmute: settings.allow_unmute === 1,
      redPacketEnabled: settings.red_packet_enabled === 1,
      audioEnhance: settings.audio_enhance === 1,
      videoEnhance: settings.video_enhance === 1
    }
  });
};

const updateMeetingSettings = async (req, res) => {
  const { meetingId } = req.params;
  const {
    lockEnabled,
    waitingRoomEnabled,
    sharePermission,
    chatPermission,
    recordPermission,
    allowUnmute,
    redPacketEnabled,
    audioEnhance,
    videoEnhance
  } = req.body;

  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meetingId);
  if (!meeting) {
    return res.status(404).json({ error: 'Meeting not found' });
  }

  if (meeting.host_id !== req.user.id) {
    return res.status(403).json({ error: 'Only host can update settings' });
  }

  db.prepare(`
    UPDATE meeting_settings SET
      lock_enabled = ?,
      waiting_room_enabled = ?,
      share_permission = ?,
      chat_permission = ?,
      record_permission = ?,
      allow_unmute = ?,
      red_packet_enabled = ?,
      audio_enhance = ?,
      video_enhance = ?
    WHERE meeting_id = ?
  `).run(
    lockEnabled ? 1 : 0,
    waitingRoomEnabled ? 1 : 0,
    sharePermission || 'host_only',
    chatPermission || 'all',
    recordPermission || 'host_only',
    allowUnmute ? 1 : 0,
    redPacketEnabled ? 1 : 0,
    audioEnhance ? 1 : 0,
    videoEnhance ? 1 : 0,
    meetingId
  );

  res.json({ success: true });
};

const inviteParticipant = async (req, res) => {
  const { meetingId } = req.params;
  const { name } = req.body;

  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meetingId);
  if (!meeting) {
    return res.status(404).json({ error: 'Meeting not found' });
  }

  const participantId = uuidv4();
  db.prepare(`
    INSERT INTO meeting_participants (id, meeting_id, name, role, status, joined_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(participantId, meetingId, name || '受邀用户', 'participant', 'joined', Date.now());

  res.json({
    success: true,
    participant: {
      id: participantId,
      name,
      role: 'participant'
    }
  });
};

module.exports = {
  createQuickMeeting,
  scheduleMeeting,
  getScheduledMeetings,
  getMeetingHistory,
  joinMeeting,
  getParticipants,
  manageParticipant,
  muteAll,
  endMeeting,
  getMeetingSettings,
  updateMeetingSettings,
  inviteParticipant
};
