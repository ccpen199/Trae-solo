const express = require('express');
const { db } = require('../models/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/favorites', authenticateToken, (req, res) => {
  const { type = 'guide' } = req.query;
  
  const favorites = db.prepare(`
    SELECT f.*, 
      CASE WHEN f.target_type = 'guide' THEN g.title ELSE h.name END as title,
      CASE WHEN f.target_type = 'guide' THEN g.cover ELSE h.images END as cover
    FROM favorites f
    LEFT JOIN guides g ON f.target_type = 'guide' AND f.target_id = g.id
    LEFT JOIN hotels h ON f.target_type = 'hotel' AND f.target_id = h.id
    WHERE f.user_id = ? AND f.target_type = ?
    ORDER BY f.created_at DESC
  `).all(req.user.id, type);
  
  res.json(favorites);
});

router.post('/favorites', authenticateToken, (req, res) => {
  const { target_type, target_id } = req.body;
  
  try {
    const stmt = db.prepare(`
      INSERT INTO favorites (user_id, target_type, target_id)
      VALUES (?, ?, ?)
    `);
    stmt.run(req.user.id, target_type, target_id);
    res.json({ message: '收藏成功' });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      db.prepare('DELETE FROM favorites WHERE user_id = ? AND target_type = ? AND target_id = ?').run(req.user.id, target_type, target_id);
      res.json({ message: '取消收藏' });
    } else {
      res.status(500).json({ error: '操作失败' });
    }
  }
});

router.get('/follows', authenticateToken, (req, res) => {
  const follows = db.prepare(`
    SELECT f.*, u.nickname, u.avatar, u.bio
    FROM follows f
    LEFT JOIN users u ON f.following_id = u.id
    WHERE f.follower_id = ?
    ORDER BY f.created_at DESC
  `).all(req.user.id);
  
  res.json(follows);
});

router.post('/follows', authenticateToken, (req, res) => {
  const { following_id } = req.body;
  
  if (following_id === req.user.id) {
    return res.status(400).json({ error: '不能关注自己' });
  }
  
  try {
    const stmt = db.prepare(`
      INSERT INTO follows (follower_id, following_id)
      VALUES (?, ?)
    `);
    stmt.run(req.user.id, following_id);
    res.json({ message: '关注成功' });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(req.user.id, following_id);
      res.json({ message: '取消关注' });
    } else {
      res.status(500).json({ error: '操作失败' });
    }
  }
});

router.get('/orders', authenticateToken, (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, h.name as hotel_name, h.images as hotel_image
    FROM orders o
    LEFT JOIN hotels h ON o.hotel_id = h.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `).all(req.user.id);
  
  res.json(orders);
});

router.get('/messages', authenticateToken, (req, res) => {
  const messages = db.prepare(`
    SELECT m.*, u.nickname, u.avatar
    FROM messages m
    LEFT JOIN users u ON m.from_user_id = u.id
    WHERE m.to_user_id = ?
    ORDER BY m.created_at DESC
  `).all(req.user.id);
  
  res.json(messages);
});

router.get('/my-guides', authenticateToken, (req, res) => {
  const guides = db.prepare(`
    SELECT * FROM guides WHERE user_id = ? ORDER BY created_at DESC
  `).all(req.user.id);
  
  res.json(guides);
});

module.exports = router;
