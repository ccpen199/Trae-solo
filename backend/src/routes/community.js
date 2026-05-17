const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/channels', (req, res) => {
  try {
    const channels = db.prepare(`
      SELECT * FROM channels ORDER BY sort_order, id
    `).all();

    res.json({ success: true, data: channels });
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({ success: false, message: '获取频道失败' });
  }
});

router.get('/my-channels', authenticateToken, (req, res) => {
  try {
    const myChannels = db.prepare(`
      SELECT c.*, uc.sort_order as user_sort_order
      FROM channels c
      INNER JOIN user_channels uc ON c.id = uc.channel_id
      WHERE uc.user_id = ?
      ORDER BY uc.sort_order, c.id
    `).all(req.user.userId);

    const allChannels = db.prepare('SELECT * FROM channels ORDER BY sort_order').all();
    const myChannelIds = new Set(myChannels.map(c => c.id));

    const availableChannels = allChannels.filter(c => !myChannelIds.has(c.id));

    res.json({
      success: true,
      data: {
        myChannels,
        availableChannels
      }
    });
  } catch (error) {
    console.error('Get my channels error:', error);
    res.status(500).json({ success: false, message: '获取我的频道失败' });
  }
});

router.post('/channels/:channelId/join', authenticateToken, (req, res) => {
  try {
    const { channelId } = req.params;

    const channel = db.prepare('SELECT id FROM channels WHERE id = ?').get(channelId);
    if (!channel) {
      return res.status(404).json({ success: false, message: '频道不存在' });
    }

    try {
      db.prepare(`
        INSERT INTO user_channels (user_id, channel_id, sort_order)
        VALUES (?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM user_channels WHERE user_id = ?)
      `).run(req.user.userId, channelId, req.user.userId);

      res.json({ success: true, message: '加入频道成功' });
    } catch (e) {
      res.json({ success: true, message: '已在频道中' });
    }
  } catch (error) {
    console.error('Join channel error:', error);
    res.status(500).json({ success: false, message: '加入频道失败' });
  }
});

router.post('/channels/sort', authenticateToken, (req, res) => {
  try {
    const { channelIds } = req.body;

    channelIds.forEach((channelId, index) => {
      db.prepare(`
        UPDATE user_channels SET sort_order = ?
        WHERE user_id = ? AND channel_id = ?
      `).run(index + 1, req.user.userId, channelId);
    });

    res.json({ success: true, message: '排序更新成功' });
  } catch (error) {
    console.error('Sort channels error:', error);
    res.status(500).json({ success: false, message: '排序失败' });
  }
});

router.get('/posts', (req, res) => {
  try {
    const { channelId, limit = 20, offset = 0, type = 'latest' } = req.query;

    let query = `
      SELECT p.*, u.username, u.avatar, c.name as channel_name
      FROM posts p
      INNER JOIN users u ON p.user_id = u.id
      INNER JOIN channels c ON p.channel_id = c.id
    `;
    let params = [];

    if (channelId) {
      query += ' WHERE p.channel_id = ?';
      params.push(channelId);
    }

    if (type === 'hot') {
      query += ' ORDER BY (p.like_count + p.comment_count * 2) DESC';
    } else {
      query += ' ORDER BY p.created_at DESC';
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const posts = db.prepare(query).all(...params);

    posts.forEach(post => {
      post.images = post.images ? post.images.split(',') : [];
    });

    res.json({ success: true, data: posts });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ success: false, message: '获取帖子失败' });
  }
});

router.get('/following/posts', authenticateToken, (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const posts = db.prepare(`
      SELECT p.*, u.username, u.avatar, c.name as channel_name
      FROM posts p
      INNER JOIN users u ON p.user_id = u.id
      INNER JOIN channels c ON p.channel_id = c.id
      INNER JOIN follows f ON p.user_id = f.following_id
      WHERE f.follower_id = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user.userId, parseInt(limit), parseInt(offset));

    posts.forEach(post => {
      post.images = post.images ? post.images.split(',') : [];
    });

    res.json({ success: true, data: posts });
  } catch (error) {
    console.error('Get following posts error:', error);
    res.status(500).json({ success: false, message: '获取关注帖子失败' });
  }
});

router.get('/posts/:id', (req, res) => {
  try {
    const { id } = req.params;

    const post = db.prepare(`
      SELECT p.*, u.username, u.avatar, c.name as channel_name
      FROM posts p
      INNER JOIN users u ON p.user_id = u.id
      INNER JOIN channels c ON p.channel_id = c.id
      WHERE p.id = ?
    `).get(id);

    if (!post) {
      return res.status(404).json({ success: false, message: '帖子不存在' });
    }

    post.images = post.images ? post.images.split(',') : [];

    res.json({ success: true, data: post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ success: false, message: '获取帖子详情失败' });
  }
});

router.post('/posts', authenticateToken, [
  body('channelId').isInt().notEmpty(),
  body('title').isString().isLength({ min: 1, max: 100 }),
  body('content').isString().isLength({ min: 1 })
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }

    const { channelId, title, content, images = [] } = req.body;

    const channel = db.prepare('SELECT id FROM channels WHERE id = ?').get(channelId);
    if (!channel) {
      return res.status(404).json({ success: false, message: '频道不存在' });
    }

    const postId = db.prepare(`
      INSERT INTO posts (user_id, channel_id, title, content, images)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.userId, channelId, title, content, images.join(',')).lastInsertRowid;

    res.json({ success: true, message: '发布成功', data: { postId } });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ success: false, message: '发布失败' });
  }
});

router.post('/posts/:id/like', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(id);
    if (!post) {
      return res.status(404).json({ success: false, message: '帖子不存在' });
    }

    const existing = db.prepare(`
      SELECT id FROM post_likes WHERE user_id = ? AND post_id = ?
    `).get(req.user.userId, id);

    if (existing) {
      db.prepare('DELETE FROM post_likes WHERE id = ?').run(existing.id);
      db.prepare('UPDATE posts SET like_count = like_count - 1 WHERE id = ?').run(id);
      res.json({ success: true, message: '取消点赞成功', data: { liked: false } });
    } else {
      db.prepare('INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)').run(req.user.userId, id);
      db.prepare('UPDATE posts SET like_count = like_count + 1 WHERE id = ?').run(id);
      res.json({ success: true, message: '点赞成功', data: { liked: true } });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ success: false, message: '点赞失败' });
  }
});

router.get('/posts/:postId/comments', (req, res) => {
  try {
    const { postId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const comments = db.prepare(`
      SELECT c.*, u.username, u.avatar
      FROM comments c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `).all(postId, parseInt(limit), parseInt(offset));

    res.json({ success: true, data: comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ success: false, message: '获取评论失败' });
  }
});

router.post('/posts/:postId/comments', authenticateToken, [
  body('content').isString().isLength({ min: 1, max: 500 })
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }

    const { postId } = req.params;
    const { content } = req.body;

    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: '帖子不存在' });
    }

    db.prepare(`
      INSERT INTO comments (user_id, post_id, content)
      VALUES (?, ?, ?)
    `).run(req.user.userId, postId, content);

    db.prepare('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?').run(postId);

    res.json({ success: true, message: '评论成功' });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ success: false, message: '评论失败' });
  }
});

router.post('/posts/:id/reward', authenticateToken, [
  body('amount').isInt({ min: 1 }),
  body('message').optional().isString()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }

    const { id } = req.params;
    const { amount, message } = req.body;

    const post = db.prepare('SELECT id, user_id FROM posts WHERE id = ?').get(id);
    if (!post) {
      return res.status(404).json({ success: false, message: '帖子不存在' });
    }

    if (post.user_id === req.user.userId) {
      return res.status(400).json({ success: false, message: '不能打赏自己的帖子' });
    }

    db.prepare(`
      INSERT INTO rewards (user_id, post_id, amount, message)
      VALUES (?, ?, ?, ?)
    `).run(req.user.userId, id, amount, message || '');

    db.prepare('UPDATE posts SET reward_count = reward_count + 1 WHERE id = ?').run(id);

    res.json({ success: true, message: '打赏成功' });
  } catch (error) {
    console.error('Reward post error:', error);
    res.status(500).json({ success: false, message: '打赏失败' });
  }
});

module.exports = router;
