const express = require('express');
const { allAsync, getAsync, runAsync } = require('../utils/db');
const { success, error, pagination } = require('../utils/response');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/hot-keywords', async (req, res) => {
  try {
    const keywords = await allAsync(`
      SELECT * FROM hot_keywords
      ORDER BY is_hot DESC, search_count DESC
      LIMIT 20
    `);
    res.json(success(keywords));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('获取热门搜索失败'));
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const history = await allAsync(`
      SELECT * FROM search_history
      WHERE user_id = ?
      ORDER BY last_searched_at DESC
      LIMIT 20
    `, [req.user.id]);
    res.json(success(history));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('获取搜索历史失败'));
  }
});

router.delete('/history', authMiddleware, async (req, res) => {
  try {
    await runAsync('DELETE FROM search_history WHERE user_id = ?', [req.user.id]);
    res.json(success(null, '清空搜索历史成功'));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('清空失败'));
  }
});

router.get('/suggest', async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword) {
      return res.json(success([]));
    }

    const songs = await allAsync(`
      SELECT s.id, s.name, a.name as artist_name, 'song' as type
      FROM songs s
      LEFT JOIN artists a ON s.artist_id = a.id
      WHERE s.name LIKE ?
      LIMIT 5
    `, [`%${keyword}%`]);

    const artists = await allAsync(`
      SELECT id, name, 'artist' as type
      FROM artists
      WHERE name LIKE ?
      LIMIT 3
    `, [`%${keyword}%`]);

    const albums = await allAsync(`
      SELECT id, name, 'album' as type
      FROM albums
      WHERE name LIKE ?
      LIMIT 2
    `, [`%${keyword}%`]);

    res.json(success([...songs, ...artists, ...albums]));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('获取搜索建议失败'));
  }
});

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { keyword, type = 'song', page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    if (!keyword) {
      return res.status(400).json(error('请输入搜索关键词'));
    }

    if (req.user?.id) {
      const existingHistory = await getAsync(
        'SELECT id FROM search_history WHERE user_id = ? AND keyword = ?',
        [req.user.id, keyword]
      );
      
      if (existingHistory) {
        await runAsync(
          'UPDATE search_history SET search_count = search_count + 1, last_searched_at = CURRENT_TIMESTAMP WHERE id = ?',
          [existingHistory.id]
        );
      } else {
        await runAsync(
          'INSERT INTO search_history (user_id, keyword) VALUES (?, ?)',
          [req.user.id, keyword]
        );
      }
    }

    const hotKeyword = await getAsync('SELECT id FROM hot_keywords WHERE keyword = ?', [keyword]);
    if (hotKeyword) {
      await runAsync('UPDATE hot_keywords SET search_count = search_count + 1 WHERE id = ?', [hotKeyword.id]);
    }

    let result;
    let total;

    switch (type) {
      case 'song':
        result = await allAsync(`
          SELECT s.*, a.name as artist_name, al.name as album_name
          FROM songs s
          LEFT JOIN artists a ON s.artist_id = a.id
          LEFT JOIN albums al ON s.album_id = al.id
          WHERE s.name LIKE ? OR a.name LIKE ?
          ORDER BY s.play_count DESC
          LIMIT ? OFFSET ?
        `, [`%${keyword}%`, `%${keyword}%`, parseInt(pageSize), offset]);
        
        const totalResult = await getAsync(`
          SELECT COUNT(*) as count
          FROM songs s
          LEFT JOIN artists a ON s.artist_id = a.id
          WHERE s.name LIKE ? OR a.name LIKE ?
        `, [`%${keyword}%`, `%${keyword}%`]);
        total = totalResult.count;
        break;

      case 'artist':
        result = await allAsync(`
          SELECT * FROM artists
          WHERE name LIKE ?
          ORDER BY followers DESC
          LIMIT ? OFFSET ?
        `, [`%${keyword}%`, parseInt(pageSize), offset]);
        
        const artistTotal = await getAsync('SELECT COUNT(*) as count FROM artists WHERE name LIKE ?', [`%${keyword}%`]);
        total = artistTotal.count;
        break;

      case 'album':
        result = await allAsync(`
          SELECT al.*, a.name as artist_name
          FROM albums al
          LEFT JOIN artists a ON al.artist_id = a.id
          WHERE al.name LIKE ? OR a.name LIKE ?
          ORDER BY al.play_count DESC
          LIMIT ? OFFSET ?
        `, [`%${keyword}%`, `%${keyword}%`, parseInt(pageSize), offset]);
        
        const albumTotal = await getAsync(`
          SELECT COUNT(*) as count
          FROM albums al
          LEFT JOIN artists a ON al.artist_id = a.id
          WHERE al.name LIKE ? OR a.name LIKE ?
        `, [`%${keyword}%`, `%${keyword}%`]);
        total = albumTotal.count;
        break;

      default:
        result = [];
        total = 0;
    }

    if (type === 'song' && req.user?.id) {
      const likes = await allAsync('SELECT song_id FROM user_likes WHERE user_id = ?', [req.user.id]);
      const likeSet = new Set(likes.map(l => l.song_id));
      result = result.map(item => ({ ...item, is_liked: likeSet.has(item.id) }));
    }

    res.json(success(pagination(result, total, page, pageSize)));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('搜索失败'));
  }
});

module.exports = router;