import express from 'express';
import db from '../database/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { rateLimit, checkBatchFollowRisk } from '../middleware/rateLimit.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/following', (req, res) => {
  const { page = 1, pageSize = 20, sortBy = 'updated_at' } = req.query;
  const offset = (page - 1) * pageSize;

  const orderColumn = sortBy === 'intimacy_score' ? 'r.intimacy_score' : 'r.updated_at';
  const list = db.prepare(`
    SELECT 
      u.id, u.username, u.nickname, u.avatar, u.bio,
      r.intimacy_score, r.updated_at,
      CASE WHEN r2.id IS NOT NULL THEN 1 ELSE 0 END as is_mutual
    FROM relations r
    JOIN users u ON r.following_id = u.id
    LEFT JOIN relations r2 ON r2.follower_id = u.id AND r2.following_id = r.follower_id AND r2.status = 1
    WHERE r.follower_id = ? AND r.status = 1
    ORDER BY ${orderColumn} DESC
    LIMIT ? OFFSET ?
  `).all(req.user.id, parseInt(pageSize), offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM relations WHERE follower_id = ? AND status = 1').get(req.user.id).count;

  res.json({ list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/followers', (req, res) => {
  const { page = 1, pageSize = 20, sortBy = 'updated_at' } = req.query;
  const offset = (page - 1) * pageSize;

  const orderColumn = sortBy === 'intimacy_score' ? 'r.intimacy_score' : 'r.updated_at';
  const list = db.prepare(`
    SELECT 
      u.id, u.username, u.nickname, u.avatar, u.bio,
      r.intimacy_score, r.updated_at,
      CASE WHEN r2.id IS NOT NULL THEN 1 ELSE 0 END as is_following
    FROM relations r
    JOIN users u ON r.follower_id = u.id
    LEFT JOIN relations r2 ON r2.follower_id = ? AND r2.following_id = u.id AND r2.status = 1
    WHERE r.following_id = ? AND r.status = 1
    ORDER BY ${orderColumn} DESC
    LIMIT ? OFFSET ?
  `).all(req.user.id, req.user.id, parseInt(pageSize), offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM relations WHERE following_id = ? AND status = 1').get(req.user.id).count;

  res.json({ list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/friends', (req, res) => {
  const { page = 1, pageSize = 20, sortBy = 'updated_at' } = req.query;
  const offset = (page - 1) * pageSize;

  const orderColumn = sortBy === 'intimacy_score' ? 'f.intimacy_score' : 'f.updated_at';
  const list = db.prepare(`
    SELECT 
      u.id, u.username, u.nickname, u.avatar, u.bio,
      f.intimacy_score, f.updated_at
    FROM friendships f
    JOIN users u ON (f.user_id1 = u.id OR f.user_id2 = u.id) AND u.id != ?
    WHERE (f.user_id1 = ? OR f.user_id2 = ?) AND f.status = 1
    ORDER BY ${orderColumn} DESC
    LIMIT ? OFFSET ?
  `).all(req.user.id, req.user.id, req.user.id, parseInt(pageSize), offset);

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM friendships 
    WHERE (user_id1 = ? OR user_id2 = ?) AND status = 1
  `).get(req.user.id, req.user.id).count;

  res.json({ list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/blacklist', (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;

  const list = db.prepare(`
    SELECT u.id, u.username, u.nickname, u.avatar, b.reason, b.created_at
    FROM blacklist b
    JOIN users u ON b.blocked_user_id = u.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.user.id, parseInt(pageSize), offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM blacklist WHERE user_id = ?').get(req.user.id).count;

  res.json({ list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/mutual/:userId', (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  const targetUserId = parseInt(req.params.userId);

  const list = db.prepare(`
    SELECT u.id, u.username, u.nickname, u.avatar
    FROM relations r1
    JOIN relations r2 ON r1.following_id = r2.following_id
    JOIN users u ON r1.following_id = u.id
    WHERE r1.follower_id = ? AND r2.follower_id = ? AND r1.status = 1 AND r2.status = 1
    LIMIT ? OFFSET ?
  `).all(req.user.id, targetUserId, parseInt(pageSize), offset);

  const total = db.prepare(`
    SELECT COUNT(*) as count
    FROM relations r1
    JOIN relations r2 ON r1.following_id = r2.following_id
    WHERE r1.follower_id = ? AND r2.follower_id = ? AND r1.status = 1 AND r2.status = 1
  `).get(req.user.id, targetUserId).count;

  res.json({ list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.post('/follow/:userId', rateLimit('follow'), (req, res) => {
  const targetUserId = parseInt(req.params.userId);

  if (targetUserId === req.user.id) {
    return res.status(400).json({ error: '不能关注自己' });
  }

  const targetUser = db.prepare('SELECT id, privacy_setting, status FROM users WHERE id = ?').get(targetUserId);
  if (!targetUser || targetUser.status !== 1) {
    return res.status(404).json({ error: '用户不存在或已被禁用' });
  }

  const isBlocked = db.prepare('SELECT id FROM blacklist WHERE user_id = ? AND blocked_user_id = ?').get(targetUserId, req.user.id);
  if (isBlocked) {
    return res.status(403).json({ error: '无法关注该用户' });
  }

  const existing = db.prepare('SELECT id, status FROM relations WHERE follower_id = ? AND following_id = ?').get(req.user.id, targetUserId);

  if (existing) {
    if (existing.status === 1) {
      return res.status(400).json({ error: '已经关注了该用户' });
    }
    db.prepare('UPDATE relations SET status = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(existing.id);
  } else {
    db.prepare(`
      INSERT INTO relations (follower_id, following_id, status)
      VALUES (?, ?, 1)
    `).run(req.user.id, targetUserId);
  }

  db.prepare(`
    INSERT INTO action_logs (user_id, action, target_id, details)
    VALUES (?, 'follow', ?, ?)
  `).run(req.user.id, targetUserId, JSON.stringify({}));

  checkBatchFollowRisk(req.user.id);

  const isMutual = db.prepare('SELECT id FROM relations WHERE follower_id = ? AND following_id = ? AND status = 1').get(targetUserId, req.user.id);
  if (isMutual) {
    const existingFriendship = db.prepare(`
      SELECT id FROM friendships 
      WHERE (user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?)
    `).get(req.user.id, targetUserId, targetUserId, req.user.id);

    if (!existingFriendship) {
      db.prepare(`
        INSERT INTO friendships (user_id1, user_id2, status)
        VALUES (?, ?, 1)
      `).run(Math.min(req.user.id, targetUserId), Math.max(req.user.id, targetUserId));
    } else {
      db.prepare(`
        UPDATE friendships SET status = 1, updated_at = CURRENT_TIMESTAMP
        WHERE (user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?)
      `).run(req.user.id, targetUserId, targetUserId, req.user.id);
    }
  }

  res.json({ success: true, isMutual: !!isMutual });
});

router.post('/unfollow/:userId', rateLimit('unfollow'), (req, res) => {
  const targetUserId = parseInt(req.params.userId);

  db.prepare('UPDATE relations SET status = 0, updated_at = CURRENT_TIMESTAMP WHERE follower_id = ? AND following_id = ?').run(req.user.id, targetUserId);
  db.prepare('UPDATE friendships SET status = 0, updated_at = CURRENT_TIMESTAMP WHERE (user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?)').run(req.user.id, targetUserId, targetUserId, req.user.id);

  db.prepare(`
    INSERT INTO action_logs (user_id, action, target_id, details)
    VALUES (?, 'unfollow', ?, ?)
  `).run(req.user.id, targetUserId, JSON.stringify({}));

  res.json({ success: true });
});

router.post('/block/:userId', authMiddleware, (req, res) => {
  const targetUserId = parseInt(req.params.userId);
  const { reason = '' } = req.body;

  if (targetUserId === req.user.id) {
    return res.status(400).json({ error: '不能拉黑自己' });
  }

  const existing = db.prepare('SELECT id FROM blacklist WHERE user_id = ? AND blocked_user_id = ?').get(req.user.id, targetUserId);
  if (existing) {
    return res.status(400).json({ error: '已经拉黑了该用户' });
  }

  db.prepare(`
    INSERT INTO blacklist (user_id, blocked_user_id, reason)
    VALUES (?, ?, ?)
  `).run(req.user.id, targetUserId, reason);

  db.prepare('DELETE FROM relations WHERE follower_id = ? AND following_id = ?').run(req.user.id, targetUserId);
  db.prepare('DELETE FROM relations WHERE follower_id = ? AND following_id = ?').run(targetUserId, req.user.id);
  db.prepare(`
    UPDATE friendships SET status = 0, updated_at = CURRENT_TIMESTAMP 
    WHERE (user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?)
  `).run(req.user.id, targetUserId, targetUserId, req.user.id);

  db.prepare(`
    INSERT INTO action_logs (user_id, action, target_id, details)
    VALUES (?, 'block', ?, ?)
  `).run(req.user.id, targetUserId, JSON.stringify({ reason }));

  res.json({ success: true });
});

router.post('/unblock/:userId', (req, res) => {
  const targetUserId = parseInt(req.params.userId);

  db.prepare('DELETE FROM blacklist WHERE user_id = ? AND blocked_user_id = ?').run(req.user.id, targetUserId);

  db.prepare(`
    INSERT INTO action_logs (user_id, action, target_id, details)
    VALUES (?, 'unblock', ?, ?)
  `).run(req.user.id, targetUserId, JSON.stringify({}));

  res.json({ success: true });
});

router.get('/friend-requests', (req, res) => {
  const { type = 'received', page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;

  let list, total;
  if (type === 'sent') {
    list = db.prepare(`
      SELECT fr.*, u.nickname, u.avatar
      FROM friend_requests fr
      JOIN users u ON fr.receiver_id = u.id
      WHERE fr.sender_id = ?
      ORDER BY fr.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user.id, parseInt(pageSize), offset);

    total = db.prepare('SELECT COUNT(*) as count FROM friend_requests WHERE sender_id = ?').get(req.user.id).count;
  } else {
    list = db.prepare(`
      SELECT fr.*, u.nickname, u.avatar, u.username
      FROM friend_requests fr
      JOIN users u ON fr.sender_id = u.id
      WHERE fr.receiver_id = ?
      ORDER BY fr.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user.id, parseInt(pageSize), offset);

    total = db.prepare('SELECT COUNT(*) as count FROM friend_requests WHERE receiver_id = ?').get(req.user.id).count;
  }

  res.json({ list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.post('/friend-request/:userId', rateLimit('friend_request'), (req, res) => {
  const targetUserId = parseInt(req.params.userId);
  const { message = '' } = req.body;

  if (targetUserId === req.user.id) {
    return res.status(400).json({ error: '不能向自己发送好友申请' });
  }

  const isBlocked = db.prepare('SELECT id FROM blacklist WHERE user_id = ? AND blocked_user_id = ?').get(targetUserId, req.user.id);
  if (isBlocked) {
    return res.status(403).json({ error: '无法发送好友申请' });
  }

  const existingFriendship = db.prepare(`
    SELECT id FROM friendships 
    WHERE ((user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?)) AND status = 1
  `).get(req.user.id, targetUserId, targetUserId, req.user.id);

  if (existingFriendship) {
    return res.status(400).json({ error: '已经是好友了' });
  }

  const existingRequest = db.prepare(`
    SELECT id, status FROM friend_requests 
    WHERE sender_id = ? AND receiver_id = ? AND status = 0
  `).get(req.user.id, targetUserId);

  if (existingRequest) {
    return res.status(400).json({ error: '已发送过好友申请，请等待对方回复' });
  }

  const reverseRequest = db.prepare(`
    SELECT id, status FROM friend_requests 
    WHERE sender_id = ? AND receiver_id = ? AND status = 0
  `).get(targetUserId, req.user.id);

  if (reverseRequest) {
    db.prepare('UPDATE friend_requests SET status = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(reverseRequest.id);
    db.prepare(`
      INSERT OR IGNORE INTO friendships (user_id1, user_id2, status)
      VALUES (?, ?, 1)
    `).run(Math.min(req.user.id, targetUserId), Math.max(req.user.id, targetUserId));
    return res.json({ success: true, isAccepted: true });
  }

  db.prepare(`
    INSERT INTO friend_requests (sender_id, receiver_id, message, status)
    VALUES (?, ?, ?, 0)
  `).run(req.user.id, targetUserId, message);

  db.prepare(`
    INSERT INTO action_logs (user_id, action, target_id, details)
    VALUES (?, 'friend_request', ?, ?)
  `).run(req.user.id, targetUserId, JSON.stringify({ message }));

  res.json({ success: true });
});

router.post('/friend-request/:requestId/accept', (req, res) => {
  const requestId = parseInt(req.params.requestId);

  const request = db.prepare('SELECT * FROM friend_requests WHERE id = ? AND receiver_id = ?').get(requestId, req.user.id);
  if (!request) {
    return res.status(404).json({ error: '好友申请不存在' });
  }
  if (request.status !== 0) {
    return res.status(400).json({ error: '该申请已被处理' });
  }

  db.prepare('UPDATE friend_requests SET status = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(requestId);

  db.prepare(`
    INSERT OR IGNORE INTO friendships (user_id1, user_id2, status)
    VALUES (?, ?, 1)
  `).run(Math.min(req.user.id, request.sender_id), Math.max(req.user.id, request.sender_id));

  db.prepare(`
    INSERT INTO action_logs (user_id, action, target_id, details)
    VALUES (?, 'friend_accept', ?, ?)
  `).run(req.user.id, request.sender_id, JSON.stringify({}));

  res.json({ success: true });
});

router.post('/friend-request/:requestId/reject', (req, res) => {
  const requestId = parseInt(req.params.requestId);

  const request = db.prepare('SELECT * FROM friend_requests WHERE id = ? AND receiver_id = ?').get(requestId, req.user.id);
  if (!request) {
    return res.status(404).json({ error: '好友申请不存在' });
  }
  if (request.status !== 0) {
    return res.status(400).json({ error: '该申请已被处理' });
  }

  db.prepare('UPDATE friend_requests SET status = 2, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(requestId);

  db.prepare(`
    INSERT INTO action_logs (user_id, action, target_id, details)
    VALUES (?, 'friend_reject', ?, ?)
  `).run(req.user.id, request.sender_id, JSON.stringify({}));

  res.json({ success: true });
});

export default router;
