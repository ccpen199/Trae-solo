const express = require('express');
const { db } = require('../database/init');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  try {
    const { page = 1, limit = 20, tag, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, u.nickname, u.avatar 
      FROM posts p 
      JOIN users u ON p.user_id = u.id 
      WHERE 1=1
    `;
    let params = [];

    if (tag) {
      query += ' AND p.tags LIKE ?';
      params.push(`%${tag}%`);
    }

    if (search) {
      query += ' AND p.content LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const posts = db.prepare(query).all(...params);

    const postsWithStatus = posts.map(post => {
      const isLiked = db.prepare('SELECT id FROM likes WHERE post_id = ? AND user_id = ?').get(post.id, req.user.id);
      const isFavorited = db.prepare('SELECT id FROM favorites WHERE post_id = ? AND user_id = ?').get(post.id, req.user.id);
      return {
        ...post,
        is_liked: !!isLiked,
        is_favorited: !!isFavorited,
        images: post.images ? JSON.parse(post.images) : [],
        tags: post.tags ? JSON.parse(post.tags) : []
      };
    });

    let countQuery = 'SELECT COUNT(*) as total FROM posts WHERE 1=1';
    let countParams = [];

    if (tag) {
      countQuery += ' AND tags LIKE ?';
      countParams.push(`%${tag}%`);
    }

    if (search) {
      countQuery += ' AND content LIKE ?';
      countParams.push(`%${search}%`);
    }

    const { total } = db.prepare(countQuery).get(...countParams);

    res.json({ success: true, data: { posts: postsWithStatus, total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const post = db.prepare(`
      SELECT p.*, u.nickname, u.avatar 
      FROM posts p 
      JOIN users u ON p.user_id = u.id 
      WHERE p.id = ?
    `).get(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: '帖子不存在' });
    }

    const isLiked = db.prepare('SELECT id FROM likes WHERE post_id = ? AND user_id = ?').get(post.id, req.user.id);
    const isFavorited = db.prepare('SELECT id FROM favorites WHERE post_id = ? AND user_id = ?').get(post.id, req.user.id);

    const postWithDetails = {
      ...post,
      is_liked: !!isLiked,
      is_favorited: !!isFavorited,
      images: post.images ? JSON.parse(post.images) : [],
      tags: post.tags ? JSON.parse(post.tags) : []
    };

    db.prepare('INSERT INTO analytics (user_id, event_type, event_data, page) VALUES (?, ?, ?, ?)').run(
      req.user.id,
      'view_post',
      JSON.stringify({ post_id: post.id }),
      'square'
    );

    res.json({ success: true, data: postWithDetails });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/', authMiddleware, (req, res) => {
  try {
    const { content, images = [], tags = [] } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: '请输入内容' });
    }

    const stmt = db.prepare('INSERT INTO posts (user_id, content, images, tags) VALUES (?, ?, ?, ?)');
    const result = stmt.run(req.user.id, content, JSON.stringify(images), JSON.stringify(tags));

    const post = db.prepare(`
      SELECT p.*, u.nickname, u.avatar 
      FROM posts p 
      JOIN users u ON p.user_id = u.id 
      WHERE p.id = ?
    `).get(result.lastInsertRowid);

    db.prepare('INSERT INTO analytics (user_id, event_type, event_data, page) VALUES (?, ?, ?, ?)').run(
      req.user.id,
      'create_post',
      JSON.stringify({ post_id: post.id }),
      'square'
    );

    res.json({ success: true, data: post, message: '发布成功' });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/:id/like', authMiddleware, (req, res) => {
  try {
    const postId = req.params.id;
    const existingLike = db.prepare('SELECT id FROM likes WHERE post_id = ? AND user_id = ?').get(postId, req.user.id);

    if (existingLike) {
      db.prepare('DELETE FROM likes WHERE post_id = ? AND user_id = ?').run(postId, req.user.id);
      db.prepare('UPDATE posts SET likes_count = likes_count - 1 WHERE id = ?').run(postId);
      res.json({ success: true, data: { liked: false }, message: '取消点赞' });
    } else {
      db.prepare('INSERT INTO likes (post_id, user_id) VALUES (?, ?)').run(postId, req.user.id);
      db.prepare('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?').run(postId);

      db.prepare('INSERT INTO analytics (user_id, event_type, event_data, page) VALUES (?, ?, ?, ?)').run(
        req.user.id,
        'like_post',
        JSON.stringify({ post_id: postId }),
        'square'
      );

      res.json({ success: true, data: { liked: true }, message: '点赞成功' });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/:id/favorite', authMiddleware, (req, res) => {
  try {
    const postId = req.params.id;
    const existingFavorite = db.prepare('SELECT id FROM favorites WHERE post_id = ? AND user_id = ?').get(postId, req.user.id);

    if (existingFavorite) {
      db.prepare('DELETE FROM favorites WHERE post_id = ? AND user_id = ?').run(postId, req.user.id);
      res.json({ success: true, data: { favorited: false }, message: '取消收藏' });
    } else {
      db.prepare('INSERT INTO favorites (post_id, user_id) VALUES (?, ?)').run(postId, req.user.id);

      db.prepare('INSERT INTO analytics (user_id, event_type, event_data, page) VALUES (?, ?, ?, ?)').run(
        req.user.id,
        'favorite_post',
        JSON.stringify({ post_id: postId }),
        'square'
      );

      res.json({ success: true, data: { favorited: true }, message: '收藏成功' });
    }
  } catch (error) {
    console.error('Favorite post error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
