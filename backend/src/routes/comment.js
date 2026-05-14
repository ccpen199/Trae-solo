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

router.get('/', optionalAuthMiddleware, async (req, res) => {
  try {
    const { targetType, targetId, page = 1, pageSize = 20 } = req.query;
    const currentUserId = req.user?.id;
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    if (!targetType || !targetId) {
      return res.status(400).json({
        success: false,
        message: 'targetType 和 targetId 不能为空'
      });
    }

    const totalResult = await db.prepare('SELECT COUNT(*) as total FROM comments WHERE target_type = ? AND target_id = ? AND status = 1').get(targetType, targetId);
    const total = totalResult.total;

    const sql = `
      SELECT c.*, u.nickname as author_name, u.avatar as author_avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.target_type = ? AND c.target_id = ? AND c.status = 1 AND c.parent_id = 0
      ORDER BY c.likes_count DESC, c.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const comments = await db.prepare(sql).all(targetType, targetId, limit, offset);

    const parentIds = comments.map(c => c.id);
    let replies = [];
    if (parentIds.length > 0) {
      const placeholders = parentIds.map(() => '?').join(',');
      replies = await db.prepare(`
        SELECT c.*, u.nickname as author_name, u.avatar as author_avatar,
               ru.nickname as reply_to_name
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN users ru ON c.reply_to_user_id = ru.id
        WHERE c.status = 1 AND c.parent_id IN (${placeholders})
        ORDER BY c.created_at ASC
      `).all(...parentIds);
    }

    const repliesMap = {};
    for (const reply of replies) {
      if (!repliesMap[reply.parent_id]) {
        repliesMap[reply.parent_id] = [];
      }
      repliesMap[reply.parent_id].push(reply);
    }

    const result = comments.map(c => ({
      ...c,
      replies: repliesMap[c.id] || []
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
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: '获取评论列表失败'
    });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { targetType, targetId, content, parentId = 0, replyToUserId } = req.body;
    const now = Date.now();

    if (!targetType || !targetId) {
      return res.status(400).json({
        success: false,
        message: 'targetType 和 targetId 不能为空'
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '评论内容不能为空'
      });
    }

    let targetAuthorId = null;

    if (targetType === 'question') {
      const target = await db.prepare('SELECT user_id, title FROM questions WHERE id = ? AND status = 1').get(targetId);
      if (!target) {
        return res.status(404).json({
          success: false,
          message: '目标不存在'
        });
      }
      targetAuthorId = target.user_id;
      await db.prepare('UPDATE questions SET updated_at = ? WHERE id = ?').run(now, targetId);
    } else if (targetType === 'article') {
      const target = await db.prepare('SELECT user_id, title FROM articles WHERE id = ? AND status = 1').get(targetId);
      if (!target) {
        return res.status(404).json({
          success: false,
          message: '目标不存在'
        });
      }
      targetAuthorId = target.user_id;
      await db.prepare('UPDATE articles SET comments_count = comments_count + 1, updated_at = ? WHERE id = ?').run(now, targetId);
    } else if (targetType === 'answer') {
      const target = await db.prepare('SELECT user_id FROM answers WHERE id = ? AND status = 1').get(targetId);
      if (!target) {
        return res.status(404).json({
          success: false,
          message: '目标不存在'
        });
      }
      targetAuthorId = target.user_id;
      await db.prepare('UPDATE answers SET comments_count = comments_count + 1, updated_at = ? WHERE id = ?').run(now, targetId);
    }

    const result = await db.prepare(`
      INSERT INTO comments (target_type, target_id, user_id, content, parent_id, reply_to_user_id, likes_count, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(targetType, targetId, req.user.id, content.trim(), parentId, replyToUserId || null, 0, 1, now, now);

    if (targetAuthorId && targetAuthorId !== req.user.id) {
      createNotification(db, {
        userId: targetAuthorId,
        type: 'comment',
        fromUserId: req.user.id,
        targetType,
        targetId,
        title: '收到新评论',
        content: `${req.user.nickname || req.user.username} 评论了你的${targetType === 'question' ? '问题' : targetType === 'article' ? '文章' : '回答'}`
      });
    }

    if (replyToUserId && replyToUserId !== req.user.id && replyToUserId !== targetAuthorId) {
      createNotification(db, {
        userId: replyToUserId,
        type: 'comment',
        fromUserId: req.user.id,
        targetType,
        targetId,
        title: '收到新回复',
        content: `${req.user.nickname || req.user.username} 回复了你的评论`
      });
    }

    const comment = await db.prepare(`
      SELECT c.*, u.nickname as author_name, u.avatar as author_avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastID);

    res.json({
      success: true,
      message: '评论成功',
      data: { comment }
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: '评论失败，请稍后重试'
    });
  }
});

router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const now = Date.now();

    const comment = await db.prepare('SELECT id, user_id FROM comments WHERE id = ? AND status = 1').get(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }

    const existing = await db.prepare('SELECT id FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?').get(req.user.id, 'comment', id);

    let liked = true;
    if (existing) {
      await db.prepare('DELETE FROM likes WHERE id = ?').run(existing.id);
      await db.prepare('UPDATE comments SET likes_count = MAX(0, likes_count - 1) WHERE id = ?').run(id);
      liked = false;
    } else {
      await db.prepare('INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (?, ?, ?, ?)').run(req.user.id, 'comment', id, now);
      await db.prepare('UPDATE comments SET likes_count = likes_count + 1 WHERE id = ?').run(id);
    }

    const updated = await db.prepare('SELECT likes_count FROM comments WHERE id = ?').get(id);

    res.json({
      success: true,
      data: {
        liked,
        likesCount: updated.likes_count
      }
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({
      success: false,
      message: '操作失败，请稍后重试'
    });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await db.prepare('SELECT * FROM comments WHERE id = ?').get(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }

    if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限删除此评论'
      });
    }

    await db.prepare('UPDATE comments SET status = 0, updated_at = ? WHERE id = ?').run(Date.now(), id);

    if (comment.target_type === 'article') {
      await db.prepare('UPDATE articles SET comments_count = MAX(0, comments_count - 1) WHERE id = ?').run(comment.target_id);
    } else if (comment.target_type === 'answer') {
      await db.prepare('UPDATE answers SET comments_count = MAX(0, comments_count - 1) WHERE id = ?').run(comment.target_id);
    }

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: '删除失败，请稍后重试'
    });
  }
});

module.exports = router;
