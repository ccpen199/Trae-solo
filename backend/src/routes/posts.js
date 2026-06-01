const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const posts = db.prepare(`
    SELECT p.*, u.nickname, u.avatar 
    FROM posts p 
    JOIN users u ON p.user_id = u.id 
    ORDER BY p.created_at DESC 
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  posts.forEach(post => {
    if (post.images) {
      post.images = JSON.parse(post.images);
    }
    post.is_liked = db.prepare('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?').get(post.id, req.user.userId) ? true : false;
  });

  const total = db.prepare('SELECT COUNT(*) as count FROM posts').get();

  res.json({
    list: posts,
    total: total.count,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

router.post('/', authMiddleware, [
  body('content').notEmpty().withMessage('内容不能为空'),
  body('images').optional().isArray({ max: 3 }).withMessage('最多上传3张图片'),
  body('voice_duration').optional().isInt({ min: 5, max: 180 }).withMessage('语音时长需在5-180秒之间')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { content, images, voice_url, voice_duration } = req.body;

  const result = db.prepare(
    'INSERT INTO posts (user_id, content, images, voice_url, voice_duration) VALUES (?, ?, ?, ?, ?)'
  ).run(
    req.user.userId,
    content,
    images ? JSON.stringify(images) : null,
    voice_url || null,
    voice_duration || null
  );

  const post = db.prepare(`
    SELECT p.*, u.nickname, u.avatar 
    FROM posts p 
    JOIN users u ON p.user_id = u.id 
    WHERE p.id = ?
  `).get(result.lastInsertRowid);

  if (post.images) {
    post.images = JSON.parse(post.images);
  }

  res.status(201).json(post);
});

router.post('/:id/like', authMiddleware, (req, res) => {
  const postId = req.params.id;

  try {
    db.prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)').run(postId, req.user.userId);
    db.prepare('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?').run(postId);
    res.json({ success: true });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      db.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?').run(postId, req.user.userId);
      db.prepare('UPDATE posts SET likes_count = likes_count - 1 WHERE id = ?').run(postId);
      res.json({ success: true, liked: false });
    } else {
      res.status(500).json({ error: '操作失败' });
    }
  }
});

router.post('/:id/comment', authMiddleware, [
  body('content').notEmpty().withMessage('评论内容不能为空')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const postId = req.params.id;
  const { content } = req.body;

  const result = db.prepare(
    'INSERT INTO post_comments (post_id, user_id, content) VALUES (?, ?, ?)'
  ).run(postId, req.user.userId, content);

  db.prepare('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?').run(postId);

  const comment = db.prepare(`
    SELECT c.*, u.nickname, u.avatar 
    FROM post_comments c 
    JOIN users u ON c.user_id = u.id 
    WHERE c.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(comment);
});

router.get('/:id/comments', authMiddleware, (req, res) => {
  const postId = req.params.id;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const comments = db.prepare(`
    SELECT c.*, u.nickname, u.avatar 
    FROM post_comments c 
    JOIN users u ON c.user_id = u.id 
    WHERE c.post_id = ? 
    ORDER BY c.created_at DESC 
    LIMIT ? OFFSET ?
  `).all(postId, limit, offset);

  res.json(comments);
});

module.exports = router;
