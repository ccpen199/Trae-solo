const express = require('express');
const router = express.Router();
const { authenticate, success, error, query, queryOne, execute } = require('../utils');

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const posts = await query('SELECT p.*, u.nickname, u.avatar FROM posts p LEFT JOIN users u ON p.user_id = u.id WHERE p.status = 1 ORDER BY p.created_at DESC LIMIT ? OFFSET ?', [limit, offset]);
    
    const total = await queryOne('SELECT COUNT(*) as count FROM posts WHERE status = 1');
    
    res.json(success({ posts, total: total.count, page, limit }));
  } catch (e) {
    res.json(error('获取失败'));
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await execute('UPDATE posts SET views = views + 1 WHERE id = ?', [id]);
    
    const post = await queryOne('SELECT p.*, u.nickname, u.avatar FROM posts p LEFT JOIN users u ON p.user_id = u.id WHERE p.id = ?', [id]);
    if (!post) return res.json(error('帖子不存在'));
    
    const comments = await query('SELECT pc.*, u.nickname, u.avatar FROM post_comments pc LEFT JOIN users u ON pc.user_id = u.id WHERE pc.post_id = ? ORDER BY pc.created_at DESC', [id]);
    
    res.json(success({ post, comments }));
  } catch (e) {
    res.json(error('获取失败'));
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { title, content, images } = req.body;
    if (!title) return res.json(error('标题不能为空'));
    
    const result = await execute('INSERT INTO posts (user_id, title, content, images) VALUES (?, ?, ?, ?)', [req.userId, title, content, JSON.stringify(images || [])]);
    const post = await queryOne('SELECT p.*, u.nickname, u.avatar FROM posts p LEFT JOIN users u ON p.user_id = u.id WHERE p.id = ?', [result.lastID]);
    
    res.json(success(post, '发布成功'));
  } catch (e) {
    res.json(error('发布失败'));
  }
});

router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await queryOne('SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?', [id, req.userId]);
    if (existing) {
      await execute('DELETE FROM post_likes WHERE id = ?', [existing.id]);
      await execute('UPDATE posts SET likes = likes - 1 WHERE id = ?', [id]);
      res.json(success({ liked: false }, '取消点赞'));
    } else {
      await execute('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [id, req.userId]);
      await execute('UPDATE posts SET likes = likes + 1 WHERE id = ?', [id]);
      res.json(success({ liked: true }, '点赞成功'));
    }
  } catch (e) {
    res.json(error('操作失败'));
  }
});

router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content) return res.json(error('内容不能为空'));
    
    const result = await execute('INSERT INTO post_comments (post_id, user_id, content) VALUES (?, ?, ?)', [id, req.userId, content]);
    await execute('UPDATE posts SET comments = comments + 1 WHERE id = ?', [id]);
    
    const comment = await queryOne('SELECT pc.*, u.nickname, u.avatar FROM post_comments pc LEFT JOIN users u ON pc.user_id = u.id WHERE pc.id = ?', [result.lastID]);
    
    res.json(success(comment, '评论成功'));
  } catch (e) {
    res.json(error('评论失败'));
  }
});

module.exports = router;