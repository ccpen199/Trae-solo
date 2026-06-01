const express = require('express');
const db = require('../database');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/post/:postId', optionalAuth, (req, res) => {
  const { postId } = req.params;
  const { page = 1, limit = 20, author_only = false, bright_only = false } = req.query;
  const offset = (page - 1) * limit;

  const post = db.prepare('SELECT author_id FROM posts WHERE id = ?').get(postId);
  if (!post) {
    return res.status(404).json({ error: '帖子不存在' });
  }

  let query = `
    SELECT c.*, u.nickname as user_name, u.level as user_level, u.avatar as user_avatar
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ?
  `;
  const params = [postId];

  if (author_only === 'true') {
    query += ' AND c.user_id = ?';
    params.push(post.author_id);
  }

  if (bright_only === 'true') {
    query += ' AND c.is_bright = 1';
  }

  query += ' ORDER BY c.is_bright DESC, c.like_count DESC, c.created_at ASC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const comments = db.prepare(query).all(...params);

  let countQuery = 'SELECT COUNT(*) as total FROM comments WHERE post_id = ?';
  const countParams = [postId];

  if (author_only === 'true') {
    countQuery += ' AND user_id = ?';
    countParams.push(post.author_id);
  }

  if (bright_only === 'true') {
    countQuery += ' AND is_bright = 1';
  }

  const { total } = db.prepare(countQuery).get(...countParams);

  if (req.user) {
    const commentIds = comments.map(c => c.id);
    if (commentIds.length > 0) {
      const placeholders = commentIds.map(() => '?').join(',');
      const likes = db.prepare(`SELECT target_id FROM likes WHERE user_id = ? AND target_type = 'comment' AND target_id IN (${placeholders})`).all(req.user.id, ...commentIds);
      const likedIds = new Set(likes.map(l => l.target_id));
      comments.forEach(comment => {
        comment.is_liked = likedIds.has(comment.id);
      });
    }
  }

  const parentComments = comments.filter(c => c.parent_id === 0);
  const replyMap = {};
  comments.filter(c => c.parent_id > 0).forEach(reply => {
    if (!replyMap[reply.parent_id]) {
      replyMap[reply.parent_id] = [];
    }
    replyMap[reply.parent_id].push(reply);
  });

  parentComments.forEach(c => {
    c.replies = replyMap[c.id] || [];
  });

  res.json({ comments: parentComments, total, page: parseInt(page), limit: parseInt(limit) });
});

router.post('/', authenticate, (req, res) => {
  const { post_id, parent_id = 0, content } = req.body;

  if (!post_id || !content) {
    return res.status(400).json({ error: '帖子ID和内容不能为空' });
  }

  if (content.length < 2) {
    return res.status(400).json({ error: '评论内容至少需要2个字符' });
  }

  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(post_id);
  if (!post) {
    return res.status(404).json({ error: '帖子不存在' });
  }

  const result = db.prepare('INSERT INTO comments (post_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)').run(post_id, req.user.id, parent_id, content);

  db.prepare('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?').run(post_id);
  db.prepare('UPDATE users SET experience = experience + 2, coins = coins + 1 WHERE id = ?').run(req.user.id);

  const comment = db.prepare(`
    SELECT c.*, u.nickname as user_name, u.level as user_level, u.avatar as user_avatar
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).get(result.lastInsertRowid);
  comment.replies = [];

  res.json({ comment });
});

router.post('/:id/like', authenticate, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
  if (!comment) {
    return res.status(404).json({ error: '评论不存在' });
  }

  const existingLike = db.prepare(`SELECT id FROM likes WHERE user_id = ? AND target_type = 'comment' AND target_id = ?`).get(userId, id);

  if (existingLike) {
    db.prepare(`DELETE FROM likes WHERE id = ?`).run(existingLike.id);
    db.prepare('UPDATE comments SET like_count = like_count - 1 WHERE id = ?').run(id);
    res.json({ liked: false, like_count: comment.like_count - 1 });
  } else {
    db.prepare(`INSERT INTO likes (user_id, target_type, target_id) VALUES (?, 'comment', ?)`).run(userId, id);
    db.prepare('UPDATE comments SET like_count = like_count + 1 WHERE id = ?').run(id);
    res.json({ liked: true, like_count: comment.like_count + 1 });
  }
});

module.exports = router;
