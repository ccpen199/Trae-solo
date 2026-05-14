const express = require('express');
const { db } = require('../database/init');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, username, nickname, avatar, bio, gender, created_at FROM users WHERE id != ?';
    let params = [req.user.id];

    if (search) {
      query += ' AND (nickname LIKE ? OR username LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const users = db.prepare(query).all(...params);

    const countQuery = 'SELECT COUNT(*) as total FROM users WHERE id != ?';
    const countParams = [req.user.id];
    if (search) {
      countQuery += ' AND (nickname LIKE ? OR username LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    const { total } = db.prepare(countQuery).get(...countParams);

    res.json({ success: true, data: { users, total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, nickname, avatar, bio, gender, created_at FROM users WHERE id = ?').get(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    db.prepare('INSERT INTO analytics (user_id, event_type, event_data, page) VALUES (?, ?, ?, ?)').run(
      req.user.id,
      'view_profile',
      JSON.stringify({ target_user_id: user.id }),
      'profile'
    );

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
