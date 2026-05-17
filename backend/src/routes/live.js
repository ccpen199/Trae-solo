const express = require('express');
const db = require('../database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/list', optionalAuth, (req, res) => {
  const { page = 1, pageSize = 20, category } = req.query;
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (category) {
    whereClause += ' AND l.category_id = ?';
    params.push(category);
  }

  const rooms = db.prepare(`
    SELECT l.*, u.nickname, u.avatar, c.name as category_name
    FROM live_rooms l
    LEFT JOIN users u ON l.user_id = u.id
    LEFT JOIN categories c ON l.category_id = c.id
    ${whereClause}
    ORDER BY l.is_living DESC, l.viewer_count DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM live_rooms l ${whereClause}`).get(...params);

  res.json({
    success: true,
    data: {
      list: rooms,
      total: total.count
    }
  });
});

router.get('/following', authenticateToken, (req, res) => {
  const rooms = db.prepare(`
    SELECT l.*, u.nickname, u.avatar
    FROM live_rooms l
    LEFT JOIN users u ON l.user_id = u.id
    WHERE l.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)
    ORDER BY l.is_living DESC, l.viewer_count DESC
  `).all(req.user.id);

  res.json({ success: true, data: rooms });
});

router.get('/room/:userId', optionalAuth, (req, res) => {
  const { userId } = req.params;

  const room = db.prepare(`
    SELECT l.*, u.nickname, u.avatar, up.follower_count
    FROM live_rooms l
    LEFT JOIN users u ON l.user_id = u.id
    LEFT JOIN user_profiles up ON l.user_id = up.user_id
    WHERE l.user_id = ?
  `).get(userId);

  if (!room) {
    return res.status(404).json({ success: false, message: '直播间不存在' });
  }

  let isFollowing = false;
  if (req.user) {
    const follow = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.id, userId);
    isFollowing = !!follow;
  }

  res.json({
    success: true,
    data: {
      room,
      isFollowing
    }
  });
});

router.post('/toggle-live', authenticateToken, (req, res) => {
  const room = db.prepare('SELECT * FROM live_rooms WHERE user_id = ?').get(req.user.id);
  
  if (!room) {
    db.prepare('INSERT INTO live_rooms (user_id, title, is_living) VALUES (?, ?, 1)').run(req.user.id, `${req.user.nickname}的直播间`);
  } else {
    const newStatus = room.is_living === 1 ? 0 : 1;
    db.prepare('UPDATE live_rooms SET is_living = ?, start_time = ? WHERE user_id = ?').run(newStatus, newStatus === 1 ? Math.floor(Date.now() / 1000) : null, req.user.id);
  }

  res.json({ success: true, message: room?.is_living === 1 ? '已关闭直播' : '已开始直播' });
});

router.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories WHERE type = ? ORDER BY sort_order ASC').all('live');
  res.json({ success: true, data: categories });
});

module.exports = router;
