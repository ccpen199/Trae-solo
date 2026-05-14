const express = require('express');
const { db } = require('../db');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

const router = express.Router();

const createNotification = async (db, { userId, type, fromUserId, targetType, targetId, title, content }) => {
  const now = Date.now();
  await db.prepare(`
    INSERT INTO messages (user_id, type, from_user_id, target_type, target_id, title, content, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(userId, type, fromUserId || null, targetType || null, targetId || null, title || '', content || '', 0, now);
};

const formatTags = (tags) => {
  if (!tags) return '';
  if (Array.isArray(tags)) return tags.join(',');
  return String(tags);
};

const parseTags = (tagsStr) => {
  if (!tagsStr) return [];
  return tagsStr.split(',').filter(t => t.trim());
};

router.get('/', optionalAuthMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, categoryId, keyword, sort = 'new' } = req.query;
    const currentUserId = req.user?.id;
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    let whereClause = 'a.status = 1';
    const params = [];

    if (categoryId) {
      whereClause += ' AND a.category_id = ?';
      params.push(categoryId);
    }

    if (keyword) {
      whereClause += ' AND (a.title LIKE ? OR a.summary LIKE ? OR a.content LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    let orderBy = 'a.created_at DESC';
    if (sort === 'hot') {
      orderBy = '(a.views + a.comments_count * 5 + a.likes_count * 3 + a.sort_weight * 10) DESC, a.created_at DESC';
    } else if (sort === 'recommended') {
      whereClause += ' AND a.is_recommended = 1';
      orderBy = 'a.sort_weight DESC, a.created_at DESC';
    }

    const countSql = `SELECT COUNT(*) as total FROM articles a WHERE ${whereClause}`;
    const totalResult = await db.prepare(countSql).get(...params);
    const total = totalResult.total;

    const sql = `
      SELECT a.*, u.nickname as author_name, u.avatar as author_avatar,
             c.name as category_name
      FROM articles a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const articles = await db.prepare(sql).all(...params);

    const result = articles.map(a => ({
      ...a,
      tags: parseTags(a.tags)
    }));

    res.json({
      success: true,
      data: {
        list: result,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({
      success: false,
      message: '获取文章列表失败'
    });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, content, summary, cover, categoryId, tags } = req.body;
    const now = Date.now();

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '文章标题不能为空'
      });
    }

    const result = await db.prepare(`
      INSERT INTO articles (user_id, title, content, summary, cover, category_id, tags, views, likes_count, comments_count, status, is_recommended, sort_weight, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      title.trim(),
      content || '',
      summary || '',
      cover || null,
      categoryId || null,
      formatTags(tags),
      0, 0, 0, 1, 0, 0,
      now, now
    );

    const article = await db.prepare(`
      SELECT a.*, u.nickname as author_name, u.avatar as author_avatar,
             c.name as category_name
      FROM articles a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.id = ?
    `).get(result.lastID);

    res.json({
      success: true,
      message: '发布成功',
      data: {
        article: {
          ...article,
          tags: parseTags(article.tags)
        }
      }
    });
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({
      success: false,
      message: '发布失败，请稍后重试'
    });
  }
});

router.get('/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    await db.prepare('UPDATE articles SET views = views + 1 WHERE id = ?').run(id);

    const article = await db.prepare(`
      SELECT a.*, u.nickname as author_name, u.avatar as author_avatar,
             c.name as category_name
      FROM articles a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.id = ? AND a.status = 1
    `).get(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      });
    }

    let isLiked = false;
    let isFavorited = false;
    if (currentUserId) {
      const like = await db.prepare('SELECT id FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?').get(currentUserId, 'article', id);
      const favorite = await db.prepare('SELECT id FROM favorites WHERE user_id = ? AND target_type = ? AND target_id = ?').get(currentUserId, 'article', id);
      isLiked = !!like;
      isFavorited = !!favorite;
    }

    res.json({
      success: true,
      data: {
        ...article,
        tags: parseTags(article.tags),
        isLiked,
        isFavorited
      }
    });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({
      success: false,
      message: '获取文章详情失败'
    });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, summary, cover, categoryId, tags } = req.body;

    const article = await db.prepare('SELECT * FROM articles WHERE id = ?').get(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      });
    }

    if (article.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限修改此文章'
      });
    }

    const updateFields = [];
    const values = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      values.push(title);
    }
    if (content !== undefined) {
      updateFields.push('content = ?');
      values.push(content);
    }
    if (summary !== undefined) {
      updateFields.push('summary = ?');
      values.push(summary);
    }
    if (cover !== undefined) {
      updateFields.push('cover = ?');
      values.push(cover);
    }
    if (categoryId !== undefined) {
      updateFields.push('category_id = ?');
      values.push(categoryId);
    }
    if (tags !== undefined) {
      updateFields.push('tags = ?');
      values.push(formatTags(tags));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有可更新的字段'
      });
    }

    updateFields.push('updated_at = ?');
    values.push(Date.now());
    values.push(id);

    await db.prepare(`UPDATE articles SET ${updateFields.join(', ')} WHERE id = ?`).run(...values);

    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({
      success: false,
      message: '更新失败，请稍后重试'
    });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const article = await db.prepare('SELECT * FROM articles WHERE id = ?').get(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      });
    }

    if (article.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限删除此文章'
      });
    }

    await db.prepare('UPDATE articles SET status = 0, updated_at = ? WHERE id = ?').run(Date.now(), id);

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({
      success: false,
      message: '删除失败，请稍后重试'
    });
  }
});

router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const now = Date.now();

    const article = await db.prepare('SELECT id, user_id FROM articles WHERE id = ? AND status = 1').get(id);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      });
    }

    const existing = await db.prepare('SELECT id FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?').get(req.user.id, 'article', id);

    let liked = true;
    if (existing) {
      await db.prepare('DELETE FROM likes WHERE id = ?').run(existing.id);
      await db.prepare('UPDATE articles SET likes_count = MAX(0, likes_count - 1) WHERE id = ?').run(id);
      liked = false;
    } else {
      await db.prepare('INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (?, ?, ?, ?)').run(req.user.id, 'article', id, now);
      await db.prepare('UPDATE articles SET likes_count = likes_count + 1 WHERE id = ?').run(id);

      if (article.user_id !== req.user.id) {
        createNotification(db, {
          userId: article.user_id,
          type: 'like',
          fromUserId: req.user.id,
          targetType: 'article',
          targetId: id,
          title: '收到点赞',
          content: `${req.user.nickname || req.user.username} 点赞了你的文章`
        });
      }
    }

    const updated = await db.prepare('SELECT likes_count FROM articles WHERE id = ?').get(id);

    res.json({
      success: true,
      data: {
        liked,
        likesCount: updated.likes_count
      }
    });
  } catch (error) {
    console.error('Like article error:', error);
    res.status(500).json({
      success: false,
      message: '操作失败，请稍后重试'
    });
  }
});

router.post('/:id/favorite', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const now = Date.now();

    const article = await db.prepare('SELECT id FROM articles WHERE id = ? AND status = 1').get(id);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      });
    }

    const existing = await db.prepare('SELECT id FROM favorites WHERE user_id = ? AND target_type = ? AND target_id = ?').get(req.user.id, 'article', id);

    let favorited = true;
    if (existing) {
      await db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id);
      favorited = false;
    } else {
      await db.prepare('INSERT INTO favorites (user_id, target_type, target_id, created_at) VALUES (?, ?, ?, ?)').run(req.user.id, 'article', id, now);
    }

    res.json({
      success: true,
      data: {
        favorited
      }
    });
  } catch (error) {
    console.error('Favorite article error:', error);
    res.status(500).json({
      success: false,
      message: '操作失败，请稍后重试'
    });
  }
});

router.post('/:id/report', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const now = Date.now();

    const article = await db.prepare('SELECT id FROM articles WHERE id = ? AND status = 1').get(id);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      });
    }

    await db.prepare(`
      INSERT INTO reports (reporter_id, target_type, target_id, reason, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, 'article', id, reason || '', 0, now);

    res.json({
      success: true,
      message: '举报已提交，我们会尽快处理'
    });
  } catch (error) {
    console.error('Report article error:', error);
    res.status(500).json({
      success: false,
      message: '举报失败，请稍后重试'
    });
  }
});

module.exports = router;
