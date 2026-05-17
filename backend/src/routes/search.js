const express = require('express');
const router = express.Router();
const { getQuery, runQuery, allQuery } = require('../database');
const { authenticateToken } = require('../middleware/auth');

router.get('/hot', authenticateToken, async (req, res) => {
  try {
    const hotSearches = await allQuery(`
      SELECT * FROM hot_searches
      ORDER BY rank ASC, search_count DESC
      LIMIT 20
    `);
    res.json({ success: true, data: hotSearches });
  } catch (error) {
    console.error('Get hot searches error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { keyword, type = 'video', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    if (!keyword) {
      return res.status(400).json({ success: false, message: '请输入搜索关键词' });
    }

    try {
      await runQuery(`
        INSERT OR IGNORE INTO hot_searches (keyword, search_count) VALUES (?, 1)
      `, [keyword]);
      await runQuery(`
        UPDATE hot_searches SET search_count = search_count + 1 WHERE keyword = ?
      `, [keyword]);
    } catch (e) {
    }

    if (type === 'video') {
      const videos = await allQuery(`
        SELECT v.*, u.nickname, u.avatar as user_avatar
        FROM videos v
        LEFT JOIN users u ON v.user_id = u.id
        WHERE v.status = 1 AND (v.title LIKE ? OR v.description LIKE ?)
        ORDER BY v.like_count DESC, v.view_count DESC
        LIMIT ? OFFSET ?
      `, [`%${keyword}%`, `%${keyword}%`, parseInt(limit), parseInt(offset)]);

      return res.json({ success: true, data: { videos, page: parseInt(page) } });
    } else if (type === 'user') {
      const users = await allQuery(`
        SELECT id, nickname, avatar, bio, follower_count
        FROM users
        WHERE nickname LIKE ? OR username LIKE ?
        ORDER BY follower_count DESC
        LIMIT ? OFFSET ?
      `, [`%${keyword}%`, `%${keyword}%`, parseInt(limit), parseInt(offset)]);

      return res.json({ success: true, data: { users, page: parseInt(page) } });
    } else {
      return res.json({ success: true, data: { results: [], page: parseInt(page) } });
    }
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/banners', authenticateToken, async (req, res) => {
  try {
    const banners = await allQuery(`
      SELECT * FROM banners
      WHERE status = 1
      ORDER BY position ASC
      LIMIT 10
    `);
    res.json({ success: true, data: banners });
  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
