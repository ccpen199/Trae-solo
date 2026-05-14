const express = require('express');
const db = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/my-posts', authMiddleware, (req, res) => {
  try {
    const posts = db.prepare('SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    const lostItems = db.prepare('SELECT * FROM lost_items WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    const secondhand = db.prepare('SELECT * FROM secondhand_items WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    const errands = db.prepare('SELECT * FROM errands WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    
    res.json({ 
      success: true, 
      data: { 
        posts: posts.map(p => ({ ...p, images: p.images ? JSON.parse(p.images) : [] })),
        lostItems: lostItems.map(p => ({ ...p, images: p.images ? JSON.parse(p.images) : [] })),
        secondhand: secondhand.map(p => ({ ...p, images: p.images ? JSON.parse(p.images) : [] })),
        errands: errands.map(p => ({ ...p, tags: p.tags ? JSON.parse(p.tags) : [] }))
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取失败', error: error.message });
  }
});

router.get('/favorites', authMiddleware, (req, res) => {
  try {
    const favorites = db.prepare('SELECT * FROM favorites WHERE user_id = ?').all(req.user.id);
    res.json({ success: true, data: favorites });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取失败', error: error.message });
  }
});

router.post('/favorites', authMiddleware, (req, res) => {
  try {
    const { item_type, item_id } = req.body;
    
    const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND item_type = ? AND item_id = ?').get(req.user.id, item_type, item_id);
    if (existing) {
      db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id);
      return res.json({ success: true, message: '取消收藏', is_favorite: false });
    }
    
    db.prepare('INSERT INTO favorites (user_id, item_type, item_id) VALUES (?, ?, ?)').run(req.user.id, item_type, item_id);
    res.json({ success: true, message: '收藏成功', is_favorite: true });
  } catch (error) {
    res.status(500).json({ success: false, message: '操作失败', error: error.message });
  }
});

router.get('/messages', authMiddleware, (req, res) => {
  try {
    const messages = db.prepare(`
      SELECT m.*, u.nickname as from_nickname, u.avatar as from_avatar 
      FROM messages m 
      LEFT JOIN users u ON m.from_user_id = u.id 
      WHERE m.to_user_id = ? 
      ORDER BY m.created_at DESC
    `).all(req.user.id);
    
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取失败', error: error.message });
  }
});

router.post('/messages', authMiddleware, (req, res) => {
  try {
    const { to_user_id, content } = req.body;
    
    const result = db.prepare('INSERT INTO messages (from_user_id, to_user_id, content) VALUES (?, ?, ?)')
      .run(req.user.id, to_user_id, content);
    
    res.json({ success: true, data: { id: result.lastInsertRowid }, message: '发送成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '发送失败', error: error.message });
  }
});

router.get('/transactions', authMiddleware, (req, res) => {
  try {
    const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取失败', error: error.message });
  }
});

router.post('/feedback', authMiddleware, (req, res) => {
  try {
    const { content, type } = req.body;
    res.json({ success: true, message: '反馈已提交' });
  } catch (error) {
    res.status(500).json({ success: false, message: '提交失败', error: error.message });
  }
});

module.exports = router;
