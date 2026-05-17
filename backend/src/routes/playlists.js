const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { success, error } = require('../utils/response');
const { auth } = require('../middleware/auth');

router.get('/my', auth, async (req, res) => {
  try {
    const user_id = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    const playlists = await db.allAsync(
      `SELECT p.*, 
              (SELECT COUNT(*) FROM playlist_songs WHERE playlist_id = p.id) as song_count
       FROM playlists p 
       WHERE p.user_id = ? 
       ORDER BY p.created_at DESC 
       LIMIT ? OFFSET ?`,
      [user_id, pageSize, offset]
    );

    const totalResult = await db.getAsync(
      'SELECT COUNT(*) as count FROM playlists WHERE user_id = ?',
      [user_id]
    );

    res.json(success({
      list: playlists,
      total: totalResult.count,
      page,
      pageSize,
      totalPages: Math.ceil(totalResult.count / pageSize)
    }));
  } catch (err) {
    console.error('获取歌单列表失败:', err);
    res.json(error('获取歌单列表失败'));
  }
});

router.get('/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const playlist = await db.getAsync(
      `SELECT p.*, 
              u.nickname as user_name,
              u.avatar as user_avatar,
              (SELECT COUNT(*) FROM playlist_songs WHERE playlist_id = p.id) as song_count
       FROM playlists p 
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [id]
    );

    if (!playlist) {
      return res.json(error('歌单不存在'));
    }

    const songs = await db.allAsync(
      `SELECT s.*, a.name as artist_name 
       FROM playlist_songs ps 
       LEFT JOIN songs s ON ps.song_id = s.id 
       LEFT JOIN artists a ON s.artist_id = a.id 
       WHERE ps.playlist_id = ? 
       ORDER BY ps.added_at DESC`,
      [id]
    );

    res.json(success({ ...playlist, songs }));
  } catch (err) {
    console.error('获取歌单详情失败:', err);
    res.json(error('获取歌单详情失败'));
  }
});

router.post('/create', auth, async (req, res) => {
  try {
    const { name, description, is_public = 1 } = req.body;
    const user_id = req.user.id;

    if (!name || name.trim().length === 0) {
      return res.json(error('歌单名称不能为空'));
    }

    const cover = `https://picsum.photos/seed/playlist${Date.now()}/200`;
    
    const result = await db.runAsync(
      'INSERT INTO playlists (name, cover, description, user_id, is_public) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), cover, description || '', user_id, is_public ? 1 : 0]
    );

    const playlist = await db.getAsync(
      `SELECT p.*, 
              (SELECT COUNT(*) FROM playlist_songs WHERE playlist_id = p.id) as song_count
       FROM playlists p WHERE p.id = ?`,
      [result.lastID]
    );

    res.json(success(playlist, '歌单创建成功'));
  } catch (err) {
    console.error('创建歌单失败:', err);
    res.json(error('创建歌单失败'));
  }
});

router.post('/add-song/:playlistId/:songId', auth, async (req, res) => {
  try {
    const { playlistId, songId } = req.params;
    const user_id = req.user.id;

    const playlist = await db.getAsync(
      'SELECT * FROM playlists WHERE id = ? AND user_id = ?',
      [playlistId, user_id]
    );

    if (!playlist) {
      return res.json(error('歌单不存在或无权限操作'));
    }

    const song = await db.getAsync('SELECT * FROM songs WHERE id = ?', [songId]);
    if (!song) {
      return res.json(error('歌曲不存在'));
    }

    try {
      await db.runAsync(
        'INSERT INTO playlist_songs (playlist_id, song_id) VALUES (?, ?)',
        [playlistId, songId]
      );
    } catch (e) {
      return res.json(error('歌曲已在歌单中'));
    }

    res.json(success(null, '已添加到歌单'));
  } catch (err) {
    console.error('添加歌曲到歌单失败:', err);
    res.json(error('添加歌曲到歌单失败'));
  }
});

router.post('/remove-song/:playlistId/:songId', auth, async (req, res) => {
  try {
    const { playlistId, songId } = req.params;
    const user_id = req.user.id;

    const playlist = await db.getAsync(
      'SELECT * FROM playlists WHERE id = ? AND user_id = ?',
      [playlistId, user_id]
    );

    if (!playlist) {
      return res.json(error('歌单不存在或无权限操作'));
    }

    await db.runAsync(
      'DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?',
      [playlistId, songId]
    );

    res.json(success(null, '已从歌单移除'));
  } catch (err) {
    console.error('从歌单移除歌曲失败:', err);
    res.json(error('从歌单移除歌曲失败'));
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const playlist = await db.getAsync(
      'SELECT * FROM playlists WHERE id = ? AND user_id = ?',
      [id, user_id]
    );

    if (!playlist) {
      return res.json(error('歌单不存在或无权限操作'));
    }

    await db.runAsync('DELETE FROM playlists WHERE id = ?', [id]);

    res.json(success(null, '歌单已删除'));
  } catch (err) {
    console.error('删除歌单失败:', err);
    res.json(error('删除歌单失败'));
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_public } = req.body;
    const user_id = req.user.id;

    const playlist = await db.getAsync(
      'SELECT * FROM playlists WHERE id = ? AND user_id = ?',
      [id, user_id]
    );

    if (!playlist) {
      return res.json(error('歌单不存在或无权限操作'));
    }

    const updates = [];
    const params = [];

    if (name !== undefined) {
      if (!name.trim()) {
        return res.json(error('歌单名称不能为空'));
      }
      updates.push('name = ?');
      params.push(name.trim());
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (is_public !== undefined) {
      updates.push('is_public = ?');
      params.push(is_public ? 1 : 0);
    }

    if (updates.length > 0) {
      params.push(id);
      await db.runAsync(
        `UPDATE playlists SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    const updatedPlaylist = await db.getAsync(
      `SELECT p.*, 
              (SELECT COUNT(*) FROM playlist_songs WHERE playlist_id = p.id) as song_count
       FROM playlists p WHERE p.id = ?`,
      [id]
    );

    res.json(success(updatedPlaylist, '歌单已更新'));
  } catch (err) {
    console.error('更新歌单失败:', err);
    res.json(error('更新歌单失败'));
  }
});

module.exports = router;
