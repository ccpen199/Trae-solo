const express = require('express');
const { db } = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/:id', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, username, nickname, avatar, bio, gender, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const followerCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(req.params.id);
  const followingCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').get(req.params.id);
  const postCount = db.prepare('SELECT COUNT(*) as count FROM posts WHERE user_id = ?').get(req.params.id);

  user.follower_count = followerCount.count;
  user.following_count = followingCount.count;
  user.post_count = postCount.count;
  user.is_following = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.userId, req.params.id) ? true : false;

  res.json(user);
});

router.post('/:id/follow', authMiddleware, (req, res) => {
  const followingId = req.params.id;

  if (followingId == req.user.userId) {
    return res.status(400).json({ error: '不能关注自己' });
  }

  try {
    db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(req.user.userId, followingId);
    
    db.prepare('INSERT INTO notifications (user_id, type, content, related_id) VALUES (?, ?, ?, ?)').run(
      followingId,
      'follow',
      '有人关注了你',
      req.user.userId
    );

    res.json({ success: true });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(req.user.userId, followingId);
      res.json({ success: true, following: false });
    } else {
      res.status(500).json({ error: '操作失败' });
    }
  }
});

router.get('/:id/posts', authMiddleware, (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const posts = db.prepare(`
    SELECT p.*, u.nickname, u.avatar 
    FROM posts p 
    JOIN users u ON p.user_id = u.id 
    WHERE p.user_id = ? 
    ORDER BY p.created_at DESC 
    LIMIT ? OFFSET ?
  `).all(req.params.id, limit, offset);

  posts.forEach(post => {
    if (post.images) {
      post.images = JSON.parse(post.images);
    }
  });

  res.json(posts);
});

router.get('/:id/following', authMiddleware, (req, res) => {
  const following = db.prepare(`
    SELECT f.following_id as id, u.nickname, u.avatar 
    FROM follows f 
    JOIN users u ON f.following_id = u.id 
    WHERE f.follower_id = ?
  `).all(req.params.id);

  res.json(following);
});

router.get('/:id/followers', authMiddleware, (req, res) => {
  const followers = db.prepare(`
    SELECT f.follower_id as id, u.nickname, u.avatar 
    FROM follows f 
    JOIN users u ON f.follower_id = u.id 
    WHERE f.following_id = ?
  `).all(req.params.id);

  res.json(followers);
});

module.exports = router;
