const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;

    let query = 'SELECT * FROM sleep_music WHERE is_active = 1';
    let params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY play_count DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const musicList = await db.all(query, params);

    const countResult = await db.get(
      'SELECT COUNT(*) as total FROM sleep_music WHERE is_active = 1'
    );

    res.json({
      success: true,
      data: {
        musicList,
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      },
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取音乐列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = await db.all(`
      SELECT DISTINCT category as name, COUNT(*) as count
      FROM sleep_music
      WHERE is_active = 1
      GROUP BY category
    `);

    res.json({
      success: true,
      data: { categories },
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取音乐分类错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.post('/:id/play', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await db.run(
      'UPDATE sleep_music SET play_count = play_count + 1 WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: '播放记录已更新'
    });
  } catch (error) {
    console.error('更新播放次数错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

module.exports = router;
