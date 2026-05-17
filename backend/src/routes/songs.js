const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/', (req, res) => {
  try {
    const { page = 1, limit = 20, sort = 'plays' } = req.query;
    const offset = (page - 1) * limit;
    
    const orderBy = sort === 'complete_rate' 
      ? '(complete_plays * 1.0 / plays) DESC' 
      : 's.plays DESC';
    
    const songs = db.prepare(`
      SELECT s.*, a.name as artist_name, a.avatar as artist_avatar
      FROM songs s
      LEFT JOIN artists a ON s.artist_id = a.id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM songs').get();

    res.json({
      success: true,
      data: {
        songs,
        pagination: {
          total: total.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取歌曲列表失败:', error);
    res.status(500).json({ success: false, message: '获取歌曲列表失败' });
  }
});

router.get('/recommend', (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const songs = db.prepare(`
      SELECT s.*, a.name as artist_name
      FROM songs s
      LEFT JOIN artists a ON s.artist_id = a.id
      ORDER BY RANDOM()
      LIMIT ?
    `).all(limit);

    res.json({
      success: true,
      data: songs
    });
  } catch (error) {
    console.error('获取推荐歌曲失败:', error);
    res.status(500).json({ success: false, message: '获取推荐歌曲失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const song = db.prepare(`
      SELECT s.*, a.name as artist_name, a.avatar as artist_avatar, a.description as artist_description
      FROM songs s
      LEFT JOIN artists a ON s.artist_id = a.id
      WHERE s.id = ?
    `).get(req.params.id);

    if (!song) {
      return res.status(404).json({ success: false, message: '歌曲不存在' });
    }

    res.json({ success: true, data: song });
  } catch (error) {
    console.error('获取歌曲详情失败:', error);
    res.status(500).json({ success: false, message: '获取歌曲详情失败' });
  }
});

router.post('/:id/play', (req, res) => {
  try {
    const { id } = req.params;
    const { duration = 0, completed = false, user_id = null } = req.body;

    db.prepare('UPDATE songs SET plays = plays + 1 WHERE id = ?').run(id);
    
    if (completed) {
      db.prepare('UPDATE songs SET complete_plays = complete_plays + 1 WHERE id = ?').run(id);
    }

    if (user_id) {
      db.prepare(`
        INSERT INTO play_history (user_id, song_id, play_duration, completed)
        VALUES (?, ?, ?, ?)
      `).run(user_id, id, duration, completed ? 1 : 0);
    }

    res.json({ success: true, message: '播放记录已更新' });
  } catch (error) {
    console.error('更新播放记录失败:', error);
    res.status(500).json({ success: false, message: '更新播放记录失败' });
  }
});

router.post('/:id/like', (req, res) => {
  try {
    const { id } = req.params;
    const { user_id = 1 } = req.body;

    const existing = db.prepare('SELECT id FROM user_likes WHERE user_id = ? AND song_id = ?').get(user_id, id);
    
    if (existing) {
      db.prepare('DELETE FROM user_likes WHERE user_id = ? AND song_id = ?').run(user_id, id);
      db.prepare('UPDATE songs SET likes = likes - 1 WHERE id = ?').run(id);
      res.json({ success: true, data: { liked: false }, message: '已取消点赞' });
    } else {
      db.prepare('INSERT INTO user_likes (user_id, song_id) VALUES (?, ?)').run(user_id, id);
      db.prepare('UPDATE songs SET likes = likes + 1 WHERE id = ?').run(id);
      res.json({ success: true, data: { liked: true }, message: '点赞成功' });
    }
  } catch (error) {
    console.error('操作失败:', error);
    res.status(500).json({ success: false, message: '操作失败' });
  }
});

router.post('/:id/dislike', (req, res) => {
  try {
    const { id } = req.params;
    const { user_id = 1, reason = '' } = req.body;

    db.prepare(`
      INSERT OR IGNORE INTO disliked_songs (user_id, song_id, reason)
      VALUES (?, ?, ?)
    `).run(user_id, id, reason);

    res.json({ success: true, message: '已标记为不感兴趣' });
  } catch (error) {
    console.error('操作失败:', error);
    res.status(500).json({ success: false, message: '操作失败' });
  }
});

router.post('/:id/coin', (req, res) => {
  try {
    const { id } = req.params;
    const { user_id = 1, amount = 1 } = req.body;

    db.prepare('UPDATE songs SET coins = coins + ? WHERE id = ?').run(amount, id);
    
    db.prepare(`
      INSERT INTO coin_transactions (user_id, song_id, amount, type, description)
      VALUES (?, ?, ?, 'donate', '投币支持')
    `).run(user_id, id, amount);

    res.json({ success: true, message: `成功投币 ${amount} 个` });
  } catch (error) {
    console.error('投币失败:', error);
    res.status(500).json({ success: false, message: '投币失败' });
  }
});

module.exports = router;
