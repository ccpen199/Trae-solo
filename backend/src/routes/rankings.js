const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/songs', (req, res) => {
  try {
    const { type = 'plays', limit = 50 } = req.query;

    let orderBy = 's.plays DESC';
    let title = '播放榜';

    switch (type) {
      case 'complete_rate':
        orderBy = '(s.complete_plays * 1.0 / s.plays) DESC';
        title = '完播榜';
        break;
      case 'likes':
        orderBy = 's.likes DESC';
        title = '点赞榜';
        break;
      case 'coins':
        orderBy = 's.coins DESC';
        title = '投币榜';
        break;
      default:
        orderBy = 's.plays DESC';
        title = '播放榜';
    }

    const songs = db.prepare(`
      SELECT s.*, a.name as artist_name, a.avatar as artist_avatar,
        CASE WHEN s.plays > 0 THEN (s.complete_plays * 100.0 / s.plays) ELSE 0 END as complete_rate
      FROM songs s
      LEFT JOIN artists a ON s.artist_id = a.id
      ORDER BY ${orderBy}
      LIMIT ?
    `).all(limit);

    res.json({
      success: true,
      data: {
        title,
        type,
        songs: songs.map((song, index) => ({
          ...song,
          rank: index + 1,
          complete_rate: parseFloat(song.complete_rate.toFixed(2))
        }))
      }
    });
  } catch (error) {
    console.error('获取排行榜失败:', error);
    res.status(500).json({ success: false, message: '获取排行榜失败' });
  }
});

router.get('/artists', (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const artists = db.prepare(`
      SELECT a.*, SUM(s.plays) as total_plays, COUNT(s.id) as song_count
      FROM artists a
      LEFT JOIN songs s ON a.id = s.artist_id
      GROUP BY a.id
      ORDER BY total_plays DESC
      LIMIT ?
    `).all(limit);

    res.json({
      success: true,
      data: artists.map((artist, index) => ({
        ...artist,
        rank: index + 1
      }))
    });
  } catch (error) {
    console.error('获取歌手榜失败:', error);
    res.status(500).json({ success: false, message: '获取歌手榜失败' });
  }
});

module.exports = router;
