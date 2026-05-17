const express = require('express');
const { query, queryOne, run } = require('../database');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/categories', async (req, res) => {
  try {
    const categories = await query('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order');
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取分类失败'
    });
  }
});

router.get('/banners', async (req, res) => {
  try {
    const { position = 'home' } = req.query;
    const banners = await query('SELECT * FROM banners WHERE is_active = 1 AND position = ? ORDER BY sort_order', [position]);
    res.json({
      success: true,
      data: banners
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取轮播图失败'
    });
  }
});

router.get('/albums', optionalAuthMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, category, sort = 'hot', keyword } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE a.is_published = 1';
    const params = [];

    if (category) {
      whereClause += ' AND a.category_id = ?';
      params.push(category);
    }

    if (keyword) {
      whereClause += ' AND (a.title LIKE ? OR a.description LIKE ? OR a.author_name LIKE ?)';
      const searchTerm = `%${keyword}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    let orderBy = 'ORDER BY a.play_count DESC';
    if (sort === 'new') {
      orderBy = 'ORDER BY a.created_at DESC';
    } else if (sort === 'favorite') {
      orderBy = 'ORDER BY a.favorite_count DESC';
    }

    const albums = await query(`
      SELECT a.*, c.name as category_name
      FROM albums a
      LEFT JOIN categories c ON a.category_id = c.id
      ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const totalResult = await queryOne(`
      SELECT COUNT(*) as total FROM albums a ${whereClause}
    `, params);

    let userFavorites = [];
    if (req.user) {
      userFavorites = await query('SELECT album_id FROM user_favorites WHERE user_id = ?', [req.user.id]);
    }
    const favoriteIds = userFavorites.map(f => f.album_id);

    const albumsWithFavorite = albums.map(album => ({
      ...album,
      is_favorited: favoriteIds.includes(album.id)
    }));

    res.json({
      success: true,
      data: {
        list: albumsWithFavorite,
        total: totalResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取专辑列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取专辑列表失败'
    });
  }
});

router.get('/albums/recommend', optionalAuthMiddleware, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const albums = await query(`
      SELECT a.*, c.name as category_name
      FROM albums a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.is_published = 1 AND a.is_recommend = 1
      ORDER BY a.play_count DESC
      LIMIT ?
    `, [parseInt(limit)]);

    res.json({
      success: true,
      data: albums
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取推荐专辑失败'
    });
  }
});

router.get('/albums/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const album = await queryOne(`
      SELECT a.*, c.name as category_name
      FROM albums a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.id = ?
    `, [req.params.id]);

    if (!album) {
      return res.status(404).json({
        success: false,
        message: '专辑不存在'
      });
    }

    const episodes = await query(`
      SELECT * FROM episodes 
      WHERE album_id = ? AND is_published = 1 
      ORDER BY sort_order, created_at
    `, [req.params.id]);

    let is_favorited = false;
    let is_subscribed = false;
    if (req.user) {
      const favorite = await queryOne('SELECT id FROM user_favorites WHERE user_id = ? AND album_id = ?', [req.user.id, req.params.id]);
      const subscribe = await queryOne('SELECT id FROM user_subscribes WHERE user_id = ? AND album_id = ?', [req.user.id, req.params.id]);
      is_favorited = !!favorite;
      is_subscribed = !!subscribe;
    }

    res.json({
      success: true,
      data: {
        ...album,
        episodes,
        is_favorited,
        is_subscribed
      }
    });
  } catch (error) {
    console.error('获取专辑详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取专辑详情失败'
    });
  }
});

router.get('/episodes/:id', async (req, res) => {
  try {
    const episode = await queryOne(`
      SELECT e.*, a.title as album_title, a.cover as album_cover, a.author_name
      FROM episodes e
      LEFT JOIN albums a ON e.album_id = a.id
      WHERE e.id = ?
    `, [req.params.id]);

    if (!episode) {
      return res.status(404).json({
        success: false,
        message: '剧集不存在'
      });
    }

    await run('UPDATE episodes SET play_count = play_count + 1 WHERE id = ?', [req.params.id]);
    await run('UPDATE albums SET play_count = play_count + 1 WHERE id = ?', [episode.album_id]);

    res.json({
      success: true,
      data: episode
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取剧集失败'
    });
  }
});

router.post('/albums/:id/favorite', authMiddleware, async (req, res) => {
  try {
    const albumId = req.params.id;
    const userId = req.user.id;

    const existing = await queryOne('SELECT id FROM user_favorites WHERE user_id = ? AND album_id = ?', [userId, albumId]);
    
    if (existing) {
      await run('DELETE FROM user_favorites WHERE id = ?', [existing.id]);
      await run('UPDATE albums SET favorite_count = favorite_count - 1 WHERE id = ?', [albumId]);
      res.json({
        success: true,
        message: '取消收藏成功',
        data: { is_favorited: false }
      });
    } else {
      await run('INSERT INTO user_favorites (user_id, album_id) VALUES (?, ?)', [userId, albumId]);
      await run('UPDATE albums SET favorite_count = favorite_count + 1 WHERE id = ?', [albumId]);
      res.json({
        success: true,
        message: '收藏成功',
        data: { is_favorited: true }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
});

router.post('/albums/:id/subscribe', authMiddleware, async (req, res) => {
  try {
    const albumId = req.params.id;
    const userId = req.user.id;

    const existing = await queryOne('SELECT id FROM user_subscribes WHERE user_id = ? AND album_id = ?', [userId, albumId]);
    
    if (existing) {
      await run('DELETE FROM user_subscribes WHERE id = ?', [existing.id]);
      await run('UPDATE albums SET subscribe_count = subscribe_count - 1 WHERE id = ?', [albumId]);
      res.json({
        success: true,
        message: '取消追剧成功',
        data: { is_subscribed: false }
      });
    } else {
      await run('INSERT INTO user_subscribes (user_id, album_id) VALUES (?, ?)', [userId, albumId]);
      await run('UPDATE albums SET subscribe_count = subscribe_count + 1 WHERE id = ?', [albumId]);
      res.json({
        success: true,
        message: '追剧成功',
        data: { is_subscribed: true }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
});

router.get('/albums/:id/comments', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const comments = await query(`
      SELECT c.*, u.nickname, u.avatar, u.level
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.album_id = ? AND c.is_deleted = 0
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [req.params.id, parseInt(limit), offset]);

    const totalResult = await queryOne('SELECT COUNT(*) as total FROM comments WHERE album_id = ? AND is_deleted = 0', [req.params.id]);

    res.json({
      success: true,
      data: {
        list: comments,
        total: totalResult.total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取评论失败'
    });
  }
});

router.post('/albums/:id/comments', authMiddleware, async (req, res) => {
  try {
    const { content, reply_to } = req.body;
    const albumId = req.params.id;

    if (!content?.trim()) {
      return res.status(400).json({
        success: false,
        message: '评论内容不能为空'
      });
    }

    const result = await run(
      'INSERT INTO comments (user_id, album_id, content, reply_to) VALUES (?, ?, ?, ?)',
      [req.user.id, albumId, content.trim(), reply_to || null]
    );

    await run('UPDATE albums SET comment_count = comment_count + 1 WHERE id = ?', [albumId]);

    const comment = await queryOne(`
      SELECT c.*, u.nickname, u.avatar, u.level
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [result.lastID]);

    res.json({
      success: true,
      message: '评论成功',
      data: comment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '评论失败'
    });
  }
});

router.post('/comments/:id/like', authMiddleware, async (req, res) => {
  try {
    await run('UPDATE comments SET like_count = like_count + 1 WHERE id = ?', [req.params.id]);
    res.json({
      success: true,
      message: '点赞成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '点赞失败'
    });
  }
});

router.get('/episodes/:id/danmus', async (req, res) => {
  try {
    const danmus = await query(`
      SELECT d.*, u.nickname
      FROM danmus d
      LEFT JOIN users u ON d.user_id = u.id
      WHERE d.episode_id = ?
      ORDER BY d.time
    `, [req.params.id]);

    res.json({
      success: true,
      data: danmus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取弹幕失败'
    });
  }
});

router.post('/episodes/:id/danmus', authMiddleware, async (req, res) => {
  try {
    const { content, time, color, style } = req.body;

    if (!content?.trim() || time === undefined) {
      return res.status(400).json({
        success: false,
        message: '弹幕内容和时间不能为空'
      });
    }

    await run(
      'INSERT INTO danmus (user_id, episode_id, content, time, color, style) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, req.params.id, content.trim(), time, color || '#ffffff', style || 'scroll']
    );

    res.json({
      success: true,
      message: '发送弹幕成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '发送弹幕失败'
    });
  }
});

module.exports = router;
