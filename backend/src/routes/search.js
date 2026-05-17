const express = require('express');
const { db } = require('../database');
const { optionalAuth, authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/hot', (req, res) => {
  try {
    const hotSearches = db.prepare(`
      SELECT keyword, count, is_hot
      FROM hot_searches
      ORDER BY count DESC
      LIMIT 20
    `).all();

    const defaultHot = [
      { keyword: '搞笑视频', count: 12580, is_hot: 1 },
      { keyword: '美食探店', count: 9820, is_hot: 1 },
      { keyword: '旅行日记', count: 8650, is_hot: 1 },
      { keyword: '健身打卡', count: 7520, is_hot: 0 },
      { keyword: '萌宠日常', count: 6890, is_hot: 1 },
      { keyword: '音乐翻唱', count: 5420, is_hot: 0 },
      { keyword: '舞蹈挑战', count: 4890, is_hot: 0 },
      { keyword: '穿搭分享', count: 4250, is_hot: 0 },
      { keyword: '美妆教程', count: 3980, is_hot: 0 },
      { keyword: '科技测评', count: 3560, is_hot: 0 }
    ];

    res.json({
      success: true,
      data: { list: hotSearches.length > 0 ? hotSearches : defaultHot }
    });
  } catch (error) {
    console.error('Get hot searches error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取热搜失败' 
    });
  }
});

router.get('/videos', optionalAuth, (req, res) => {
  try {
    const { keyword, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    if (!keyword) {
      return res.status(400).json({ 
        success: false, 
        message: '搜索关键词不能为空' 
      });
    }

    const videos = db.prepare(`
      SELECT 
        v.*,
        u.nickname as author_name,
        u.avatar as author_avatar,
        CASE WHEN l.id IS NOT NULL THEN 1 ELSE 0 END as is_liked
      FROM videos v
      LEFT JOIN users u ON v.user_id = u.id
      LEFT JOIN likes l ON l.video_id = v.id AND l.user_id = ?
      WHERE v.status = 1 AND v.is_private = 0
      AND (v.title LIKE ? OR v.description LIKE ?)
      ORDER BY v.views_count DESC
      LIMIT ? OFFSET ?
    `).all(req.user?.id || 0, `%${keyword}%`, `%${keyword}%`, limit, offset);

    const existingHot = db.prepare('SELECT id FROM hot_searches WHERE keyword = ?').get(keyword);
    if (existingHot) {
      db.prepare('UPDATE hot_searches SET count = count + 1, updated_at = CURRENT_TIMESTAMP WHERE keyword = ?').run(keyword);
    } else {
      db.prepare('INSERT INTO hot_searches (keyword, count) VALUES (?, 1)').run(keyword);
    }

    res.json({
      success: true,
      data: { list: videos }
    });
  } catch (error) {
    console.error('Search videos error:', error);
    res.status(500).json({ 
      success: false, 
      message: '搜索失败' 
    });
  }
});

router.get('/history', authenticateToken, (req, res) => {
  try {
    const history = db.prepare(`
      SELECT keyword, search_count
      FROM search_history
      WHERE user_id = ?
      ORDER BY updated_at DESC
      LIMIT 20
    `).all(req.user.id);

    res.json({
      success: true,
      data: { list: history }
    });
  } catch (error) {
    console.error('Get search history error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取搜索历史失败' 
    });
  }
});

module.exports = router;
