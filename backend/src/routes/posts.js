const express = require('express');
const db = require('../database');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, (req, res) => {
  const { channel, page = 1, limit = 20, type } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT p.*, u.nickname as author_name, u.level as author_level, c.name as channel_name
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    LEFT JOIN channels c ON p.channel_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (channel && channel != 1 && channel !== 'recommend') {
    query += ' AND p.channel_id = ?';
    params.push(parseInt(channel));
  }

  if (type) {
    query += ' AND p.type = ?';
    params.push(type);
  }

  query += ' ORDER BY p.is_top DESC, p.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const posts = db.prepare(query).all(...params);

  let countQuery = 'SELECT COUNT(*) as total FROM posts WHERE 1=1';
  const countParams = [];

  if (channel && channel != 1 && channel !== 'recommend') {
    countQuery += ' AND channel_id = ?';
    countParams.push(parseInt(channel));
  }

  if (type) {
    countQuery += ' AND type = ?';
    countParams.push(type);
  }

  const { total } = db.prepare(countQuery).get(...countParams);

  if (req.user) {
    const postIds = posts.map(p => p.id);
    if (postIds.length > 0) {
      const placeholders = postIds.map(() => '?').join(',');
      const likes = db.prepare(`SELECT target_id FROM likes WHERE user_id = ? AND target_type = 'post' AND target_id IN (${placeholders})`).all(req.user.id, ...postIds);
      const likedIds = new Set(likes.map(l => l.target_id));
      posts.forEach(post => {
        post.is_liked = likedIds.has(post.id);
      });
    }
  }

  res.json({ posts, total, page: parseInt(page), limit: parseInt(limit) });
});

router.get('/:id', optionalAuth, (req, res) => {
  const { id } = req.params;

  const post = db.prepare(`
    SELECT p.*, u.nickname as author_name, u.level as author_level, u.avatar as author_avatar,
           u.coins as author_coins, u.reputation as author_reputation, c.name as channel_name
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    LEFT JOIN channels c ON p.channel_id = c.id
    WHERE p.id = ?
  `).get(id);

  if (!post) {
    return res.status(404).json({ error: '帖子不存在' });
  }

  db.prepare('UPDATE posts SET view_count = view_count + 1 WHERE id = ?').run(id);
  post.view_count++;

  if (req.user) {
    const like = db.prepare(`SELECT id FROM likes WHERE user_id = ? AND target_type = 'post' AND target_id = ?`).get(req.user.id, id);
    post.is_liked = !!like;
  }

  res.json({ post });
});

router.post('/', authenticate, (req, res) => {
  const { title, content, channel_id, type = 'post' } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: '标题和内容不能为空' });
  }

  if (content.length < 10) {
    return res.status(400).json({ error: '内容至少需要10个字符' });
  }

  const result = db.prepare('INSERT INTO posts (title, content, channel_id, type, author_id) VALUES (?, ?, ?, ?, ?)').run(title, content, channel_id, type, req.user.id);

  db.prepare('UPDATE users SET experience = experience + 5, coins = coins + 2 WHERE id = ?').run(req.user.id);

  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid);
  res.json({ post });
});

router.post('/:id/like', authenticate, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
  if (!post) {
    return res.status(404).json({ error: '帖子不存在' });
  }

  const existingLike = db.prepare(`SELECT id FROM likes WHERE user_id = ? AND target_type = 'post' AND target_id = ?`).get(userId, id);

  if (existingLike) {
    db.prepare(`DELETE FROM likes WHERE id = ?`).run(existingLike.id);
    db.prepare('UPDATE posts SET like_count = like_count - 1 WHERE id = ?').run(id);
    res.json({ liked: false, like_count: post.like_count - 1 });
  } else {
    db.prepare(`INSERT INTO likes (user_id, target_type, target_id) VALUES (?, 'post', ?)`).run(userId, id);
    db.prepare('UPDATE posts SET like_count = like_count + 1 WHERE id = ?').run(id);
    res.json({ liked: true, like_count: post.like_count + 1 });
  }
});

module.exports = router;
