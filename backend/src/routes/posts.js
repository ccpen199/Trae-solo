const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../models/db');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

const getPostWithUser = (postId, currentUserId = null) => {
  const post = db.prepare(`
    SELECT p.*, 
           u.id as author_id, u.real_name as author_name, u.school as author_school, u.avatar as author_avatar
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    WHERE p.id = ?
  `).get(postId);

  if (!post) return null;

  const isLiked = currentUserId ? 
    !!db.prepare('SELECT 1 FROM likes WHERE post_id = ? AND user_id = ?').get(postId, currentUserId) : false;
  const isFavorited = currentUserId ?
    !!db.prepare('SELECT 1 FROM favorites WHERE post_id = ? AND user_id = ?').get(postId, currentUserId) : false;

  return {
    ...post,
    tags: post.tags ? post.tags.split(',') : [],
    is_liked: isLiked,
    is_favorited: isFavorited
  };
};

router.get('/', optionalAuth, (req, res) => {
  const { keyword = '', search_type = 'all', page = 1, page_size = 20 } = req.query;
  const pageNum = parseInt(page);
  const pageSize = parseInt(page_size);
  const offset = (pageNum - 1) * pageSize;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (keyword) {
    if (search_type === 'topic') {
      whereClause += ' AND p.topic LIKE ?';
      params.push(`%${keyword}%`);
    } else if (search_type === 'tags') {
      whereClause += ' AND p.tags LIKE ?';
      params.push(`%${keyword}%`);
    } else {
      whereClause += ' AND (p.topic LIKE ? OR p.content LIKE ? OR p.tags LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
  }

  const totalResult = db.prepare(`
    SELECT COUNT(*) as total FROM posts p
    ${whereClause}
  `).get(...params);

  const posts = db.prepare(`
    SELECT p.*, u.id as author_id, u.real_name as author_name, u.avatar as author_avatar
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset);

  const formattedPosts = posts.map(post => ({
    ...post,
    tags: post.tags ? post.tags.split(',') : [],
    is_liked: req.user ? !!db.prepare('SELECT 1 FROM likes WHERE post_id = ? AND user_id = ?').get(post.id, req.user.id) : false,
    is_favorited: req.user ? !!db.prepare('SELECT 1 FROM favorites WHERE post_id = ? AND user_id = ?').get(post.id, req.user.id) : false
  }));

  res.json({
    posts: formattedPosts,
    total: totalResult.total,
    page: pageNum,
    page_size: pageSize
  });
});

router.get('/mine', authenticate, (req, res) => {
  const { type = 'posted', page = 1, page_size = 20 } = req.query;
  const pageNum = parseInt(page);
  const pageSize = parseInt(page_size);
  const offset = (pageNum - 1) * pageSize;

  let whereClause;
  const params = [req.user.id];

  if (type === 'posted') {
    whereClause = 'WHERE p.author_id = ?';
  } else if (type === 'liked') {
    whereClause = 'JOIN likes l ON p.id = l.post_id WHERE l.user_id = ?';
  } else if (type === 'favorited') {
    whereClause = 'JOIN favorites f ON p.id = f.post_id WHERE f.user_id = ?';
  } else {
    whereClause = 'WHERE p.author_id = ?';
  }

  const totalResult = db.prepare(`
    SELECT COUNT(*) as total FROM posts p
    ${whereClause}
  `).get(...params);

  const posts = db.prepare(`
    SELECT p.*, u.id as author_id, u.real_name as author_name, u.avatar as author_avatar
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset);

  const formattedPosts = posts.map(post => ({
    ...post,
    tags: post.tags ? post.tags.split(',') : [],
    is_liked: !!db.prepare('SELECT 1 FROM likes WHERE post_id = ? AND user_id = ?').get(post.id, req.user.id),
    is_favorited: !!db.prepare('SELECT 1 FROM favorites WHERE post_id = ? AND user_id = ?').get(post.id, req.user.id)
  }));

  res.json({
    posts: formattedPosts,
    total: totalResult.total,
    page: pageNum,
    page_size: pageSize
  });
});

router.get('/:id', optionalAuth, (req, res) => {
  const { id } = req.params;

  try {
    const post = getPostWithUser(id, req.user?.id);

    if (!post) {
      return res.status(404).json({ error: '帖子不存在' });
    }

    const comments = db.prepare(`
      SELECT c.*, u.id as author_id, u.real_name as author_name, u.avatar as author_avatar
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(id);

    res.json({ post, comments });
  } catch (error) {
    console.error('获取帖子详情失败:', error);
    res.status(500).json({ error: '获取帖子详情失败' });
  }
});

router.post('/', authenticate, [
  body('topic').isLength({ min: 1, max: 50 }).withMessage('帖子话题长度需在1-50字之间'),
  body('content').isLength({ min: 1, max: 2000 }).withMessage('帖子内容长度需在1-2000字之间'),
  body('tags').notEmpty().withMessage('帖子标签不能为空')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { topic, content, tags } = req.body;
  const tagsStr = Array.isArray(tags) ? tags.join(',') : tags;

  try {
    const insertPost = db.prepare(`
      INSERT INTO posts (topic, content, tags, author_id)
      VALUES (?, ?, ?, ?)
    `);

    const result = insertPost.run(topic, content, tagsStr, req.user.id);
    const post = getPostWithUser(result.lastInsertRowid, req.user.id);

    res.status(201).json({ post });
  } catch (error) {
    console.error('发布帖子失败:', error);
    res.status(500).json({ error: '发布帖子失败，请稍后重试' });
  }
});

router.post('/:id/like', authenticate, (req, res) => {
  const { id } = req.params;

  const tx = db.transaction(() => {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);

    if (!post) {
      return res.status(404).json({ error: '帖子不存在' });
    }

    const existingLike = db.prepare('SELECT * FROM likes WHERE post_id = ? AND user_id = ?').get(id, req.user.id);

    if (existingLike) {
      db.prepare('DELETE FROM likes WHERE post_id = ? AND user_id = ?').run(id, req.user.id);
      db.prepare('UPDATE posts SET like_count = like_count - 1 WHERE id = ?').run(id);
    } else {
      db.prepare('INSERT INTO likes (post_id, user_id) VALUES (?, ?)').run(id, req.user.id);
      db.prepare('UPDATE posts SET like_count = like_count + 1 WHERE id = ?').run(id);

      if (post.author_id !== req.user.id) {
        db.prepare(`
          INSERT INTO messages (type, sender_id, receiver_id, post_id, content)
          VALUES ('post_like', ?, ?, ?, ?)
        `).run(req.user.id, post.author_id, id, '赞了你的帖子');
      }
    }

    const updatedPost = getPostWithUser(id, req.user.id);
    res.json({ post: updatedPost });
  });

  try {
    tx();
  } catch (error) {
    console.error('点赞操作失败:', error);
    res.status(500).json({ error: '点赞操作失败' });
  }
});

router.post('/:id/favorite', authenticate, (req, res) => {
  const { id } = req.params;

  try {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);

    if (!post) {
      return res.status(404).json({ error: '帖子不存在' });
    }

    const existingFav = db.prepare('SELECT * FROM favorites WHERE post_id = ? AND user_id = ?').get(id, req.user.id);

    if (existingFav) {
      db.prepare('DELETE FROM favorites WHERE post_id = ? AND user_id = ?').run(id, req.user.id);
    } else {
      db.prepare('INSERT INTO favorites (post_id, user_id) VALUES (?, ?)').run(id, req.user.id);
    }

    const updatedPost = getPostWithUser(id, req.user.id);
    res.json({ post: updatedPost });
  } catch (error) {
    console.error('收藏操作失败:', error);
    res.status(500).json({ error: '收藏操作失败' });
  }
});

router.post('/:id/comments', authenticate, [
  body('content').isLength({ min: 1, max: 500 }).withMessage('评论内容长度需在1-500字之间')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { content, parent_id } = req.body;

  const tx = db.transaction(() => {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);

    if (!post) {
      return res.status(404).json({ error: '帖子不存在' });
    }

    const insertComment = db.prepare(`
      INSERT INTO comments (post_id, content, author_id, parent_id)
      VALUES (?, ?, ?, ?)
    `);

    const result = insertComment.run(id, content, req.user.id, parent_id || null);
    db.prepare('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?').run(id);

    if (post.author_id !== req.user.id) {
      db.prepare(`
        INSERT INTO messages (type, sender_id, receiver_id, post_id, content)
        VALUES ('post_comment', ?, ?, ?, ?)
      `).run(req.user.id, post.author_id, id, '评论了你的帖子');
    }

    const comment = db.prepare(`
      SELECT c.*, u.id as author_id, u.real_name as author_name, u.avatar as author_avatar
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ comment });
  });

  try {
    tx();
  } catch (error) {
    console.error('发表评论失败:', error);
    res.status(500).json({ error: '发表评论失败，请稍后重试' });
  }
});

router.delete('/:id', authenticate, (req, res) => {
  const { id } = req.params;

  try {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);

    if (!post) {
      return res.status(404).json({ error: '帖子不存在' });
    }

    if (post.author_id !== req.user.id) {
      return res.status(403).json({ error: '无权删除此帖子' });
    }

    const tx = db.transaction(() => {
      db.prepare('DELETE FROM comments WHERE post_id = ?').run(id);
      db.prepare('DELETE FROM likes WHERE post_id = ?').run(id);
      db.prepare('DELETE FROM favorites WHERE post_id = ?').run(id);
      db.prepare('DELETE FROM messages WHERE post_id = ?').run(id);
      db.prepare('DELETE FROM posts WHERE id = ?').run(id);
    });

    tx();

    res.json({ message: '帖子已删除' });
  } catch (error) {
    console.error('删除帖子失败:', error);
    res.status(500).json({ error: '删除帖子失败' });
  }
});

router.post('/:id/report', authenticate, (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  res.json({ message: '举报已提交，我们会尽快处理' });
});

module.exports = router;
