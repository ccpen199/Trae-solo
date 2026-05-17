const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

router.get('/:id/following-rooms', (req, res) => {
  try {
    const { id } = req.params;
    
    const following = db.prepare(`
      SELECT following_id FROM follows WHERE follower_id = ?
    `).all(id).map(f => f.following_id);

    if (following.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    const placeholders = following.map(() => '?').join(',');
    const rooms = db.prepare(`
      SELECT r.*, u.nickname as host_name, u.avatar as host_avatar
      FROM rooms r
      JOIN users u ON r.host_id = u.id
      WHERE r.host_id IN (${placeholders}) AND r.status IN ('waiting', 'playing')
      ORDER BY r.popularity DESC, r.current_players DESC
    `).all(...following);

    res.json({
      success: true,
      data: rooms
    });
  } catch (error) {
    console.error('Get following rooms error:', error);
    res.status(500).json({
      success: false,
      message: '获取关注用户游戏失败'
    });
  }
});

module.exports = router;
