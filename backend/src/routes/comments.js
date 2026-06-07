const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { auth } = require('../middleware/auth');

router.get('/contents/:contentId/comments', (req, res) => {
  try {
    const { contentId } = req.params;
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const content = db.prepare('SELECT id FROM contents WHERE id = ?').get(contentId);
    if (!content) {
      return res.status(404).json({ code: 1, message: '内容不存在' });
    }

    const total = db.prepare('SELECT COUNT(*) as cnt FROM comments WHERE content_id = ? AND status = \'active\'').get(contentId).cnt;

    const comments = db.prepare(`
      SELECT c.*, u.nickname as author_nickname, u.avatar as author_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.content_id = ? AND c.status = 'active'
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `).all(contentId, parseInt(pageSize), offset);

    res.json({
      code: 0,
      data: { list: comments, total, page: parseInt(page), pageSize: parseInt(pageSize) },
      message: 'ok'
    });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.post('/contents/:contentId/comments', auth, (req, res) => {
  try {
    const { contentId } = req.params;
    const { body, parent_id, reply_to_id } = req.body;

    if (!body) {
      return res.status(400).json({ code: 1, message: '评论内容不能为空' });
    }

    const content = db.prepare('SELECT id FROM contents WHERE id = ?').get(contentId);
    if (!content) {
      return res.status(404).json({ code: 1, message: '内容不存在' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO comments (id, content_id, user_id, parent_id, reply_to_id, body, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, contentId, req.user.id, parent_id || null, reply_to_id || null, body, now);

    db.prepare('UPDATE contents SET comment_count = comment_count + 1 WHERE id = ?').run(contentId);

    const comment = db.prepare(`
      SELECT c.*, u.nickname as author_nickname, u.avatar as author_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(id);

    res.json({ code: 0, data: comment, message: '评论成功' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.delete('/comments/:id', auth, (req, res) => {
  try {
    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);
    if (!comment) {
      return res.status(404).json({ code: 1, message: '评论不存在' });
    }
    if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ code: 1, message: '无权删除' });
    }

    db.prepare('UPDATE comments SET status = \'deleted\' WHERE id = ?').run(req.params.id);
    db.prepare('UPDATE contents SET comment_count = comment_count - 1 WHERE id = ?').run(comment.content_id);

    res.json({ code: 0, data: null, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.post('/comments/:id/like', auth, (req, res) => {
  try {
    const commentId = req.params.id;
    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId);
    if (!comment) {
      return res.status(404).json({ code: 1, message: '评论不存在' });
    }

    const existing = db.prepare('SELECT id FROM likes WHERE user_id = ? AND target_type = \'comment\' AND target_id = ?').get(req.user.id, commentId);

    if (existing) {
      db.prepare('DELETE FROM likes WHERE id = ?').run(existing.id);
      db.prepare('UPDATE comments SET like_count = like_count - 1 WHERE id = ?').run(commentId);
      res.json({ code: 0, data: { liked: false }, message: '取消点赞' });
    } else {
      const id = uuidv4();
      const now = new Date().toISOString();
      db.prepare('INSERT INTO likes (id, user_id, target_type, target_id, created_at) VALUES (?, ?, \'comment\', ?, ?)').run(id, req.user.id, commentId, now);
      db.prepare('UPDATE comments SET like_count = like_count + 1 WHERE id = ?').run(commentId);
      res.json({ code: 0, data: { liked: true }, message: '点赞成功' });
    }
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

module.exports = router;
