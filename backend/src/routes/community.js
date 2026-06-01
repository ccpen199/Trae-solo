const express = require('express');
const db = require('../db');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/posts', authMiddleware, (req, res) => {
  const { photo_id, caption, location, tags } = req.body;

  if (!photo_id) {
    return res.status(400).json({ message: '请选择照片' });
  }

  try {
    const result = db.prepare(`INSERT INTO posts (user_id, photo_id, caption, location, tags) VALUES (?, ?, ?, ?, ?)`).run(
      req.user.id, photo_id, caption, location, tags ? JSON.stringify(tags) : null
    );
    res.status(201).json({ message: '发布成功', postId: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ message: '发布失败', error: error.message });
  }
});

router.get('/posts', optionalAuth, (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const posts = db.prepare(`SELECT p.*, u.username, u.nickname, u.avatar, ph.original_url as photo_url
          FROM posts p
          JOIN users u ON p.user_id = u.id
          JOIN photos ph ON p.photo_id = ph.id
          WHERE ph.is_public = 1
          ORDER BY p.created_at DESC
          LIMIT ? OFFSET ?`).all(parseInt(limit), offset);

    const count = db.prepare('SELECT COUNT(*) as total FROM posts p JOIN photos ph ON p.photo_id = ph.id WHERE ph.is_public = 1').get();
    
    posts.forEach(post => {
      if (post.tags) {
        post.tags = JSON.parse(post.tags);
      }
    });

    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count.total
      }
    });
  } catch (error) {
    res.status(500).json({ message: '获取帖子失败', error: error.message });
  }
});

router.get('/posts/:postId', optionalAuth, (req, res) => {
  const { postId } = req.params;

  try {
    const post = db.prepare(`SELECT p.*, u.username, u.nickname, u.avatar, ph.original_url as photo_url, ph.beauty_settings, ph.filter_used
          FROM posts p
          JOIN users u ON p.user_id = u.id
          JOIN photos ph ON p.photo_id = ph.id
          WHERE p.id = ?`).get(postId);

    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }
    if (post.tags) {
      post.tags = JSON.parse(post.tags);
    }
    res.json({ post });
  } catch (error) {
    res.status(500).json({ message: '获取帖子失败', error: error.message });
  }
});

router.post('/posts/:postId/like', authMiddleware, (req, res) => {
  const { postId } = req.params;

  try {
    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    const like = db.prepare('SELECT id FROM likes WHERE user_id = ? AND post_id = ?').get(req.user.id, postId);
    if (like) {
      db.prepare('DELETE FROM likes WHERE id = ?').run(like.id);
      db.prepare('UPDATE posts SET likes_count = likes_count - 1 WHERE id = ?').run(postId);
      res.json({ message: '已取消点赞', liked: false });
    } else {
      db.prepare('INSERT INTO likes (user_id, post_id) VALUES (?, ?)').run(req.user.id, postId);
      db.prepare('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?').run(postId);
      res.json({ message: '点赞成功', liked: true });
    }
  } catch (error) {
    res.status(500).json({ message: '操作失败', error: error.message });
  }
});

router.post('/posts/:postId/comments', authMiddleware, (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: '评论内容不能为空' });
  }

  try {
    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    const result = db.prepare('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)').run(postId, req.user.id, content);
    db.prepare('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?').run(postId);
    res.status(201).json({ message: '评论成功', commentId: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ message: '评论失败', error: error.message });
  }
});

router.get('/posts/:postId/comments', (req, res) => {
  const { postId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const comments = db.prepare(`SELECT c.*, u.username, u.nickname, u.avatar
          FROM comments c
          JOIN users u ON c.user_id = u.id
          WHERE c.post_id = ?
          ORDER BY c.created_at DESC
          LIMIT ? OFFSET ?`).all(postId, parseInt(limit), offset);
    res.json({ comments });
  } catch (error) {
    res.status(500).json({ message: '获取评论失败', error: error.message });
  }
});

router.delete('/posts/:postId', authMiddleware, (req, res) => {
  const { postId } = req.params;

  try {
    const post = db.prepare('SELECT id FROM posts WHERE id = ? AND user_id = ?').get(postId, req.user.id);
    if (!post) {
      return res.status(404).json({ message: '帖子不存在或无权删除' });
    }

    db.prepare('DELETE FROM posts WHERE id = ?').run(postId);
    res.json({ message: '帖子已删除' });
  } catch (error) {
    res.status(500).json({ message: '删除失败', error: error.message });
  }
});

router.post('/follow/:userId', authMiddleware, (req, res) => {
  const { userId } = req.params;

  if (userId == req.user.id) {
    return res.status(400).json({ message: '不能关注自己' });
  }

  try {
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const follow = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.id, userId);
    if (follow) {
      db.prepare('DELETE FROM follows WHERE id = ?').run(follow.id);
      db.prepare('UPDATE users SET following_count = following_count - 1 WHERE id = ?').run(req.user.id);
      db.prepare('UPDATE users SET followers_count = followers_count - 1 WHERE id = ?').run(userId);
      res.json({ message: '已取消关注', following: false });
    } else {
      db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(req.user.id, userId);
      db.prepare('UPDATE users SET following_count = following_count + 1 WHERE id = ?').run(req.user.id);
      db.prepare('UPDATE users SET followers_count = followers_count + 1 WHERE id = ?').run(userId);
      res.json({ message: '关注成功', following: true });
    }
  } catch (error) {
    res.status(500).json({ message: '操作失败', error: error.message });
  }
});

router.get('/user/:userId/posts', optionalAuth, (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const posts = db.prepare(`SELECT p.*, ph.original_url as photo_url
          FROM posts p
          JOIN photos ph ON p.photo_id = ph.id
          WHERE p.user_id = ? AND ph.is_public = 1
          ORDER BY p.created_at DESC
          LIMIT ? OFFSET ?`).all(userId, parseInt(limit), offset);
    res.json({ posts });
  } catch (error) {
    res.status(500).json({ message: '获取用户帖子失败', error: error.message });
  }
});

module.exports = router;