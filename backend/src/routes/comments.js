const express = require('express');
const { db } = require('../database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/video/:videoId', optionalAuth, (req, res) => {
  try {
    const { videoId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const comments = db.prepare(`
      SELECT 
        c.*,
        u.nickname as user_name,
        u.avatar as user_avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.video_id = ? AND c.reply_to IS NULL
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `).all(videoId, limit, offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM comments WHERE video_id = ? AND reply_to IS NULL').get(videoId);

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
    console.error('Get comments error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取评论失败' 
    });
  }
});

router.post('/', authenticateToken, (req, res) => {
  try {
    const { video_id, content, reply_to } = req.body;

    if (!video_id || !content) {
      return res.status(400).json({ 
        success: false, 
        message: '参数不完整' 
      });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '评论内容不能为空' 
      });
    }

    const result = db.prepare(
      'INSERT INTO comments (video_id, user_id, content, reply_to) VALUES (?, ?, ?, ?)'
    ).run(video_id, req.user.id, content.trim(), reply_to || null);

    db.prepare('UPDATE videos SET comments_count = comments_count + 1 WHERE id = ?').run(video_id);

    const comment = db.prepare(`
      SELECT 
        c.*,
        u.nickname as user_name,
        u.avatar as user_avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    res.json({
      success: true,
      message: '评论成功',
      data: comment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ 
      success: false, 
      message: '评论失败，请重试' 
    });
  }
});

router.post('/:id/like', authenticateToken, (req, res) => {
  try {
    const commentId = req.params.id;
    db.prepare('UPDATE comments SET likes_count = likes_count + 1 WHERE id = ?').run(commentId);
    
    res.json({
      success: true,
      message: '点赞成功'
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ 
      success: false, 
      message: '操作失败' 
    });
  }
});

module.exports = router;
