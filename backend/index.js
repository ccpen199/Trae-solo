require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const db = require('./db');
const http = require('http');
const path = require('path');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT) || 53410;
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

app.use(cors({ origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 43410}`, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);

app.use((req, res, next) => {
  req.rawBody = '';
  req.on('data', (chunk) => { req.rawBody += chunk; });
  next();
});

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: '登录已过期' });
  }
}

function checkRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
}

function checkRateLimit(userId, action, limit = 20) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - 60 * 1000);
  const record = db.prepare('SELECT * FROM rate_limits WHERE user_id = ? AND action = ?').get(userId, action);
  if (!record) {
    db.prepare('INSERT INTO rate_limits (user_id, action, count, window_start) VALUES (?, ?, 1, ?)').run(userId, action, now.toISOString());
    return true;
  }
  if (new Date(record.window_start) < windowStart) {
    db.prepare('UPDATE rate_limits SET count = 1, window_start = ? WHERE id = ?').run(now.toISOString(), record.id);
    return true;
  }
  if (record.count >= limit) {
    return false;
  }
  db.prepare('UPDATE rate_limits SET count = count + 1 WHERE id = ?').run(record.id);
  return true;
}

function auditLog(userId, action, targetType, targetId, details, ipAddress) {
  db.prepare('INSERT INTO audit_logs (user_id, action, target_type, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
    .run(userId, action, targetType, targetId, details || '', ipAddress || '');
}

function checkSensitiveContent(content) {
  const words = db.prepare('SELECT * FROM sensitive_words').all();
  for (const w of words) {
    if (content.includes(w.word)) {
      return { hit: true, word: w.word, severity: w.severity };
    }
  }
  return { hit: false };
}

function getConversationLastMessage(convId) {
  return db.prepare(`
    SELECT m.*, u.nickname as sender_name
    FROM messages m
    LEFT JOIN users u ON m.sender_id = u.id
    WHERE m.conversation_id = ?
    ORDER BY m.created_at DESC
    LIMIT 1
  `).get(convId);
}

function getUnreadCount(convId, userId) {
  const member = db.prepare('SELECT * FROM conversation_members WHERE conversation_id = ? AND user_id = ?').get(convId, userId);
  if (!member) return 0;
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM messages
    WHERE conversation_id = ? AND sender_id != ? AND created_at > ? AND is_recalled = 0
  `).get(convId, userId, member.last_read_at);
  return result.count;
}

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' });
  }
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  if (user.status !== 'active') {
    return res.status(403).json({ error: '账号已被禁用' });
  }
  const token = generateToken(user);
  auditLog(user.id, 'login', 'user', user.id, '用户登录', req.ip);
  res.json({ token, user: { id: user.id, username: user.username, nickname: user.nickname, avatar: user.avatar, role: user.role } });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, username, nickname, avatar, role, status FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json(user);
});

app.get('/api/conversations', authMiddleware, (req, res) => {
  const { type, keyword, is_archived } = req.query;
  let sql = `
    SELECT c.*, cm.is_muted, cm.is_blocked, cm.last_read_at
    FROM conversations c
    INNER JOIN conversation_members cm ON c.id = cm.conversation_id
    WHERE cm.user_id = ?
  `;
  const params = [req.user.id];
  if (type && type !== 'all') {
    sql += ' AND c.type = ?';
    params.push(type);
  }
  if (keyword) {
    sql += ' AND (c.name LIKE ? OR c.id IN (SELECT conversation_id FROM messages WHERE content LIKE ?))';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (is_archived !== undefined) {
    sql += ' AND c.is_archived = ?';
    params.push(is_archived === 'true' ? 1 : 0);
  } else {
    sql += ' AND c.is_archived = 0';
  }
  sql += ' ORDER BY c.is_pinned DESC, c.updated_at DESC';
  const conversations = db.prepare(sql).all(...params);
  const result = conversations.map(conv => {
    const lastMsg = getConversationLastMessage(conv.id);
    const unread = getUnreadCount(conv.id, req.user.id);
    const memberCount = db.prepare('SELECT COUNT(*) as count FROM conversation_members WHERE conversation_id = ?').get(conv.id).count;
    const members = db.prepare(`
      SELECT u.id, u.username, u.nickname, u.avatar, cm.is_blocked
      FROM conversation_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.conversation_id = ?
    `).all(conv.id);
    return { ...conv, last_message: lastMsg, unread_count: unread, member_count: memberCount, members };
  });
  res.json(result);
});

app.post('/api/conversations', authMiddleware, (req, res) => {
  const { type, name, member_ids } = req.body;
  if (!type || !member_ids || !Array.isArray(member_ids)) {
    return res.status(400).json({ error: '参数错误' });
  }
  const allIds = [req.user.id, ...member_ids.filter(id => id !== req.user.id)];
  if (type === 'direct' && allIds.length !== 2) {
    return res.status(400).json({ error: '单聊必须有且仅有两个用户' });
  }
  if (type === 'direct') {
    const existing = db.prepare(`
      SELECT c.* FROM conversations c
      INNER JOIN conversation_members cm1 ON c.id = cm1.conversation_id
      INNER JOIN conversation_members cm2 ON c.id = cm2.conversation_id
      WHERE c.type = 'direct' AND cm1.user_id = ? AND cm2.user_id = ?
    `).get(allIds[0], allIds[1]);
    if (existing) {
      return res.json(existing);
    }
  }
  const insertConv = db.prepare('INSERT INTO conversations (type, name) VALUES (?, ?)');
  const result = insertConv.run(type, name || '');
  const convId = result.lastInsertRowid;
  const addMember = db.prepare('INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)');
  const addMembers = db.transaction((ids) => {
    for (const id of ids) addMember.run(convId, id);
  });
  addMembers(allIds);
  auditLog(req.user.id, 'create_conversation', 'conversation', convId, `创建${type === 'direct' ? '单聊' : type === 'group' ? '群聊' : '客服会话'}`, req.ip);
  res.json({ id: convId, type, name, member_ids: allIds });
});

app.put('/api/conversations/:id/pin', authMiddleware, (req, res) => {
  const { is_pinned } = req.body;
  db.prepare('UPDATE conversations SET is_pinned = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(is_pinned ? 1 : 0, req.params.id);
  auditLog(req.user.id, 'pin_conversation', 'conversation', req.params.id, is_pinned ? '置顶会话' : '取消置顶', req.ip);
  res.json({ success: true });
});

app.put('/api/conversations/:id/archive', authMiddleware, (req, res) => {
  const { is_archived } = req.body;
  db.prepare('UPDATE conversations SET is_archived = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(is_archived ? 1 : 0, req.params.id);
  auditLog(req.user.id, 'archive_conversation', 'conversation', req.params.id, is_archived ? '归档会话' : '取消归档', req.ip);
  res.json({ success: true });
});

app.put('/api/conversations/:id/block', authMiddleware, (req, res) => {
  const { is_blocked, target_user_id } = req.body;
  if (is_blocked) {
    db.prepare('INSERT OR IGNORE INTO blacklist (user_id, blocked_user_id, reason) VALUES (?, ?, ?)')
      .run(req.user.id, target_user_id, req.body.reason || '');
  } else {
    db.prepare('DELETE FROM blacklist WHERE user_id = ? AND blocked_user_id = ?').run(req.user.id, target_user_id);
  }
  db.prepare('UPDATE conversation_members SET is_blocked = ? WHERE conversation_id = ? AND user_id = ?')
    .run(is_blocked ? 1 : 0, req.params.id, target_user_id);
  auditLog(req.user.id, is_blocked ? 'block_user' : 'unblock_user', 'user', target_user_id, is_blocked ? '屏蔽用户' : '取消屏蔽', req.ip);
  res.json({ success: true });
});

app.put('/api/conversations/:id/read', authMiddleware, (req, res) => {
  db.prepare('UPDATE conversation_members SET last_read_at = CURRENT_TIMESTAMP WHERE conversation_id = ? AND user_id = ?')
    .run(req.params.id, req.user.id);
  res.json({ success: true });
});

app.get('/api/conversations/:id/messages', authMiddleware, (req, res) => {
  const { page = 1, page_size = 50 } = req.query;
  const offset = (page - 1) * page_size;
  const messages = db.prepare(`
    SELECT m.*, u.nickname as sender_name, u.avatar as sender_avatar
    FROM messages m
    LEFT JOIN users u ON m.sender_id = u.id
    WHERE m.conversation_id = ?
    ORDER BY m.created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.params.id, parseInt(page_size), offset);
  const total = db.prepare('SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?').get(req.params.id).count;
  res.json({ list: messages.reverse(), total, page: parseInt(page), page_size: parseInt(page_size) });
});

app.post('/api/messages', authMiddleware, (req, res) => {
  const { conversation_id, type, content, receiver_id } = req.body;
  if (!conversation_id || !type || !content) {
    return res.status(400).json({ error: '参数不完整' });
  }
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversation_id);
  if (!conv) return res.status(404).json({ error: '会话不存在' });
  const isMember = db.prepare('SELECT * FROM conversation_members WHERE conversation_id = ? AND user_id = ?')
    .get(conversation_id, req.user.id);
  if (!isMember) return res.status(403).json({ error: '不是会话成员' });
  if (isMember.is_blocked) return res.status(403).json({ error: '您已被屏蔽' });
  if (conv.type === 'direct') {
    const otherMember = db.prepare(`
      SELECT cm.* FROM conversation_members cm
      WHERE cm.conversation_id = ? AND cm.user_id != ?
    `).get(conversation_id, req.user.id);
    if (otherMember) {
      const blacklisted = db.prepare('SELECT * FROM blacklist WHERE user_id = ? AND blocked_user_id = ?')
        .get(otherMember.user_id, req.user.id);
      if (blacklisted) return res.status(403).json({ error: '对方已将您加入黑名单' });
      const friendship = db.prepare(`
        SELECT * FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
      `).get(req.user.id, otherMember.user_id, otherMember.user_id, req.user.id);
      if (!friendship || friendship.status !== 'accepted') {
        return res.status(403).json({ error: '您不是对方的好友' });
      }
    }
  }
  if (!checkRateLimit(req.user.id, 'send_message', parseInt(process.env.RATE_LIMIT_PER_MINUTE) || 20)) {
    return res.status(429).json({ error: '发送过于频繁，请稍后再试' });
  }
  const sensitiveCheck = checkSensitiveContent(content);
  if (sensitiveCheck.hit && sensitiveCheck.severity >= 3) {
    db.prepare('INSERT INTO reports (reporter_id, reported_user_id, reason, description, status) VALUES (?, ?, ?, ?, ?)')
      .run(0, req.user.id, '敏感内容检测', `检测到敏感词: ${sensitiveCheck.word}`, 'pending');
    return res.status(400).json({ error: '消息包含敏感内容，已被拦截' });
  }
  const insertMsg = db.prepare(`
    INSERT INTO messages (conversation_id, sender_id, receiver_id, type, content, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const status = sensitiveCheck.hit ? 'delivered' : 'sent';
  const result = insertMsg.run(conversation_id, req.user.id, receiver_id || null, type, content, status);
  db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(conversation_id);
  auditLog(req.user.id, 'send_message', 'message', result.lastInsertRowid, `发送${type}消息`, req.ip);
  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);
  res.json({ ...message, hit_sensitive: sensitiveCheck.hit });
});

app.put('/api/messages/:id/recall', authMiddleware, (req, res) => {
  const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id);
  if (!msg) return res.status(404).json({ error: '消息不存在' });
  if (msg.sender_id !== req.user.id) return res.status(403).json({ error: '只能撤回自己的消息' });
  const now = new Date();
  const created = new Date(msg.created_at);
  if ((now - created) > 120000) {
    return res.status(400).json({ error: '超过撤回时间（2分钟）' });
  }
  db.prepare('UPDATE messages SET is_recalled = 1, status = ? WHERE id = ?').run('recalled', req.params.id);
  auditLog(req.user.id, 'recall_message', 'message', req.params.id, '撤回消息', req.ip);
  res.json({ success: true });
});

app.get('/api/messages/:id/status', authMiddleware, (req, res) => {
  const statuses = db.prepare(`
    SELECT ms.*, u.username, u.nickname
    FROM message_status ms
    JOIN users u ON ms.user_id = u.id
    WHERE ms.message_id = ?
  `).all(req.params.id);
  res.json(statuses);
});

app.put('/api/messages/:id/delivered', authMiddleware, (req, res) => {
  const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id);
  if (!msg) return res.status(404).json({ error: '消息不存在' });
  db.prepare('UPDATE messages SET status = ? WHERE id = ? AND status IN (?, ?)')
    .run('delivered', req.params.id, 'sent', 'failed');
  db.prepare('INSERT OR IGNORE INTO message_status (message_id, user_id, status) VALUES (?, ?, ?)')
    .run(req.params.id, req.user.id, 'delivered');
  res.json({ success: true });
});

app.put('/api/messages/:id/read', authMiddleware, (req, res) => {
  const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id);
  if (!msg) return res.status(404).json({ error: '消息不存在' });
  db.prepare('UPDATE messages SET status = ? WHERE id = ?').run('read', req.params.id);
  db.prepare('INSERT OR REPLACE INTO message_status (message_id, user_id, status, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)')
    .run(req.params.id, req.user.id, 'read');
  res.json({ success: true });
});

app.get('/api/friends', authMiddleware, (req, res) => {
  const friends = db.prepare(`
    SELECT u.id, u.username, u.nickname, u.avatar, u.status, f.status as friendship_status
    FROM friendships f
    JOIN users u ON (f.user_id = ? AND f.friend_id = u.id) OR (f.friend_id = ? AND f.user_id = u.id)
    WHERE (f.user_id = ? OR f.friend_id = ?) AND u.id != ?
  `).all(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id);
  res.json(friends);
});

app.post('/api/friends/request', authMiddleware, (req, res) => {
  const { friend_id } = req.body;
  if (!friend_id || friend_id === req.user.id) {
    return res.status(400).json({ error: '参数错误' });
  }
  const existing = db.prepare(`
    SELECT * FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
  `).get(req.user.id, friend_id, friend_id, req.user.id);
  if (existing) return res.status(400).json({ error: '已存在好友关系' });
  db.prepare('INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, ?)').run(req.user.id, friend_id, 'pending');
  auditLog(req.user.id, 'friend_request', 'user', friend_id, '发送好友请求', req.ip);
  res.json({ success: true });
});

app.put('/api/friends/:id/accept', authMiddleware, (req, res) => {
  db.prepare('UPDATE friendships SET status = ? WHERE id = ? AND friend_id = ?').run('accepted', req.params.id, req.user.id);
  auditLog(req.user.id, 'accept_friend', 'friendship', req.params.id, '接受好友请求', req.ip);
  res.json({ success: true });
});

app.delete('/api/friends/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM friendships WHERE id = ? AND (user_id = ? OR friend_id = ?)')
    .run(req.params.id, req.user.id, req.user.id);
  auditLog(req.user.id, 'delete_friend', 'friendship', req.params.id, '删除好友', req.ip);
  res.json({ success: true });
});

app.get('/api/reports', authMiddleware, checkRoles('moderator', 'admin'), (req, res) => {
  const { status, page = 1, page_size = 20 } = req.query;
  let sql = `
    SELECT r.*,
      reporter.username as reporter_name,
      reported.username as reported_name,
      reported.nickname as reported_nickname,
      moderator.username as moderator_name,
      m.content as message_content
    FROM reports r
    LEFT JOIN users reporter ON r.reporter_id = reporter.id
    LEFT JOIN users reported ON r.reported_user_id = reported.id
    LEFT JOIN users moderator ON r.moderator_id = moderator.id
    LEFT JOIN messages m ON r.message_id = m.id
    WHERE 1=1
  `;
  const params = [];
  if (status && status !== 'all') {
    sql += ' AND r.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), (page - 1) * page_size);
  const reports = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM reports' + (status && status !== 'all' ? ' WHERE status = ?' : '')).get(...(status && status !== 'all' ? [status] : [])).count;
  res.json({ list: reports, total, page: parseInt(page), page_size: parseInt(page_size) });
});

app.post('/api/reports', authMiddleware, (req, res) => {
  const { reported_user_id, message_id, reason, description } = req.body;
  if (!reported_user_id || !reason) {
    return res.status(400).json({ error: '参数不完整' });
  }
  db.prepare(`INSERT INTO reports (reporter_id, reported_user_id, message_id, reason, description, status) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user.id, reported_user_id, message_id || null, reason, description || '', 'pending');
  auditLog(req.user.id, 'create_report', 'report', null, `举报用户: ${reason}`, req.ip);
  res.json({ success: true });
});

app.put('/api/reports/:id/process', authMiddleware, checkRoles('moderator', 'admin'), (req, res) => {
  const { action, action_note, punish_type, duration } = req.body;
  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  if (!report) return res.status(404).json({ error: '举报不存在' });
  db.prepare('UPDATE reports SET status = ?, moderator_id = ?, action = ?, action_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run('resolved', req.user.id, action || '', action_note || '', req.params.id);
  if (punish_type) {
    db.prepare('INSERT INTO punishments (user_id, report_id, type, reason, duration, expires_at, moderator_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(report.reported_user_id, req.params.id, punish_type, action_note || '', duration || 0,
        duration ? new Date(Date.now() + duration * 60 * 1000).toISOString() : null, req.user.id);
    if (punish_type === 'ban') {
      db.prepare('UPDATE users SET status = ? WHERE id = ?').run('banned', report.reported_user_id);
    } else if (punish_type === 'mute') {
      db.prepare('UPDATE users SET status = ? WHERE id = ?').run('muted', report.reported_user_id);
    }
  }
  if (action === 'delete_message' && report.message_id) {
    db.prepare('UPDATE messages SET content = ?, is_recalled = 1 WHERE id = ?').run('[已删除]', report.message_id);
  }
  auditLog(req.user.id, 'process_report', 'report', req.params.id, `处理举报: ${action}`, req.ip);
  res.json({ success: true });
});

app.get('/api/punishments', authMiddleware, checkRoles('moderator', 'admin'), (req, res) => {
  const { page = 1, page_size = 20 } = req.query;
  const punishments = db.prepare(`
    SELECT p.*, u.username as user_name, u.nickname as user_nickname,
      moderator.username as moderator_name
    FROM punishments p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN users moderator ON p.moderator_id = moderator.id
    ORDER BY p.created_at DESC LIMIT ? OFFSET ?
  `).all(parseInt(page_size), (page - 1) * page_size);
  const total = db.prepare('SELECT COUNT(*) as count FROM punishments').get().count;
  res.json({ list: punishments, total, page: parseInt(page), page_size: parseInt(page_size) });
});

app.get('/api/statistics/overview', authMiddleware, checkRoles('moderator', 'admin', 'cs'), (req, res) => {
  const { start_date, end_date } = req.query;
  const dateCondition = start_date && end_date
    ? `AND created_at BETWEEN '${start_date}' AND '${end_date}'` : '';
  const stats = {
    total_conversations: db.prepare('SELECT COUNT(*) as count FROM conversations').get().count,
    total_messages: db.prepare(`SELECT COUNT(*) as count FROM messages WHERE 1=1 ${dateCondition}`).get().count,
    failed_messages: db.prepare(`SELECT COUNT(*) as count FROM messages WHERE status = 'failed' ${dateCondition}`).get().count,
    recalled_messages: db.prepare(`SELECT COUNT(*) as count FROM messages WHERE is_recalled = 1 ${dateCondition}`).get().count,
    total_reports: db.prepare(`SELECT COUNT(*) as count FROM reports WHERE 1=1 ${dateCondition}`).get().count,
    pending_reports: db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'").get().count,
    total_users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
    active_users: db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'active'").get().count,
    blocked_count: db.prepare('SELECT COUNT(*) as count FROM blacklist').get().count,
    total_punishments: db.prepare(`SELECT COUNT(*) as count FROM punishments WHERE 1=1 ${dateCondition}`).get().count,
    cs_sessions: db.prepare("SELECT COUNT(*) as count FROM conversations WHERE type = 'cs'").get().count,
  };
  res.json(stats);
});

app.get('/api/statistics/trend', authMiddleware, checkRoles('moderator', 'admin', 'cs'), (req, res) => {
  const { days = 7 } = req.query;
  const n = parseInt(days);
  const daysAgo = new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  const trend = [];
  for (let i = 0; i < n; i++) {
    const day = new Date(daysAgo.getTime() + i * 24 * 60 * 60 * 1000);
    const dayStr = day.toISOString().split('T')[0];
    const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    trend.push({
      date: dayStr,
      messages: db.prepare(`SELECT COUNT(*) as count FROM messages WHERE created_at >= ? AND created_at < ?`).get(dayStr, nextDay).count,
      reports: db.prepare(`SELECT COUNT(*) as count FROM reports WHERE created_at >= ? AND created_at < ?`).get(dayStr, nextDay).count,
      active_users: db.prepare(`SELECT COUNT(DISTINCT user_id) as count FROM audit_logs WHERE action = 'login' AND created_at >= ? AND created_at < ?`).get(dayStr, nextDay).count,
    });
  }
  res.json(trend);
});

app.get('/api/statistics/cs-response', authMiddleware, checkRoles('moderator', 'admin', 'cs'), (req, res) => {
  const csSessions = db.prepare(`
    SELECT c.id, c.name, c.created_at, c.updated_at,
      COUNT(m.id) as message_count,
      MIN(CASE WHEN m.sender_id != cs_user.id THEN m.created_at END) as first_user_msg,
      MIN(CASE WHEN m.sender_id = cs_user.id THEN m.created_at END) as first_cs_msg
    FROM conversations c
    JOIN messages m ON c.id = m.conversation_id
    JOIN conversation_members cm ON c.id = cm.conversation_id
    JOIN users cs_user ON cm.user_id = cs_user.id AND cs_user.role = 'cs'
    WHERE c.type = 'cs'
    GROUP BY c.id
    ORDER BY c.created_at DESC
    LIMIT 50
  `).all();
  const sessions = csSessions.map(s => {
    let responseTime = null;
    if (s.first_user_msg && s.first_cs_msg) {
      responseTime = (new Date(s.first_cs_msg) - new Date(s.first_user_msg)) / 1000;
    }
    return { ...s, response_time_seconds: responseTime };
  });
  const avgResponseTime = sessions.filter(s => s.response_time_seconds !== null)
    .reduce((sum, s) => sum + s.response_time_seconds, 0) / (sessions.filter(s => s.response_time_seconds !== null).length || 1);
  res.json({ sessions, avg_response_time: Math.round(avgResponseTime) });
});

app.get('/api/users', authMiddleware, checkRoles('admin', 'moderator'), (req, res) => {
  const { keyword, role, page = 1, page_size = 20 } = req.query;
  let sql = 'SELECT id, username, nickname, avatar, role, status, created_at FROM users WHERE 1=1';
  const params = [];
  if (keyword) {
    sql += ' AND (username LIKE ? OR nickname LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (role && role !== 'all') {
    sql += ' AND role = ?';
    params.push(role);
  }
  sql += ' ORDER BY id LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), (page - 1) * page_size);
  const users = db.prepare(sql).all(...params);
  const totalSql = 'SELECT COUNT(*) as count FROM users WHERE 1=1' + (keyword ? ' AND (username LIKE ? OR nickname LIKE ?)' : '') + (role && role !== 'all' ? ' AND role = ?' : '');
  const totalParams = [];
  if (keyword) totalParams.push(`%${keyword}%`, `%${keyword}%`);
  if (role && role !== 'all') totalParams.push(role);
  const total = db.prepare(totalSql).get(...totalParams).count;
  res.json({ list: users, total, page: parseInt(page), page_size: parseInt(page_size) });
});

app.get('/api/users/search', authMiddleware, (req, res) => {
  const { keyword } = req.query;
  if (!keyword) return res.json([]);
  const users = db.prepare(`
    SELECT id, username, nickname, avatar, role FROM users
    WHERE username LIKE ? OR nickname LIKE ?
    LIMIT 20
  `).all(`%${keyword}%`, `%${keyword}%`);
  res.json(users);
});

app.get('/api/audit-logs', authMiddleware, checkRoles('admin'), (req, res) => {
  const { page = 1, page_size = 50 } = req.query;
  const logs = db.prepare(`
    SELECT al.*, u.username
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC LIMIT ? OFFSET ?
  `).all(parseInt(page_size), (page - 1) * page_size);
  const total = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count;
  res.json({ list: logs, total, page: parseInt(page), page_size: parseInt(page_size) });
});

app.get('/api/sensitive-words', authMiddleware, checkRoles('admin', 'moderator'), (req, res) => {
  const words = db.prepare('SELECT * FROM sensitive_words ORDER BY severity DESC').all();
  res.json(words);
});

app.post('/api/sensitive-words', authMiddleware, checkRoles('admin'), (req, res) => {
  const { word, severity, category } = req.body;
  if (!word) return res.status(400).json({ error: '敏感词不能为空' });
  try {
    db.prepare('INSERT INTO sensitive_words (word, severity, category) VALUES (?, ?, ?)').run(word, severity || 1, category || '');
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: '敏感词已存在' });
  }
});

app.delete('/api/sensitive-words/:id', authMiddleware, checkRoles('admin'), (req, res) => {
  db.prepare('DELETE FROM sensitive_words WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[Backend] 私信消息系统后端服务已启动`);
  console.log(`[Backend] 监听地址: http://127.0.0.1:${PORT}`);
  console.log(`[Backend] API基础路径: http://127.0.0.1:${PORT}/api`);
});
