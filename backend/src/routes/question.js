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

    let whereClause = 'q.status = 1';
    const params = [];

    if (categoryId) {
      whereClause += ' AND q.category_id = ?';
      params.push(categoryId);
    }

    if (keyword) {
      whereClause += ' AND (q.title LIKE ? OR q.content LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    let orderBy = 'q.created_at DESC';
    if (sort === 'hot') {
      orderBy = '(q.views + q.answers_count * 5 + q.likes_count * 3 + q.sort_weight * 10) DESC, q.created_at DESC';
    } else if (sort === 'recommended') {
      whereClause += ' AND q.is_recommended = 1';
      orderBy = 'q.sort_weight DESC, q.created_at DESC';
    }

    const countSql = `SELECT COUNT(*) as total FROM questions q WHERE ${whereClause}`;
    const totalResult = await db.prepare(countSql).get(...params);
    const total = totalResult.total;

    const sql = `
      SELECT q.*, u.nickname as author_name, u.avatar as author_avatar,
             c.name as category_name
      FROM questions q
      LEFT JOIN users u ON q.user_id = u.id
      LEFT JOIN categories c ON q.category_id = c.id
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const questions = await db.prepare(sql).all(...params);

    const result = questions.map(q => ({
      ...q,
      tags: parseTags(q.tags)
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
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: '获取问题列表失败'
    });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, content, categoryId, tags } = req.body;
    const now = Date.now();

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '问题标题不能为空'
      });
    }

    const result = await db.prepare(`
      INSERT INTO questions (user_id, title, content, category_id, tags, views, answers_count, likes_count, status, is_recommended, sort_weight, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      title.trim(),
      content || '',
      categoryId || null,
      formatTags(tags),
      0, 0, 0, 1, 0, 0,
      now, now
    );

    const question = await db.prepare(`
      SELECT q.*, u.nickname as author_name, u.avatar as author_avatar,
             c.name as category_name
      FROM questions q
      LEFT JOIN users u ON q.user_id = u.id
      LEFT JOIN categories c ON q.category_id = c.id
      WHERE q.id = ?
    `).get(result.lastID);

    res.json({
      success: true,
      message: '提问成功',
      data: {
        question: {
          ...question,
          tags: parseTags(question.tags)
        }
      }
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      message: '提问失败，请稍后重试'
    });
  }
});

router.get('/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    await db.prepare('UPDATE questions SET views = views + 1 WHERE id = ?').run(id);

    const question = await db.prepare(`
      SELECT q.*, u.nickname as author_name, u.avatar as author_avatar,
             c.name as category_name
      FROM questions q
      LEFT JOIN users u ON q.user_id = u.id
      LEFT JOIN categories c ON q.category_id = c.id
      WHERE q.id = ? AND q.status = 1
    `).get(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '问题不存在'
      });
    }

    let isLiked = false;
    let isFavorited = false;
    if (currentUserId) {
      const like = await db.prepare('SELECT id FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?').get(currentUserId, 'question', id);
      const favorite = await db.prepare('SELECT id FROM favorites WHERE user_id = ? AND target_type = ? AND target_id = ?').get(currentUserId, 'question', id);
      isLiked = !!like;
      isFavorited = !!favorite;
    }

    res.json({
      success: true,
      data: {
        ...question,
        tags: parseTags(question.tags),
        isLiked,
        isFavorited
      }
    });
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({
      success: false,
      message: '获取问题详情失败'
    });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, categoryId, tags } = req.body;

    const question = await db.prepare('SELECT * FROM questions WHERE id = ?').get(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '问题不存在'
      });
    }

    if (question.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限修改此问题'
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

    await db.prepare(`UPDATE questions SET ${updateFields.join(', ')} WHERE id = ?`).run(...values);

    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      message: '更新失败，请稍后重试'
    });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const question = await db.prepare('SELECT * FROM questions WHERE id = ?').get(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '问题不存在'
      });
    }

    if (question.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限删除此问题'
      });
    }

    await db.prepare('UPDATE questions SET status = 0, updated_at = ? WHERE id = ?').run(Date.now(), id);

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('Delete question error:', error);
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

    const question = await db.prepare('SELECT id, user_id FROM questions WHERE id = ? AND status = 1').get(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: '问题不存在'
      });
    }

    const existing = await db.prepare('SELECT id FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?').get(req.user.id, 'question', id);

    let liked = true;
    if (existing) {
      await db.prepare('DELETE FROM likes WHERE id = ?').run(existing.id);
      await db.prepare('UPDATE questions SET likes_count = MAX(0, likes_count - 1) WHERE id = ?').run(id);
      liked = false;
    } else {
      await db.prepare('INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (?, ?, ?, ?)').run(req.user.id, 'question', id, now);
      await db.prepare('UPDATE questions SET likes_count = likes_count + 1 WHERE id = ?').run(id);
      
      if (question.user_id !== req.user.id) {
        await createNotification(db, {
          userId: question.user_id,
          type: 'like',
          fromUserId: req.user.id,
          targetType: 'question',
          targetId: id,
          title: '收到点赞',
          content: `${req.user.nickname || req.user.username} 点赞了你的问题`
        });
      }
    }

    const updated = await db.prepare('SELECT likes_count FROM questions WHERE id = ?').get(id);

    res.json({
      success: true,
      data: {
        liked,
        likesCount: updated.likes_count
      }
    });
  } catch (error) {
    console.error('Like question error:', error);
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

    const question = await db.prepare('SELECT id FROM questions WHERE id = ? AND status = 1').get(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: '问题不存在'
      });
    }

    const existing = await db.prepare('SELECT id FROM favorites WHERE user_id = ? AND target_type = ? AND target_id = ?').get(req.user.id, 'question', id);

    let favorited = true;
    if (existing) {
      await db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id);
      favorited = false;
    } else {
      await db.prepare('INSERT INTO favorites (user_id, target_type, target_id, created_at) VALUES (?, ?, ?, ?)').run(req.user.id, 'question', id, now);
    }

    res.json({
      success: true,
      data: {
        favorited
      }
    });
  } catch (error) {
    console.error('Favorite question error:', error);
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

    const question = await db.prepare('SELECT id FROM questions WHERE id = ? AND status = 1').get(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: '问题不存在'
      });
    }

    await db.prepare(`
      INSERT INTO reports (reporter_id, target_type, target_id, reason, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, 'question', id, reason || '', 0, now);

    res.json({
      success: true,
      message: '举报已提交，我们会尽快处理'
    });
  } catch (error) {
    console.error('Report question error:', error);
    res.status(500).json({
      success: false,
      message: '举报失败，请稍后重试'
    });
  }
});

module.exports = router;
