const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const circles = db.prepare('SELECT * FROM circles ORDER BY member_count DESC').all();
  
  circles.forEach(circle => {
    circle.is_member = db.prepare('SELECT id FROM circle_members WHERE circle_id = ? AND user_id = ?').get(circle.id, req.user.userId) ? true : false;
  });

  res.json(circles);
});

router.post('/:id/join', authMiddleware, (req, res) => {
  const circleId = req.params.id;

  try {
    db.prepare('INSERT INTO circle_members (circle_id, user_id) VALUES (?, ?)').run(circleId, req.user.userId);
    db.prepare('UPDATE circles SET member_count = member_count + 1 WHERE id = ?').run(circleId);
    res.json({ success: true });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.json({ success: true, message: '已加入该圈子' });
    } else {
      res.status(500).json({ error: '加入失败' });
    }
  }
});

router.post('/:id/leave', authMiddleware, (req, res) => {
  const circleId = req.params.id;

  db.prepare('DELETE FROM circle_members WHERE circle_id = ? AND user_id = ?').run(circleId, req.user.userId);
  db.prepare('UPDATE circles SET member_count = member_count - 1 WHERE id = ?').run(circleId);
  
  res.json({ success: true });
});

router.get('/:id/posts', authMiddleware, (req, res) => {
  const circleId = req.params.id;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const posts = db.prepare(`
    SELECT cp.*, u.nickname, u.avatar 
    FROM circle_posts cp 
    JOIN users u ON cp.user_id = u.id 
    WHERE cp.circle_id = ? 
    ORDER BY cp.created_at DESC 
    LIMIT ? OFFSET ?
  `).all(circleId, limit, offset);

  posts.forEach(post => {
    if (post.images) {
      post.images = JSON.parse(post.images);
    }
  });

  res.json(posts);
});

router.post('/:id/posts', authMiddleware, [
  body('content').notEmpty().withMessage('内容不能为空'),
  body('images').optional().isArray({ max: 3 }).withMessage('最多上传3张图片')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const circleId = req.params.id;
  const { content, images } = req.body;

  const result = db.prepare(
    'INSERT INTO circle_posts (circle_id, user_id, content, images) VALUES (?, ?, ?, ?)'
  ).run(circleId, req.user.userId, content, images ? JSON.stringify(images) : null);

  db.prepare('UPDATE circles SET post_count = post_count + 1 WHERE id = ?').run(circleId);

  const post = db.prepare(`
    SELECT cp.*, u.nickname, u.avatar 
    FROM circle_posts cp 
    JOIN users u ON cp.user_id = u.id 
    WHERE cp.id = ?
  `).get(result.lastInsertRowid);

  if (post.images) {
    post.images = JSON.parse(post.images);
  }

  res.status(201).json(post);
});

module.exports = router;
