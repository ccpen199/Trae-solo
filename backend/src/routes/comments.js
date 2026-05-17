const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/recommendation/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const comments = db.prepare(`
      SELECT 
        c.id,
        c.content,
        c.like_count,
        c.created_at,
        u.id as user_id,
        u.nickname as user_nickname,
        u.avatar as user_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.recommendation_id = ?
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `).all(id, limit, offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM comments WHERE recommendation_id = ?').get(id);

    res.json({ 
      success: true, 
      data: { 
        list: comments, 
        total: total.count,
        page: parseInt(page),
        limit: parseInt(limit)
      } 
    });
  } catch (error) {
    console.error('获取评论列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/recommendation/:id', authenticateToken, [
  body('content').isLength({ min: 1, max: 500 }).withMessage('评论内容1-500字'),
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { id } = req.params;
    const { content } = req.body;

    const recommendation = db.prepare('SELECT id FROM recommendations WHERE id = ?').get(id);
    if (!recommendation) {
      return res.status(404).json({ success: false, message: '推荐不存在' });
    }

    const result = db.prepare(`
      INSERT INTO comments (recommendation_id, user_id, content)
      VALUES (?, ?, ?)
    `).run(id, req.user.id, content);

    db.prepare('UPDATE recommendations SET comment_count = comment_count + 1 WHERE id = ?').run(id);

    const comment = db.prepare(`
      SELECT 
        c.id,
        c.content,
        c.like_count,
        c.created_at,
        u.id as user_id,
        u.nickname as user_nickname,
        u.avatar as user_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    res.json({ success: true, data: comment });
  } catch (error) {
    console.error('发表评论错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/:id/like', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    const comment = db.prepare('SELECT id FROM comments WHERE id = ?').get(id);
    if (!comment) {
      return res.status(404).json({ success: false, message: '评论不存在' });
    }

    const existingLike = db.prepare('SELECT id FROM comment_likes WHERE user_id = ? AND comment_id = ?').get(req.user.id, id);

    if (existingLike) {
      db.prepare('DELETE FROM comment_likes WHERE id = ?').run(existingLike.id);
      db.prepare('UPDATE comments SET like_count = like_count - 1 WHERE id = ?').run(id);
      res.json({ success: true, data: { liked: false } });
    } else {
      db.prepare('INSERT INTO comment_likes (user_id, comment_id) VALUES (?, ?)').run(req.user.id, id);
      db.prepare('UPDATE comments SET like_count = like_count + 1 WHERE id = ?').run(id);
      res.json({ success: true, data: { liked: true } });
    }
  } catch (error) {
    console.error('评论点赞错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
