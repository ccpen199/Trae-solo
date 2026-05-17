const express = require('express');
const { allAsync, getAsync, runAsync } = require('../utils/db');
const { success, error, pagination } = require('../utils/response');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/recommend', optionalAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    const songs = await allAsync(`
      SELECT s.*, a.name as artist_name, al.name as album_name
      FROM songs s
      LEFT JOIN artists a ON s.artist_id = a.id
      LEFT JOIN albums al ON s.album_id = al.id
      ORDER BY s.play_count DESC, s.id DESC
      LIMIT ? OFFSET ?
    `, [parseInt(pageSize), offset]);

    const totalResult = await getAsync('SELECT COUNT(*) as count FROM songs');
    
    let list = songs;
    if (req.user?.id) {
      const likes = await allAsync('SELECT song_id FROM user_likes WHERE user_id = ?', [req.user.id]);
      const likeSet = new Set(likes.map(l => l.song_id));
      list = songs.map(s => ({ ...s, is_liked: likeSet.has(s.id) }));
    }

    res.json(success(pagination(list, totalResult.count, page, pageSize)));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('获取推荐歌曲失败'));
  }
});

router.get('/detail/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const song = await getAsync(`
      SELECT s.*, a.name as artist_name, a.avatar as artist_avatar, al.name as album_name, al.cover as album_cover
      FROM songs s
      LEFT JOIN artists a ON s.artist_id = a.id
      LEFT JOIN albums al ON s.album_id = al.id
      WHERE s.id = ?
    `, [id]);

    if (!song) {
      return res.status(404).json(error('歌曲不存在'));
    }

    await runAsync('UPDATE songs SET play_count = play_count + 1 WHERE id = ?', [id]);

    if (req.user?.id) {
      const like = await getAsync('SELECT id FROM user_likes WHERE user_id = ? AND song_id = ?', [req.user.id, id]);
      song.is_liked = !!like;
    }

    res.json(success(song));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('获取歌曲详情失败'));
  }
});

router.get('/hot', async (req, res) => {
  try {
    const songs = await allAsync(`
      SELECT s.*, a.name as artist_name
      FROM songs s
      LEFT JOIN artists a ON s.artist_id = a.id
      ORDER BY s.play_count DESC
      LIMIT 50
    `);
    res.json(success(songs));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('获取热门歌曲失败'));
  }
});

router.post('/like/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const song = await getAsync('SELECT id FROM songs WHERE id = ?', [id]);
    if (!song) {
      return res.status(404).json(error('歌曲不存在'));
    }

    const existingLike = await getAsync('SELECT id FROM user_likes WHERE user_id = ? AND song_id = ?', [userId, id]);
    
    if (existingLike) {
      await runAsync('DELETE FROM user_likes WHERE user_id = ? AND song_id = ?', [userId, id]);
      await runAsync('UPDATE songs SET like_count = MAX(0, like_count - 1) WHERE id = ?', [id]);
      res.json(success({ is_liked: false }, '取消收藏成功'));
    } else {
      await runAsync('INSERT INTO user_likes (user_id, song_id) VALUES (?, ?)', [userId, id]);
      await runAsync('UPDATE songs SET like_count = like_count + 1 WHERE id = ?', [id]);
      res.json(success({ is_liked: true }, '收藏成功'));
    }
  } catch (err) {
    console.error(err);
    res.status(500).json(error('操作失败'));
  }
});

router.get('/my-likes', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;
    const userId = req.user.id;

    const songs = await allAsync(`
      SELECT s.*, a.name as artist_name, ul.created_at as liked_at
      FROM user_likes ul
      LEFT JOIN songs s ON ul.song_id = s.id
      LEFT JOIN artists a ON s.artist_id = a.id
      WHERE ul.user_id = ?
      ORDER BY ul.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, parseInt(pageSize), offset]);

    const totalResult = await getAsync('SELECT COUNT(*) as count FROM user_likes WHERE user_id = ?', [userId]);

    res.json(success(pagination(songs.map(s => ({ ...s, is_liked: true })), totalResult.count, page, pageSize)));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('获取收藏列表失败'));
  }
});

router.post('/download/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const song = await getAsync('SELECT * FROM songs WHERE id = ?', [id]);
    if (!song) {
      return res.status(404).json(error('歌曲不存在'));
    }

    if (!song.is_free && !req.user.is_vip) {
      return res.status(403).json(error('该歌曲需要VIP才能下载'));
    }

    const existingDownload = await getAsync('SELECT id FROM user_downloads WHERE user_id = ? AND song_id = ?', [userId, id]);
    
    if (!existingDownload) {
      await runAsync('INSERT INTO user_downloads (user_id, song_id) VALUES (?, ?)', [userId, id]);
      await runAsync('UPDATE songs SET download_count = download_count + 1 WHERE id = ?', [id]);
    }

    res.json(success({ download_url: song.url }, '可以下载'));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('操作失败'));
  }
});

module.exports = router;