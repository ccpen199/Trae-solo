const express = require('express');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM music_categories ORDER BY sort_order ASC').all();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('获取音乐分类错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/library', (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM music_library';
    let countQuery = 'SELECT COUNT(*) as total FROM music_library';
    const params = [];

    if (category) {
      query += ' WHERE category = ?';
      countQuery += ' WHERE category = ?';
      params.push(category);
    }

    query += ' ORDER BY play_count DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const music = db.prepare(query).all(...params);
    const { total } = db.prepare(countQuery).get(category || []);

    res.json({ success: true, data: { list: music, total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    console.error('获取音乐库错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/playlists', authenticateToken, (req, res) => {
  try {
    const playlists = db.prepare('SELECT * FROM user_playlists WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json({ success: true, data: playlists });
  } catch (error) {
    console.error('获取歌单错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/playlists', authenticateToken, (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: '请输入歌单名称' });
    }

    const result = db.prepare('INSERT INTO user_playlists (user_id, name) VALUES (?, ?)').run(req.user.id, name);
    res.json({ success: true, data: { id: result.lastInsertRowid }, message: '歌单创建成功' });
  } catch (error) {
    console.error('创建歌单错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/playlists/:playlistId/songs/:musicId', authenticateToken, (req, res) => {
  try {
    const { playlistId, musicId } = req.params;
    
    const playlist = db.prepare('SELECT * FROM user_playlists WHERE id = ? AND user_id = ?').get(playlistId, req.user.id);
    if (!playlist) {
      return res.status(404).json({ success: false, message: '歌单不存在' });
    }

    try {
      db.prepare('INSERT INTO playlist_songs (playlist_id, music_id) VALUES (?, ?)').run(playlistId, musicId);
      res.json({ success: true, message: '添加成功' });
    } catch (e) {
      res.json({ success: true, message: '歌曲已在歌单中' });
    }
  } catch (error) {
    console.error('添加歌曲到歌单错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
