const express = require('express');
const db = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router({ mergeParams: true });

router.get('/', optionalAuth, (req, res) => {
  try {
    const { questionId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const answers = db.prepare(`
      SELECT a.*, u.nickname, u.avatar
      FROM answers a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.question_id = ?
      ORDER BY a.vote_up DESC, a.created_at DESC
      LIMIT ? OFFSET ?
    `).all(questionId, parseInt(limit), offset);

    const total = db.prepare('SELECT COUNT(*) as total FROM answers WHERE question_id = ?').get(questionId).total;

    res.json({
      success: true,
      data: {
        list: answers || [],
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取答案列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/', authenticateToken, [
  body('content').isLength({ min: 1 })
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误' });
    }

    const { questionId } = req.params;
    const { content } = req.body;

    const stmt = db.prepare('INSERT INTO answers (question_id, user_id, content) VALUES (?, ?, ?)');
    const result = stmt.run(questionId, req.user.userId, content);

    db.prepare('UPDATE questions SET answer_count = answer_count + 1 WHERE id = ?').run(questionId);

    res.json({ success: true, data: { id: result.lastInsertRowid }, message: '回答发布成功' });
  } catch (error) {
    console.error('创建答案错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/:id/vote', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { vote_type } = req.body;

    if (![-1, 0, 1].includes(vote_type)) {
      return res.status(400).json({ success: false, message: '无效的投票类型' });
    }

    const existingVote = db.prepare('SELECT * FROM votes WHERE user_id = ? AND target_type = ? AND target_id = ?')
      .get(req.user.userId, 'answer', id);

    if (existingVote) {
      if (vote_type === 0) {
        if (existingVote.vote_type === 1) {
          db.prepare('UPDATE answers SET vote_up = vote_up - 1 WHERE id = ?').run(id);
        } else {
          db.prepare('UPDATE answers SET vote_down = vote_down - 1 WHERE id = ?').run(id);
        }
        db.prepare('DELETE FROM votes WHERE user_id = ? AND target_type = ? AND target_id = ?')
          .run(req.user.userId, 'answer', id);
      } else if (existingVote.vote_type !== vote_type) {
        if (existingVote.vote_type === 1) {
          db.prepare('UPDATE answers SET vote_up = vote_up - 1 WHERE id = ?').run(id);
        } else {
          db.prepare('UPDATE answers SET vote_down = vote_down - 1 WHERE id = ?').run(id);
        }
        if (vote_type === 1) {
          db.prepare('UPDATE answers SET vote_up = vote_up + 1 WHERE id = ?').run(id);
        } else {
          db.prepare('UPDATE answers SET vote_down = vote_down + 1 WHERE id = ?').run(id);
        }
        db.prepare('UPDATE votes SET vote_type = ? WHERE user_id = ? AND target_type = ? AND target_id = ?')
          .run(vote_type, req.user.userId, 'answer', id);
      }
    } else if (vote_type !== 0) {
      if (vote_type === 1) {
        db.prepare('UPDATE answers SET vote_up = vote_up + 1 WHERE id = ?').run(id);
      } else {
        db.prepare('UPDATE answers SET vote_down = vote_down + 1 WHERE id = ?').run(id);
      }
      db.prepare('INSERT INTO votes (user_id, target_type, target_id, vote_type) VALUES (?, ?, ?, ?)')
        .run(req.user.userId, 'answer', id, vote_type);
    }

    res.json({ success: true, message: '投票成功' });
  } catch (error) {
    console.error('投票错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/:id/like', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    const existingLike = db.prepare('SELECT * FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?')
      .get(req.user.userId, 'answer', id);

    if (existingLike) {
      db.prepare('DELETE FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?')
        .run(req.user.userId, 'answer', id);
      db.prepare('UPDATE answers SET like_count = like_count - 1 WHERE id = ?').run(id);
      res.json({ success: true, message: '取消喜欢', liked: false });
    } else {
      db.prepare('INSERT INTO likes (user_id, target_type, target_id) VALUES (?, ?, ?)')
        .run(req.user.userId, 'answer', id);
      db.prepare('UPDATE answers SET like_count = like_count + 1 WHERE id = ?').run(id);
      res.json({ success: true, message: '喜欢成功', liked: true });
    }
  } catch (error) {
    console.error('喜欢错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
