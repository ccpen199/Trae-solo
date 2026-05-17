const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/', (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const playlists = db.prepare(`
      SELECT p.*, COUNT(ps.song_id) as song_count
      FROM playlists p
      LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
      WHERE p.is_public = 1
      GROUP BY p.id
      ORDER BY p.plays DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM playlists WHERE is_public = 1').get();

    res.json({
      success: true,
      data: {
        playlists,
        pagination: {
          total: total.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取歌单列表失败:', error);
    res.status(500).json({ success: false, message: '获取歌单列表失败' });
  }
});

router.get('/recommend', (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const playlists = db.prepare(`
      SELECT p.*, COUNT(ps.song_id) as song_count
      FROM playlists p
      LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
      WHERE p.is_public = 1
      GROUP BY p.id
      ORDER BY RANDOM()
      LIMIT ?
    `).all(limit);

    res.json({
      success: true,
      data: playlists
    });
  } catch (error) {
    console.error('获取推荐歌单失败:', error);
    res.status(500).json({ success: false, message: '获取推荐歌单失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const playlist = db.prepare(`
      SELECT p.*, COUNT(ps.song_id) as song_count
      FROM playlists p
      LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
      WHERE p.id = ?
      GROUP BY p.id
    `).get(req.params.id);

    if (!playlist) {
      return res.status(404).json({ success: false, message: '歌单不存在' });
    }

    const songs = db.prepare(`
      SELECT s.*, a.name as artist_name
      FROM playlist_songs ps
      JOIN songs s ON ps.song_id = s.id
      LEFT JOIN artists a ON s.artist_id = a.id
      WHERE ps.playlist_id = ?
      ORDER BY ps.order_index ASC
    `).all(req.params.id);

    playlist.songs = songs;

    res.json({ success: true, data: playlist });
  } catch (error) {
    console.error('获取歌单详情失败:', error);
    res.status(500).json({ success: false, message: '获取歌单详情失败' });
  }
});

router.post('/:id/play', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE playlists SET plays = plays + 1 WHERE id = ?').run(id);
    res.json({ success: true, message: '播放量已更新' });
  } catch (error) {
    console.error('更新播放量失败:', error);
    res.status(500).json({ success: false, message: '更新播放量失败' });
  }
});

module.exports = router;
