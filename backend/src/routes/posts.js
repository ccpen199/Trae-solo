const express = require('express');
const db = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { category, is_announcement, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT p.*, u.nickname, u.avatar FROM posts p LEFT JOIN users u ON p.user_id = u.id WHERE p.status = ?';
    const params = ['active'];
    
    if (category) {
      query += ' AND p.category = ?';
      params.push(category);
    }
    
    if (is_announcement) {
      query += ' AND p.is_announcement = ?';
      params.push(parseInt(is_announcement));
    }
    
    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const posts = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as count FROM posts WHERE status = ?' + (category ? ' AND category = ?' : '')).get(category ? ['active', category] : ['active']).count;
    
    res.json({ 
      success: true, 
      data: { 
        posts: posts.map(post => ({ ...post, images: post.images ? JSON.parse(post.images) : [] })), 
        total, 
        page: parseInt(page) 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取失败', error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const post = db.prepare('SELECT p.*, u.nickname, u.avatar FROM posts p LEFT JOIN users u ON p.user_id = u.id WHERE p.id = ?').get(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: '帖子不存在' });
    }
    
    db.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').run(req.params.id);
    
    const comments = db.prepare('SELECT c.*, u.nickname, u.avatar FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.post_id = ? ORDER BY c.created_at DESC').all(req.params.id);
    
    res.json({ 
      success: true, 
      data: { 
        ...post, 
        images: post.images ? JSON.parse(post.images) : [],
        comments
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取失败', error: error.message });
  }
});

router.post('/', authMiddleware, (req, res) => {
  try {
    const { title, content, category, images, is_announcement } = req.body;
    
    const result = db.prepare(
      'INSERT INTO posts (user_id, title, content, category, images, is_announcement) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.user.id, title, content || '', category, JSON.stringify(images || []), is_announcement ? 1 : 0);
    
    res.json({ success: true, data: { id: result.lastInsertRowid }, message: '发布成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '发布失败', error: error.message });
  }
});

router.post('/:id/comment', authMiddleware, (req, res) => {
  try {
    const { content } = req.body;
    
    const result = db.prepare('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)').run(req.params.id, req.user.id, content);
    db.prepare('UPDATE posts SET comments = comments + 1 WHERE id = ?').run(req.params.id);
    
    res.json({ success: true, data: { id: result.lastInsertRowid }, message: '评论成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '评论失败', error: error.message });
  }
});

router.post('/:id/like', authMiddleware, (req, res) => {
  try {
    db.prepare('UPDATE posts SET likes = likes + 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: '点赞成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '点赞失败', error: error.message });
  }
});

module.exports = router;
