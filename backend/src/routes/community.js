import express from 'express';
import db from '../database.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/posts', (req, res) => {
  const { category, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT p.*, u.nickname, u.avatar
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.status = 1
  `;
  const params = [];

  if (category) {
    query += ' AND p.category = ?';
    params.push(category);
  }

  query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), offset);

  const posts = db.prepare(query).all(...params);

  const countQuery = category 
    ? 'SELECT COUNT(*) as total FROM posts WHERE status = 1 AND category = ?'
    : 'SELECT COUNT(*) as total FROM posts WHERE status = 1';
  const { total } = db.prepare(countQuery).get(category || []);

  res.json({
    success: true,
    data: {
      list: posts,
      total,
      page: Number(page),
      limit: Number(limit)
    }
  });
});

router.get('/posts/:id', (req, res) => {
  const { id } = req.params;
  
  db.prepare('UPDATE posts SET view_count = view_count + 1 WHERE id = ?').run(id);
  
  const post = db.prepare(`
    SELECT p.*, u.nickname, u.avatar
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(id);
  
  if (!post) {
    return res.status(404).json({ error: '帖子不存在' });
  }

  const comments = db.prepare(`
    SELECT c.*, u.nickname, u.avatar
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at DESC
  `).all(id);

  res.json({
    success: true,
    data: {
      ...post,
      comments
    }
  });
});

router.post('/posts/create', auth, (req, res) => {
  const userId = req.user.id;
  const { title, content, category = 'strategy' } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: '请填写标题和内容' });
  }

  const result = db.prepare('INSERT INTO posts (user_id, title, content, category) VALUES (?, ?, ?, ?)')
    .run(userId, title, content, category);

  res.json({
    success: true,
    message: '发布成功',
    post_id: result.lastInsertRowid
  });
});

router.post('/posts/like', auth, (req, res) => {
  const userId = req.user.id;
  const { post_id } = req.body;

  const existing = db.prepare('SELECT * FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?')
    .get(userId, 'post', post_id);

  if (existing) {
    db.prepare('DELETE FROM likes WHERE id = ?').run(existing.id);
    db.prepare('UPDATE posts SET like_count = like_count - 1 WHERE id = ?').run(post_id);
    res.json({ success: true, liked: false, message: '已取消点赞' });
  } else {
    db.prepare('INSERT INTO likes (user_id, target_type, target_id) VALUES (?, ?, ?)')
      .run(userId, 'post', post_id);
    db.prepare('UPDATE posts SET like_count = like_count + 1 WHERE id = ?').run(post_id);
    res.json({ success: true, liked: true, message: '点赞成功' });
  }
});

router.post('/comment/create', auth, (req, res) => {
  const userId = req.user.id;
  const { post_id, content } = req.body;

  if (!content) {
    return res.status(400).json({ error: '请输入评论内容' });
  }

  const result = db.prepare('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)')
    .run(post_id, userId, content);

  db.prepare('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?').run(post_id);

  res.json({
    success: true,
    message: '评论成功',
    comment_id: result.lastInsertRowid
  });
});

export default router;
