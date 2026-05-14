const express = require('express');
const db = require('../config/database');
const { optionalAuth, authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const articles = db.prepare(`
      SELECT a.*, u.nickname, u.avatar
      FROM articles a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `).all(parseInt(limit), offset);

    const total = db.prepare('SELECT COUNT(*) as total FROM articles').get().total;

    res.json({
      success: true,
      data: {
        list: articles || [],
        total
      }
    });
  } catch (error) {
    console.error('获取文章列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/:id', optionalAuth, (req, res) => {
  try {
    const { id } = req.params;

    const article = db.prepare(`
      SELECT a.*, u.nickname, u.avatar
      FROM articles a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.id = ?
    `).get(id);

    if (!article) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }

    db.prepare('UPDATE articles SET view_count = view_count + 1 WHERE id = ?').run(id);

    res.json({ success: true, data: article });
  } catch (error) {
    console.error('获取文章详情错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/', authenticateToken, (req, res) => {
  try {
    const { title, content, summary, cover_image } = req.body;

    const stmt = db.prepare('INSERT INTO articles (user_id, title, content, summary, cover_image) VALUES (?, ?, ?, ?, ?)');
    const result = stmt.run(req.user.userId, title, content, summary, cover_image);

    res.json({ success: true, data: { id: result.lastInsertRowid }, message: '文章发布成功' });
  } catch (error) {
    console.error('创建文章错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
