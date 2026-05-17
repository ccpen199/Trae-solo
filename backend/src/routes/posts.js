const express = require('express');
const { body, validationResult } = require('express-validator');
const { runQuery, runGet, runRun } = require('../db');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { type = 'recommend', page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    let posts = [];
    let total = 0;

    if (type === 'following' && req.user) {
      posts = await runQuery(`
        SELECT p.*, u.nickname, u.avatar, u.location as user_location
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `, [req.user.id, parseInt(pageSize), offset]);

      const countResult = await runGet(`
        SELECT COUNT(*) as total FROM posts
        WHERE user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)
      `, [req.user.id]);
      total = countResult.total;
    } else {
      posts = await runQuery(`
        SELECT p.*, u.nickname, u.avatar, u.location as user_location
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `, [parseInt(pageSize), offset]);

      const countResult = await runGet('SELECT COUNT(*) as total FROM posts');
      total = countResult.total;
    }

    if (req.user) {
      for (const post of posts) {
        const liked = await runGet('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?', [post.id, req.user.id]);
        post.is_liked = !!liked;
      }
    }

    res.json({
      success: true,
      data: {
        list: posts,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await runGet(`
      SELECT p.*, u.nickname, u.avatar
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '动态不存在'
      });
    }

    if (req.user) {
      const liked = await runGet('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?', [post.id, req.user.id]);
      post.is_liked = !!liked;
    }

    if (req.user) {
      await runRun('INSERT OR IGNORE INTO browse_history (user_id, target_type, target_id) VALUES (?, ?, ?)', [req.user.id, 'post', post.id]);
    }

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Get post detail error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.post('/', authMiddleware, [
  body('content').notEmpty().withMessage('内容不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { content, media_type, media_url, location } = req.body;

    const result = await runRun(`
      INSERT INTO posts (user_id, content, media_type, media_url, location)
      VALUES (?, ?, ?, ?, ?)
    `, [req.user.id, content, media_type || null, media_url || null, location || null]);

    const post = await runGet('SELECT * FROM posts WHERE id = ?', [result.lastID]);

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const existing = await runGet('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId]);
    
    if (existing) {
      await runRun('DELETE FROM post_likes WHERE id = ?', [existing.id]);
      await runRun('UPDATE posts SET like_count = like_count - 1 WHERE id = ?', [postId]);
      res.json({ success: true, data: { liked: false } });
    } else {
      await runRun('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [postId, userId]);
      await runRun('UPDATE posts SET like_count = like_count + 1 WHERE id = ?', [postId]);
      res.json({ success: true, data: { liked: true } });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.get('/:id/comments', optionalAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    const comments = await runQuery(`
      SELECT c.*, u.nickname, u.avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ? AND c.parent_id IS NULL
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [req.params.id, parseInt(pageSize), offset]);

    const { total } = await runGet('SELECT COUNT(*) as total FROM comments WHERE post_id = ? AND parent_id IS NULL', [req.params.id]);

    res.json({
      success: true,
      data: {
        list: comments,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.post('/:id/comments', authMiddleware, [
  body('content').notEmpty().withMessage('评论内容不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { content, parent_id } = req.body;
    const postId = req.params.id;

    const result = await runRun(`
      INSERT INTO comments (post_id, user_id, content, parent_id)
      VALUES (?, ?, ?, ?)
    `, [postId, req.user.id, content, parent_id || null]);

    await runRun('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?', [postId]);

    const comment = await runGet(`
      SELECT c.*, u.nickname, u.avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [result.lastID]);

    res.json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router;
