const express = require('express');
const router = express.Router();
const { getQuery, runQuery, allQuery } = require('../database');
const { authenticateToken, requireAuth } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, location, sort = 'hot' } = req.query;
    const offset = (page - 1) * limit;

    let orderBy = 'v.like_count DESC, v.view_count DESC';
    if (sort === 'newest') {
      orderBy = 'v.created_at DESC';
    }

    const videos = await allQuery(`
      SELECT v.*, u.nickname, u.avatar as user_avatar,
             CASE WHEN l.id IS NOT NULL THEN 1 ELSE 0 END as is_liked
      FROM videos v
      LEFT JOIN users u ON v.user_id = u.id
      LEFT JOIN likes l ON l.video_id = v.id AND l.user_id = ?
      WHERE v.status = 1
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `, [req.user?.id || null, parseInt(limit), parseInt(offset)]);

    const total = await getQuery('SELECT COUNT(*) as count FROM videos WHERE status = 1');

    res.json({
      success: true,
      data: {
        videos,
        total: total.count,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const video = await getQuery(`
      SELECT v.*, u.nickname, u.avatar as user_avatar, u.follower_count,
             CASE WHEN l.id IS NOT NULL THEN 1 ELSE 0 END as is_liked
      FROM videos v
      LEFT JOIN users u ON v.user_id = u.id
      LEFT JOIN likes l ON l.video_id = v.id AND l.user_id = ?
      WHERE v.id = ?
    `, [req.user?.id || null, req.params.id]);

    if (!video) {
      return res.status(404).json({ success: false, message: '视频不存在' });
    }

    await runQuery('UPDATE videos SET view_count = view_count + 1 WHERE id = ?', [req.params.id]);

    res.json({ success: true, data: video });
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, video_url, cover_url, music, location } = req.body;

    if (!video_url) {
      return res.status(400).json({ success: false, message: '请上传视频' });
    }

    const result = await runQuery(
      'INSERT INTO videos (user_id, title, description, video_url, cover_url, music, location) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, title || '', description || '', video_url, cover_url || '', music || '', location || '']
    );

    res.json({ success: true, data: { id: result.lastID } });
  } catch (error) {
    console.error('Create video error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const videoId = req.params.id;
    const userId = req.user.id;

    const existing = await getQuery('SELECT id FROM likes WHERE video_id = ? AND user_id = ?', [videoId, userId]);

    if (existing) {
      await runQuery('DELETE FROM likes WHERE video_id = ? AND user_id = ?', [videoId, userId]);
      await runQuery('UPDATE videos SET like_count = like_count - 1 WHERE id = ?', [videoId]);
      res.json({ success: true, data: { liked: false } });
    } else {
      try {
        await runQuery('INSERT INTO likes (video_id, user_id) VALUES (?, ?)', [videoId, userId]);
        await runQuery('UPDATE videos SET like_count = like_count + 1 WHERE id = ?', [videoId]);
        res.json({ success: true, data: { liked: true } });
      } catch (e) {
        res.json({ success: true, data: { liked: true } });
      }
    }
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const comments = await allQuery(`
      SELECT c.*, u.nickname, u.avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.video_id = ?
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [req.params.id, parseInt(limit), parseInt(offset)]);

    res.json({ success: true, data: { comments, page: parseInt(page) } });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: '请输入评论内容' });
    }

    const result = await runQuery(
      'INSERT INTO comments (video_id, user_id, content) VALUES (?, ?, ?)',
      [req.params.id, req.user.id, content]
    );

    await runQuery('UPDATE videos SET comment_count = comment_count + 1 WHERE id = ?', [req.params.id]);

    const comment = await getQuery(`
      SELECT c.*, u.nickname, u.avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [result.lastID]);

    res.json({ success: true, data: comment });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
