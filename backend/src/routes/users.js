const express = require('express');
const db = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/:id', (req, res) => {
  const { id } = req.params;

  const user = db.prepare('SELECT id, username, nickname, avatar, level, experience, coins, reputation, created_at FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const postCount = db.prepare('SELECT COUNT(*) as count FROM posts WHERE author_id = ?').get(id).count;
  const commentCount = db.prepare('SELECT COUNT(*) as count FROM comments WHERE user_id = ?').get(id).count;
  const followerCount = db.prepare('SELECT COUNT(*) as count FROM user_relations WHERE following_id = ?').get(id).count;
  const followingCount = db.prepare('SELECT COUNT(*) as count FROM user_relations WHERE follower_id = ?').get(id).count;

  user.post_count = postCount;
  user.comment_count = commentCount;
  user.follower_count = followerCount;
  user.following_count = followingCount;

  const expForNextLevel = user.level * 100;
  user.exp_percent = Math.min((user.experience / expForNextLevel) * 100, 100);

  res.json({ user });
});

router.post('/:id/follow', authenticate, (req, res) => {
  const { id } = req.params;
  const followerId = req.user.id;

  if (parseInt(id) === followerId) {
    return res.status(400).json({ error: '不能关注自己' });
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const existingRelation = db.prepare('SELECT id FROM user_relations WHERE follower_id = ? AND following_id = ?').get(followerId, id);

  if (existingRelation) {
    db.prepare('DELETE FROM user_relations WHERE id = ?').run(existingRelation.id);
    db.prepare('UPDATE users SET reputation = reputation - 5 WHERE id = ?').run(id);
    res.json({ following: false });
  } else {
    db.prepare('INSERT INTO user_relations (follower_id, following_id) VALUES (?, ?)').run(followerId, id);
    db.prepare('UPDATE users SET reputation = reputation + 5 WHERE id = ?').run(id);
    res.json({ following: true });
  }
});

router.get('/:id/posts', (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const posts = db.prepare(`
    SELECT p.*, c.name as channel_name
    FROM posts p
    LEFT JOIN channels c ON p.channel_id = c.id
    WHERE p.author_id = ?
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(id, limit, offset);

  const { total } = db.prepare('SELECT COUNT(*) as total FROM posts WHERE author_id = ?').get(id);

  res.json({ posts, total, page: parseInt(page), limit: parseInt(limit) });
});

module.exports = router;
