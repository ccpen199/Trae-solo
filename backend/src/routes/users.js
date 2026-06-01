import express from 'express';
import db from '../database/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', authMiddleware, (req, res) => {
  const stats = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM relations WHERE follower_id = ?) as following_count,
      (SELECT COUNT(*) FROM relations WHERE following_id = ?) as follower_count,
      (SELECT COUNT(*) FROM friendships WHERE (user_id1 = ? OR user_id2 = ?) AND status = 1) as friend_count,
      (SELECT COUNT(*) FROM blacklist WHERE user_id = ?) as blacklist_count
  `).get(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id);

  res.json({ ...req.user, ...stats });
});

router.get('/list', authMiddleware, (req, res) => {
  const { page = 1, pageSize = 20, keyword = '' } = req.query;
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE status = 1 AND id != ?';
  const params = [req.user.id];

  if (keyword) {
    whereClause += ' AND (nickname LIKE ? OR username LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const users = db.prepare(`
    SELECT id, username, nickname, avatar, bio, location, interests, created_at
    FROM users ${whereClause}
    ORDER BY id DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM users ${whereClause}`).get(...params).count;

  res.json({ list: users, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, username, nickname, avatar, bio, location, interests, privacy_setting, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });

  const relation = db.prepare(`
    SELECT 
      r1.status as is_following,
      r2.status as is_follower,
      f.status as is_friend,
      b.id as is_blocked
    FROM users u
    LEFT JOIN relations r1 ON r1.follower_id = ? AND r1.following_id = u.id
    LEFT JOIN relations r2 ON r2.follower_id = u.id AND r2.following_id = ?
    LEFT JOIN friendships f ON ((f.user_id1 = ? AND f.user_id2 = u.id) OR (f.user_id1 = u.id AND f.user_id2 = ?)) AND f.status = 1
    LEFT JOIN blacklist b ON b.user_id = ? AND b.blocked_user_id = u.id
    WHERE u.id = ?
  `).get(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.params.id);

  const stats = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM relations WHERE follower_id = ?) as following_count,
      (SELECT COUNT(*) FROM relations WHERE following_id = ?) as follower_count,
      (SELECT COUNT(*) FROM friendships WHERE (user_id1 = ? OR user_id2 = ?) AND status = 1) as friend_count,
      (SELECT COUNT(*) FROM blacklist WHERE user_id = ?) as blacklist_count
  `).get(req.params.id, req.params.id, req.params.id, req.params.id, req.params.id);

  res.json({ ...user, ...relation, ...stats });
});

export default router;
