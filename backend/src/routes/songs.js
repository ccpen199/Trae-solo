const express = require('express');
const { db } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { keyword, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, title, artist, album, cover, duration
      FROM songs
      WHERE 1=1
    `;
    const params = [];

    if (keyword) {
      query += " AND (title LIKE ? OR artist LIKE ?)";
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    query += " ORDER BY id DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const songs = db.prepare(query).all(...params);

    let countQuery = "SELECT COUNT(*) as count FROM songs WHERE 1=1";
    const countParams = [];
    if (keyword) {
      countQuery += " AND (title LIKE ? OR artist LIKE ?)";
      countParams.push(`%${keyword}%`, `%${keyword}%`);
    }

    const total = db.prepare(countQuery).get(...countParams);

    res.json({ 
      success: true, 
      data: { 
        list: songs, 
        total: total.count,
        page: parseInt(page),
        limit: parseInt(limit)
      } 
    });
  } catch (error) {
    console.error('获取歌曲列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/search/suggest', (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.json({ success: true, data: [] });
    }

    const suggestions = db.prepare(`
      SELECT id, title, artist
      FROM songs
      WHERE title LIKE ? OR artist LIKE ?
      LIMIT 10
    `).all(`%${keyword}%`, `%${keyword}%`);

    res.json({ success: true, data: suggestions });
  } catch (error) {
    console.error('搜索建议错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(id);

    if (!song) {
      return res.status(404).json({ success: false, message: '歌曲不存在' });
    }

    res.json({ success: true, data: song });
  } catch (error) {
    console.error('获取歌曲详情错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
