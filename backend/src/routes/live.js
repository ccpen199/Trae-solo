const express = require('express');
const { db } = require('../database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/list', optionalAuth, (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const liveRooms = db.prepare(`
      SELECT 
        lr.*,
        u.nickname as anchor_name,
        u.avatar as anchor_avatar
      FROM live_rooms lr
      LEFT JOIN users u ON lr.user_id = u.id
      WHERE lr.is_live = 1
      ORDER BY lr.viewers_count DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    res.json({
      success: true,
      data: { list: liveRooms }
    });
  } catch (error) {
    console.error('Get live rooms error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取直播列表失败' 
    });
  }
});

router.get('/:id', optionalAuth, (req, res) => {
  try {
    const liveRoom = db.prepare(`
      SELECT 
        lr.*,
        u.nickname as anchor_name,
        u.avatar as anchor_avatar,
        u.bio as anchor_bio,
        u.followers_count as anchor_followers
      FROM live_rooms lr
      LEFT JOIN users u ON lr.user_id = u.id
      WHERE lr.id = ?
    `).get(req.params.id);

    if (!liveRoom) {
      return res.status(404).json({ 
        success: false, 
        message: '直播间不存在' 
      });
    }

    db.prepare('UPDATE live_rooms SET viewers_count = viewers_count + 1 WHERE id = ?').run(req.params.id);

    res.json({
      success: true,
      data: liveRoom
    });
  } catch (error) {
    console.error('Get live room error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取直播间信息失败' 
    });
  }
});

router.post('/', authenticateToken, (req, res) => {
  try {
    const { title, cover_url } = req.body;

    const existingLive = db.prepare('SELECT id FROM live_rooms WHERE user_id = ? AND is_live = 1').get(req.user.id);
    
    if (existingLive) {
      return res.status(400).json({ 
        success: false, 
        message: '您已有正在直播的房间' 
      });
    }

    const result = db.prepare(
      'INSERT INTO live_rooms (user_id, title, cover_url, is_live) VALUES (?, ?, ?, 1)'
    ).run(req.user.id, title || '直播中', cover_url);

    res.json({
      success: true,
      message: '开播成功',
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    console.error('Create live room error:', error);
    res.status(500).json({ 
      success: false, 
      message: '开播失败，请重试' 
    });
  }
});

router.post('/:id/end', authenticateToken, (req, res) => {
  try {
    const liveRoom = db.prepare('SELECT user_id FROM live_rooms WHERE id = ?').get(req.params.id);

    if (!liveRoom) {
      return res.status(404).json({ 
        success: false, 
        message: '直播间不存在' 
      });
    }

    if (liveRoom.user_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: '无权限操作' 
      });
    }

    db.prepare('UPDATE live_rooms SET is_live = 0 WHERE id = ?').run(req.params.id);

    res.json({
      success: true,
      message: '已结束直播'
    });
  } catch (error) {
    console.error('End live room error:', error);
    res.status(500).json({ 
      success: false, 
      message: '结束直播失败' 
    });
  }
});

module.exports = router;
