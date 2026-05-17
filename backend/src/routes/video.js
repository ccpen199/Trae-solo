const express = require('express');
const db = require('../database/db');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { successResponse, errorResponse } = require('../utils');

const router = express.Router();

router.get('/home', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, tag = '' } = req.query;
    const offset = (page - 1) * limit;

    const banners = db.prepare(`
      SELECT * FROM banners WHERE is_active = 1 ORDER BY sort_order ASC
    `).all();

    const tags = db.prepare(`
      SELECT * FROM tags ORDER BY sort_order ASC
    `).all();

    let videoQuery = `
      SELECT v.*, u.username, u.avatar
      FROM videos v
      JOIN users u ON v.user_id = u.id
    `;
    let countQuery = 'SELECT COUNT(*) as count FROM videos';
    const params = [];
    const countParams = [];

    if (tag && tag !== '推荐' && tag !== '热门') {
      videoQuery += ' WHERE v.tags LIKE ?';
      countQuery += ' WHERE tags LIKE ?';
      params.push(`%${tag}%`);
      countParams.push(`%${tag}%`);
    }

    if (tag === '热门') {
      videoQuery += ' ORDER BY v.play_count DESC, v.like_count DESC LIMIT ? OFFSET ?';
    } else {
      videoQuery += ' ORDER BY v.created_at DESC LIMIT ? OFFSET ?';
    }
    params.push(parseInt(limit), parseInt(offset));

    const videos = db.prepare(videoQuery).all(...params);

    const total = db.prepare(countQuery).get(...countParams).count;

    successResponse(res, {
      banners,
      tags,
      videos: videos.map(v => ({
        ...v,
        isLiked: req.user ? !!db.prepare('SELECT 1 FROM user_likes WHERE user_id = ? AND video_id = ?').get(req.user.id, v.id) : false
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        hasMore: page * limit < total
      }
    });
  } catch (error) {
    console.error('获取首页数据失败:', error);
    errorResponse(res, '获取数据失败');
  }
});

router.get('/detail/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    db.prepare(`
      UPDATE videos SET play_count = play_count + 1 WHERE id = ?
    `).run(id);

    const video = db.prepare(`
      SELECT v.*, u.username, u.avatar
      FROM videos v
      JOIN users u ON v.user_id = u.id
      WHERE v.id = ?
    `).get(id);

    if (!video) {
      return errorResponse(res, '视频不存在', 404);
    }

    const isLiked = req.user ? db.prepare('SELECT 1 FROM user_likes WHERE user_id = ? AND video_id = ?').get(req.user.id, id) ? true : false : false;
    const isFollowing = req.user ? db.prepare('SELECT 1 FROM user_follows WHERE follower_id = ? AND following_id = ?').get(req.user.id, video.user_id) ? true : false : false;

    successResponse(res, {
      ...video,
      isLiked,
      isFollowing
    });
  } catch (error) {
    console.error('获取视频详情失败:', error);
    errorResponse(res, '获取视频详情失败');
  }
});

router.post('/like/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = db.prepare('SELECT * FROM user_likes WHERE user_id = ? AND video_id = ?').get(userId, id);

    if (existing) {
      db.prepare('DELETE FROM user_likes WHERE id = ?').run(existing.id);
      db.prepare('UPDATE videos SET like_count = MAX(0, like_count - 1) WHERE id = ?').run(id);
      successResponse(res, { liked: false }, '已取消点赞');
    } else {
      db.prepare('INSERT INTO user_likes (user_id, video_id) VALUES (?, ?)').run(userId, id);
      db.prepare('UPDATE videos SET like_count = like_count + 1 WHERE id = ?').run(id);
      successResponse(res, { liked: true }, '点赞成功');
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
    errorResponse(res, '操作失败');
  }
});

router.get('/danmaku/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const danmakus = db.prepare(`
      SELECT d.*, u.username
      FROM danmakus d
      JOIN users u ON d.user_id = u.id
      WHERE d.video_id = ?
      ORDER BY d.time ASC
    `).all(id);

    successResponse(res, danmakus);
  } catch (error) {
    console.error('获取弹幕失败:', error);
    errorResponse(res, '获取弹幕失败');
  }
});

router.post('/danmaku/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, time, color, type } = req.body;
    const userId = req.user.id;

    if (!content || !time) {
      return errorResponse(res, '参数不完整');
    }

    db.prepare(`
      INSERT INTO danmakus (video_id, user_id, content, time, color, type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, content, time, color || '#FFFFFF', type || 0);

    successResponse(res, null, '弹幕发送成功');
  } catch (error) {
    console.error('发送弹幕失败:', error);
    errorResponse(res, '发送弹幕失败');
  }
});

router.post('/share/:id', async (req, res) => {
  try {
    const { id } = req.params;

    db.prepare(`
      UPDATE videos SET share_count = share_count + 1 WHERE id = ?
    `).run(id);

    successResponse(res, null, '分享成功');
  } catch (error) {
    console.error('分享失败:', error);
    errorResponse(res, '分享失败');
  }
});

router.get('/search', async (req, res) => {
  try {
    const { keyword, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    if (!keyword) {
      return errorResponse(res, '请输入搜索关键词');
    }

    const videos = db.prepare(`
      SELECT v.*, u.username, u.avatar
      FROM videos v
      JOIN users u ON v.user_id = u.id
      WHERE v.title LIKE ? OR v.description LIKE ?
      ORDER BY v.created_at DESC
      LIMIT ? OFFSET ?
    `).all(`%${keyword}%`, `%${keyword}%`, parseInt(limit), parseInt(offset));

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM videos WHERE title LIKE ? OR description LIKE ?
    `).get(`%${keyword}%`, `%${keyword}%`);

    successResponse(res, {
      videos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total.count,
        hasMore: page * limit < total.count
      }
    });
  } catch (error) {
    console.error('搜索失败:', error);
    errorResponse(res, '搜索失败');
  }
});

module.exports = router;
