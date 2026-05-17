const express = require('express');
const { get, all, run } = require('../database');
const { optionalAuth, authenticateToken } = require('../middleware/auth');

const router = express.Router();

const categories = [
  { id: 'expert-lectures', name: '专家讲座', icon: '🎓' },
  { id: 'pet-knowledge', name: '萌宠知识', icon: '📚' },
  { id: 'newbie-guide', name: '新手养宠', icon: '🐣' },
  { id: 'sharing', name: '交流分享', icon: '💬' },
  { id: 'activities', name: '线下活动', icon: '🎉' },
  { id: 'health-diet', name: '健康饮食', icon: '🥗' },
  { id: 'breeding', name: '发情繁殖', icon: '💕' },
  { id: 'behavior', name: '行为纠正', icon: '🎯' },
];

router.get('/categories', (req, res) => {
  res.json({ success: true, data: categories });
});

router.get('/posts', optionalAuth, async (req, res) => {
  try {
    const { category, keyword, page = 1, limit = 10 } = req.query;
    let sql = `
      SELECT p.*, u.nickname, u.avatar 
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      sql += ' AND p.category = ?';
      params.push(category);
    }
    if (keyword) {
      sql += ' AND (p.title LIKE ? OR p.content LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const offset = (page - 1) * limit;
    sql += ` ORDER BY p.is_pinned DESC, p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const posts = await all(sql, params);
    
    let countSql = 'SELECT COUNT(*) as count FROM community_posts WHERE 1=1';
    const countParams = [];
    if (category) {
      countSql += ' AND category = ?';
      countParams.push(category);
    }
    if (keyword) {
      countSql += ' AND (title LIKE ? OR content LIKE ?)';
      countParams.push(`%${keyword}%`, `%${keyword}%`);
    }
    const total = await get(countSql, countParams);

    res.json({ success: true, data: { list: posts, total: total.count, page: parseInt(page) } });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ success: false, message: '获取帖子列表失败' });
  }
});

router.get('/posts/:id', optionalAuth, async (req, res) => {
  try {
    const post = await get(`
      SELECT p.*, u.nickname, u.avatar 
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (!post) {
      return res.status(404).json({ success: false, message: '帖子不存在' });
    }

    await run('UPDATE community_posts SET views_count = views_count + 1 WHERE id = ?', [req.params.id]);

    const comments = await all(`
      SELECT c.*, u.nickname, u.avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at DESC
    `, [req.params.id]);

    let isLiked = false;
    if (req.user) {
      const like = await get('SELECT id FROM likes WHERE post_id = ? AND user_id = ?', [req.params.id, req.user.id]);
      isLiked = !!like;
    }

    res.json({ success: true, data: { ...post, comments, isLiked } });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ success: false, message: '获取帖子详情失败' });
  }
});

router.post('/posts', authenticateToken, async (req, res) => {
  try {
    const { category, title, content, images } = req.body;

    if (!category || !title || !content) {
      return res.status(400).json({ success: false, message: '分类、标题和内容不能为空' });
    }

    const result = await run(`
      INSERT INTO community_posts (user_id, category, title, content, images)
      VALUES (?, ?, ?, ?, ?)
    `, [req.user.id, category, title, content, images || '']);

    res.json({ success: true, data: { id: result.lastID }, message: '发布成功' });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ success: false, message: '发布失败' });
  }
});

router.post('/posts/:id/like', authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const existingLike = await get('SELECT id FROM likes WHERE post_id = ? AND user_id = ?', [postId, req.user.id]);

    if (existingLike) {
      await run('DELETE FROM likes WHERE id = ?', [existingLike.id]);
      await run('UPDATE community_posts SET likes_count = likes_count - 1 WHERE id = ?', [postId]);
      res.json({ success: true, data: { liked: false }, message: '取消点赞' });
    } else {
      await run('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [postId, req.user.id]);
      await run('UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = ?', [postId]);
      res.json({ success: true, data: { liked: true }, message: '点赞成功' });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ success: false, message: '操作失败' });
  }
});

router.post('/posts/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { content, parent_id } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: '评论内容不能为空' });
    }

    const result = await run(`
      INSERT INTO comments (post_id, user_id, content, parent_id)
      VALUES (?, ?, ?, ?)
    `, [req.params.id, req.user.id, content, parent_id || null]);

    await run('UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = ?', [req.params.id]);

    res.json({ success: true, data: { id: result.lastID }, message: '评论成功' });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ success: false, message: '评论失败' });
  }
});

module.exports = router;
