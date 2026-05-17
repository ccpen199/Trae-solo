const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { category, page = 1, limit = 20, isOfficial } = req.query;

    let query = `
      SELECT p.*, u.nickname as author_name, u.avatar as author_avatar
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;
    let params = [];

    if (category) {
      query += ' AND p.category = ?';
      params.push(category);
    }

    if (isOfficial !== undefined) {
      query += ' AND p.is_official = ?';
      params.push(isOfficial === 'true' ? 1 : 0);
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const posts = await db.all(query, params);

    const countResult = await db.get(
      'SELECT COUNT(*) as total FROM posts WHERE 1=1'
    );

    res.json({
      success: true,
      data: {
        posts,
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      },
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取帖子列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const post = await db.get(`
      SELECT p.*, u.nickname as author_name, u.avatar as author_avatar
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [id]);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }

    await db.run(
      'UPDATE posts SET views_count = views_count + 1 WHERE id = ?',
      [id]
    );

    const comments = await db.all(`
      SELECT c.*, u.nickname as author_name, u.avatar as author_avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at DESC
    `, [id]);

    res.json({
      success: true,
      data: {
        post: { ...post, views_count: post.views_count + 1 },
        comments
      },
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取帖子详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, content, category } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        message: '标题、内容和分类不能为空'
      });
    }

    const result = await db.run(
      'INSERT INTO posts (user_id, title, content, category) VALUES (?, ?, ?, ?)',
      [userId, title, content, category]
    );

    res.json({
      success: true,
      data: { id: result.id },
      message: '发布成功'
    });
  } catch (error) {
    console.error('发布帖子错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: '评论内容不能为空'
      });
    }

    const post = await db.get('SELECT id FROM posts WHERE id = ?', [id]);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }

    const result = await db.run(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [id, userId, content]
    );

    await db.run(
      'UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      data: { id: result.id },
      message: '评论成功'
    });
  } catch (error) {
    console.error('发布评论错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await db.run(
      'UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: '点赞成功'
    });
  } catch (error) {
    console.error('点赞错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

module.exports = router;
