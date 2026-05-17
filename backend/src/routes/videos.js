const express = require('express');
const { db } = require('../database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/recommend', optionalAuth, (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const videos = db.prepare(`
      SELECT 
        v.*,
        u.nickname as author_name,
        u.avatar as author_avatar,
        u.id as author_id,
        CASE WHEN l.id IS NOT NULL THEN 1 ELSE 0 END as is_liked,
        CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END as is_followed,
        CASE WHEN fav.id IS NOT NULL THEN 1 ELSE 0 END as is_favorited
      FROM videos v
      LEFT JOIN users u ON v.user_id = u.id
      LEFT JOIN likes l ON l.video_id = v.id AND l.user_id = ?
      LEFT JOIN follows f ON f.following_id = v.user_id AND f.follower_id = ?
      LEFT JOIN favorites fav ON fav.video_id = v.id AND fav.user_id = ?
      WHERE v.status = 1 AND v.is_private = 0
      ORDER BY v.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user?.id || 0, req.user?.id || 0, req.user?.id || 0, limit, offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM videos WHERE status = 1 AND is_private = 0').get();

    res.json({
      success: true,
      data: {
        list: videos,
        total: total.count,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get recommend videos error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取视频列表失败' 
    });
  }
});

router.get('/nearby', optionalAuth, (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const videos = db.prepare(`
      SELECT 
        v.*,
        u.nickname as author_name,
        u.avatar as author_avatar,
        u.id as author_id,
        CASE WHEN l.id IS NOT NULL THEN 1 ELSE 0 END as is_liked
      FROM videos v
      LEFT JOIN users u ON v.user_id = u.id
      LEFT JOIN likes l ON l.video_id = v.id AND l.user_id = ?
      WHERE v.status = 1 AND v.is_private = 0
      ORDER BY RANDOM()
      LIMIT ? OFFSET ?
    `).all(req.user?.id || 0, limit, offset);

    res.json({
      success: true,
      data: { list: videos }
    });
  } catch (error) {
    console.error('Get nearby videos error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取附近视频失败' 
    });
  }
});

router.get('/:id', optionalAuth, (req, res) => {
  try {
    const video = db.prepare(`
      SELECT 
        v.*,
        u.nickname as author_name,
        u.avatar as author_avatar,
        u.id as author_id,
        CASE WHEN l.id IS NOT NULL THEN 1 ELSE 0 END as is_liked,
        CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END as is_followed,
        CASE WHEN fav.id IS NOT NULL THEN 1 ELSE 0 END as is_favorited
      FROM videos v
      LEFT JOIN users u ON v.user_id = u.id
      LEFT JOIN likes l ON l.video_id = v.id AND l.user_id = ?
      LEFT JOIN follows f ON f.following_id = v.user_id AND f.follower_id = ?
      LEFT JOIN favorites fav ON fav.video_id = v.id AND fav.user_id = ?
      WHERE v.id = ?
    `).get(req.user?.id || 0, req.user?.id || 0, req.user?.id || 0, req.params.id);

    if (!video) {
      return res.status(404).json({ 
        success: false, 
        message: '视频不存在' 
      });
    }

    db.prepare('UPDATE videos SET views_count = views_count + 1 WHERE id = ?').run(req.params.id);

    res.json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Get video detail error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取视频详情失败' 
    });
  }
});

router.post('/', authenticateToken, (req, res) => {
  try {
    const { title, description, video_url, cover_url, duration } = req.body;

    if (!video_url) {
      return res.status(400).json({ 
        success: false, 
        message: '视频地址不能为空' 
      });
    }

    const result = db.prepare(
      'INSERT INTO videos (user_id, title, description, video_url, cover_url, duration) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.user.id, title, description, video_url, cover_url, duration);

    db.prepare('UPDATE users SET works_count = works_count + 1 WHERE id = ?').run(req.user.id);

    res.json({
      success: true,
      message: '发布成功',
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    console.error('Create video error:', error);
    res.status(500).json({ 
      success: false, 
      message: '发布失败，请重试' 
    });
  }
});

router.post('/:id/like', authenticateToken, (req, res) => {
  try {
    const videoId = req.params.id;
    const userId = req.user.id;

    const existing = db.prepare('SELECT id FROM likes WHERE video_id = ? AND user_id = ?').get(videoId, userId);

    if (existing) {
      db.prepare('DELETE FROM likes WHERE video_id = ? AND user_id = ?').run(videoId, userId);
      db.prepare('UPDATE videos SET likes_count = likes_count - 1 WHERE id = ?').run(videoId);
      
      res.json({
        success: true,
        message: '取消点赞',
        data: { is_liked: false }
      });
    } else {
      db.prepare('INSERT INTO likes (video_id, user_id) VALUES (?, ?)').run(videoId, userId);
      db.prepare('UPDATE videos SET likes_count = likes_count + 1 WHERE id = ?').run(videoId);
      
      res.json({
        success: true,
        message: '点赞成功',
        data: { is_liked: true }
      });
    }
  } catch (error) {
    console.error('Like video error:', error);
    res.status(500).json({ 
      success: false, 
      message: '操作失败' 
    });
  }
});

router.post('/:id/favorite', authenticateToken, (req, res) => {
  try {
    const videoId = req.params.id;
    const userId = req.user.id;

    const existing = db.prepare('SELECT id FROM favorites WHERE video_id = ? AND user_id = ?').get(videoId, userId);

    if (existing) {
      db.prepare('DELETE FROM favorites WHERE video_id = ? AND user_id = ?').run(videoId, userId);
      
      res.json({
        success: true,
        message: '取消收藏',
        data: { is_favorited: false }
      });
    } else {
      db.prepare('INSERT INTO favorites (video_id, user_id) VALUES (?, ?)').run(videoId, userId);
      
      res.json({
        success: true,
        message: '收藏成功',
        data: { is_favorited: true }
      });
    }
  } catch (error) {
    console.error('Favorite video error:', error);
    res.status(500).json({ 
      success: false, 
      message: '操作失败' 
    });
  }
});

router.post('/:id/share', optionalAuth, (req, res) => {
  try {
    const videoId = req.params.id;
    db.prepare('UPDATE videos SET shares_count = shares_count + 1 WHERE id = ?').run(videoId);
    
    res.json({
      success: true,
      message: '分享成功'
    });
  } catch (error) {
    console.error('Share video error:', error);
    res.status(500).json({ 
      success: false, 
      message: '操作失败' 
    });
  }
});

module.exports = router;
