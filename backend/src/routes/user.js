const express = require('express');
const db = require('../database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/profile/:userId', optionalAuth, (req, res) => {
  const { userId } = req.params;

  const user = db.prepare('SELECT id, nickname, avatar, signature, level, exp, coins, vip_type, vip_expire_at, is_verified, created_at FROM users WHERE id = ?').get(userId);
  
  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }

  const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId);

  let isFollowing = false;
  if (req.user) {
    const follow = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.id, userId);
    isFollowing = !!follow;
  }

  res.json({
    success: true,
    data: {
      user,
      profile,
      isFollowing
    }
  });
});

router.post('/follow/:userId', authenticateToken, (req, res) => {
  const { userId } = req.params;

  if (userId == req.user.id) {
    return res.status(400).json({ success: false, message: '不能关注自己' });
  }

  const targetUser = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!targetUser) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }

  const existing = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.id, userId);

  if (existing) {
    db.prepare('DELETE FROM follows WHERE id = ?').run(existing.id);
    db.prepare('UPDATE user_profiles SET following_count = following_count - 1 WHERE user_id = ?').run(req.user.id);
    db.prepare('UPDATE user_profiles SET follower_count = follower_count - 1 WHERE user_id = ?').run(userId);
    res.json({ success: true, data: { action: 'unfollow' }, message: '已取消关注' });
  } else {
    db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(req.user.id, userId);
    db.prepare('UPDATE user_profiles SET following_count = following_count + 1 WHERE user_id = ?').run(req.user.id);
    db.prepare('UPDATE user_profiles SET follower_count = follower_count + 1 WHERE user_id = ?').run(userId);
    res.json({ success: true, data: { action: 'follow' }, message: '关注成功' });
  }
});

router.delete('/unfollow/:userId', authenticateToken, (req, res) => {
  const { userId } = req.params;

  const existing = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.id, userId);

  if (existing) {
    db.prepare('DELETE FROM follows WHERE id = ?').run(existing.id);
    db.prepare('UPDATE user_profiles SET following_count = following_count - 1 WHERE user_id = ?').run(req.user.id);
    db.prepare('UPDATE user_profiles SET follower_count = follower_count - 1 WHERE user_id = ?').run(userId);
    res.json({ success: true, message: '已取消关注' });
  } else {
    res.json({ success: true, message: '未关注该用户' });
  }
});

router.get('/following/:userId', (req, res) => {
  const { userId } = req.params;
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;

  const followings = db.prepare(`
    SELECT u.id, u.nickname, u.avatar, u.signature, u.level, up.follower_count
    FROM follows f
    LEFT JOIN users u ON f.following_id = u.id
    LEFT JOIN user_profiles up ON u.id = up.user_id
    WHERE f.follower_id = ?
    ORDER BY f.created_at DESC
    LIMIT ? OFFSET ?
  `).all(userId, parseInt(pageSize), offset);

  res.json({ success: true, data: followings });
});

router.get('/followers/:userId', (req, res) => {
  const { userId } = req.params;
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;

  const followers = db.prepare(`
    SELECT u.id, u.nickname, u.avatar, u.signature, u.level, up.follower_count
    FROM follows f
    LEFT JOIN users u ON f.follower_id = u.id
    LEFT JOIN user_profiles up ON u.id = up.user_id
    WHERE f.following_id = ?
    ORDER BY f.created_at DESC
    LIMIT ? OFFSET ?
  `).all(userId, parseInt(pageSize), offset);

  res.json({ success: true, data: followers });
});

router.put('/profile', authenticateToken, (req, res) => {
  const { nickname, signature, gender, birthday, region } = req.body;

  if (nickname && nickname.length > 20) {
    return res.status(400).json({ success: false, message: '昵称不能超过20个字符' });
  }

  const updates = [];
  const params = [];

  if (nickname) {
    updates.push('nickname = ?');
    params.push(nickname);
  }
  if (signature !== undefined) {
    updates.push('signature = ?');
    params.push(signature);
  }

  if (updates.length > 0) {
    params.push(req.user.id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  const profileUpdates = [];
  const profileParams = [];

  if (gender !== undefined) {
    profileUpdates.push('gender = ?');
    profileParams.push(gender);
  }
  if (birthday) {
    profileUpdates.push('birthday = ?');
    profileParams.push(birthday);
  }
  if (region) {
    profileUpdates.push('region = ?');
    profileParams.push(region);
  }

  if (profileUpdates.length > 0) {
    profileParams.push(req.user.id);
    db.prepare(`UPDATE user_profiles SET ${profileUpdates.join(', ')} WHERE user_id = ?`).run(...profileParams);
  }

  res.json({ success: true, message: '资料更新成功' });
});

router.get('/level-info', (req, res) => {
  const levelInfo = db.prepare('SELECT * FROM level_permissions ORDER BY level ASC').all();
  res.json({ success: true, data: levelInfo });
});

module.exports = router;
