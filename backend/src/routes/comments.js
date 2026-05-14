const express = require('express');
const { db } = require('../database/init');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/post/:postId', authMiddleware, (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const comments = db.prepare(`
      SELECT c.*, u.nickname, u.avatar 
      FROM comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.post_id = ? 
      ORDER BY c.created_at DESC 
      LIMIT ? OFFSET ?
    `).all(postId, parseInt(limit), offset);

    const { total } = db.prepare('SELECT COUNT(*) as total FROM comments WHERE post_id = ?').get(postId);

    res.json({ success: true, data: { comments, total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/post/:postId', authMiddleware, (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: '请输入评论内容' });
    }

    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: '帖子不存在' });
    }

    const stmt = db.prepare('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)');
    const result = stmt.run(postId, req.user.id, content);

    db.prepare('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?').run(postId);

    const comment = db.prepare(`
      SELECT c.*, u.nickname, u.avatar 
      FROM comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    db.prepare('INSERT INTO analytics (user_id, event_type, event_data, page) VALUES (?, ?, ?, ?)').run(
      req.user.id,
      'comment_post',
      JSON.stringify({ post_id: postId, comment_id: comment.id }),
      'square'
    );

    res.json({ success: true, data: comment, message: '评论成功' });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
