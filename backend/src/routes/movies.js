const express = require('express');
const { run, get, all } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { keyword, tag, page = 1, limit = 20 } = req.query;

    let sql = 'SELECT * FROM movies WHERE 1=1';
    const params = [];

    if (keyword) {
      sql += ' AND title LIKE ?';
      params.push(`%${keyword}%`);
    }

    if (tag) {
      sql += ' AND tags LIKE ?';
      params.push(`%${tag}%`);
    }

    sql += ' ORDER BY rating DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const movies = await all(sql, params);

    res.json({
      success: true,
      data: { movies }
    });
  } catch (error) {
    console.error('获取电影列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取电影列表失败'
    });
  }
});

router.get('/hot', authMiddleware, async (req, res) => {
  try {
    const movies = await all('SELECT * FROM movies ORDER BY rating DESC LIMIT 10');

    res.json({
      success: true,
      data: { movies }
    });
  } catch (error) {
    console.error('获取热门电影错误:', error);
    res.status(500).json({
      success: false,
      message: '获取热门电影失败'
    });
  }
});

router.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { movie_id, movie_title, movie_poster } = req.body;

    if (!movie_id || !movie_title) {
      return res.status(400).json({
        success: false,
        message: '电影ID和标题不能为空'
      });
    }

    const existing = await get('SELECT * FROM subscriptions WHERE user_id = ? AND content_id = ?', [userId, movie_id]);
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: '已经订阅过该影片'
      });
    }

    await run(
      'INSERT INTO subscriptions (user_id, content_id, content_type, content_title, content_poster) VALUES (?, ?, ?, ?, ?)',
      [userId, movie_id, 'movie', movie_title, movie_poster || '']
    );

    res.json({
      success: true,
      message: '订阅成功'
    });
  } catch (error) {
    console.error('订阅电影错误:', error);
    res.status(500).json({
      success: false,
      message: '订阅失败'
    });
  }
});

router.delete('/subscribe/:movieId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const movieId = parseInt(req.params.movieId);

    await run('DELETE FROM subscriptions WHERE user_id = ? AND content_id = ? AND content_type = ?', [userId, movieId, 'movie']);

    res.json({
      success: true,
      message: '取消订阅成功'
    });
  } catch (error) {
    console.error('取消订阅错误:', error);
    res.status(500).json({
      success: false,
      message: '取消订阅失败'
    });
  }
});

module.exports = router;
