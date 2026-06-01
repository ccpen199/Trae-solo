const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database/connection');

const JWT_SECRET = process.env.JWT_SECRET || 'hiyou-movie-secret-key-2024';

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: '登录已过期，请重新登录' });
  }
};

router.get('/profile', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, phone, nickname, avatar, is_vip, vip_expire_at, city_id, email FROM users WHERE id = ?').get(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/profile', authMiddleware, (req, res) => {
  try {
    const { nickname, avatar, city_id, email } = req.body;
    
    const updates = [];
    const params = [];
    
    if (nickname !== undefined) {
      updates.push('nickname = ?');
      params.push(nickname);
    }
    if (avatar !== undefined) {
      updates.push('avatar = ?');
      params.push(avatar);
    }
    if (city_id !== undefined) {
      updates.push('city_id = ?');
      params.push(city_id);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }
    
    if (updates.length > 0) {
      params.push(req.userId);
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }
    
    const user = db.prepare('SELECT id, phone, nickname, avatar, is_vip, city_id, email FROM users WHERE id = ?').get(req.userId);
    res.json({ success: true, message: '更新成功', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/favorites', authMiddleware, (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const favorites = db.prepare(`
      SELECT m.* FROM favorites f
      JOIN movies m ON f.movie_id = m.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.userId, parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    res.json({ success: true, data: favorites });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/favorites', authMiddleware, (req, res) => {
  try {
    const { movie_id } = req.body;
    
    if (!movie_id) {
      return res.status(400).json({ success: false, message: 'movie_id不能为空' });
    }
    
    const movie = db.prepare('SELECT id FROM movies WHERE id = ?').get(movie_id);
    if (!movie) {
      return res.status(404).json({ success: false, message: '影片不存在' });
    }
    
    try {
      db.prepare('INSERT INTO favorites (user_id, movie_id) VALUES (?, ?)').run(req.userId, movie_id);
    } catch (e) {
      return res.status(400).json({ success: false, message: '已收藏该影片' });
    }
    
    res.json({ success: true, message: '收藏成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/favorites/:movie_id', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM favorites WHERE user_id = ? AND movie_id = ?').run(req.userId, req.params.movie_id);
    res.json({ success: true, message: '取消收藏成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/vip/benefits', (req, res) => {
  const benefits = [
    { id: 1, title: '购票折扣', description: '会员购票享8折优惠', icon: 'discount' },
    { id: 2, title: '专属座位', description: '会员专属最佳观影区', icon: 'seat' },
    { id: 3, title: '积分双倍', description: '消费积分双倍累积', icon: 'points' },
    { id: 4, title: '优先退票', description: '开场前30分钟可免费退票', icon: 'refund' }
  ];
  res.json({ success: true, data: benefits });
});

module.exports = router;
