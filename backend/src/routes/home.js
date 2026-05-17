const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/data', (req, res) => {
  try {
    const banners = db.prepare(`
      SELECT * FROM advertisements 
      WHERE active = 1 AND position = 'home_banner'
      LIMIT 5
    `).all();

    const categories = db.prepare(`
      SELECT * FROM categories ORDER BY sort_order ASC LIMIT 10
    `).all();

    const recommendSongs = db.prepare(`
      SELECT s.*, a.name as artist_name
      FROM songs s
      LEFT JOIN artists a ON s.artist_id = a.id
      ORDER BY s.plays DESC
      LIMIT 10
    `).all();

    const recommendPlaylists = db.prepare(`
      SELECT p.*, COUNT(ps.song_id) as song_count
      FROM playlists p
      LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
      WHERE p.is_public = 1
      GROUP BY p.id
      ORDER BY p.plays DESC
      LIMIT 6
    `).all();

    const hotSongs = db.prepare(`
      SELECT s.*, a.name as artist_name
      FROM songs s
      LEFT JOIN artists a ON s.artist_id = a.id
      ORDER BY s.plays DESC
      LIMIT 20
    `).all();

    const cardAds = db.prepare(`
      SELECT * FROM advertisements 
      WHERE active = 1 AND position = 'home_card'
      LIMIT 2
    `).all();

    res.json({
      success: true,
      data: {
        banners,
        categories,
        recommendSongs,
        recommendPlaylists,
        hotSongs,
        cardAds
      }
    });
  } catch (error) {
    console.error('获取首页数据失败:', error);
    res.status(500).json({ success: false, message: '获取首页数据失败' });
  }
});

module.exports = router;
