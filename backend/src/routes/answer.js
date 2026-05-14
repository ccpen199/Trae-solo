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

router.get('/question/:questionId', optionalAuthMiddleware, async (req, res) => {
  try {
    const { questionId } = req.params;
    const { page = 1, pageSize = 20 } = req.query;
    const currentUserId = req.user?.id;
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    const totalResult = await db.prepare('SELECT COUNT(*) as total FROM answers WHERE question_id = ? AND status = 1').get(questionId);
    const total = totalResult.total;

    const sql = `
      SELECT a.*, u.nickname as author_name, u.avatar as author_avatar
      FROM answers a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.question_id = ? AND a.status = 1
      ORDER BY a.is_accepted DESC, a.likes_count DESC, a.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const answers = await db.prepare(sql).all(questionId, limit, offset);

    res.json({
      success: true,
      data: {
        list: answers,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    console.error('Get answers error:', error);
    res.status(500).json({
      success: false,
      message: '获取回答列表失败'
    });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { questionId, content } = req.body;
    const now = Date.now();

    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: '问题ID不能为空'
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '回答内容不能为空'
      });
    }

    const question = await db.prepare('SELECT id, user_id, title FROM questions WHERE id = ? AND status = 1').get(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: '问题不存在'
      });
    }

    const result = await db.prepare(`
      INSERT INTO answers (question_id, user_id, content, likes_count, comments_count, is_accepted, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(questionId, req.user.id, content.trim(), 0, 0, 0, 1, now, now);

    await db.prepare('UPDATE questions SET answers_count = answers_count + 1, updated_at = ? WHERE id = ?').run(now, questionId);

    if (question.user_id !== req.user.id) {
      createNotification(db, {
        userId: question.user_id,
        type: 'answer',
        fromUserId: req.user.id,
        targetType: 'question',
        targetId: questionId,
        title: '收到新回答',
        content: `${req.user.nickname || req.user.username} 回答了你的问题：${question.title}`
      });
    }

    const answer = await db.prepare(`
      SELECT a.*, u.nickname as author_name, u.avatar as author_avatar
      FROM answers a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.id = ?
    `).get(result.lastID);

    res.json({
      success: true,
      message: '回答成功',
      data: { answer }
    });
  } catch (error) {
    console.error('Create answer error:', error);
    res.status(500).json({
      success: false,
      message: '回答失败，请稍后重试'
    });
  }
});

router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const now = Date.now();

    const answer = await db.prepare('SELECT id, user_id FROM answers WHERE id = ? AND status = 1').get(id);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: '回答不存在'
      });
    }

    const existing = await db.prepare('SELECT id FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?').get(req.user.id, 'answer', id);

    let liked = true;
    if (existing) {
      await db.prepare('DELETE FROM likes WHERE id = ?').run(existing.id);
      await db.prepare('UPDATE answers SET likes_count = MAX(0, likes_count - 1) WHERE id = ?').run(id);
      liked = false;
    } else {
      await db.prepare('INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (?, ?, ?, ?)').run(req.user.id, 'answer', id, now);
      await db.prepare('UPDATE answers SET likes_count = likes_count + 1 WHERE id = ?').run(id);

      if (answer.user_id !== req.user.id) {
        createNotification(db, {
          userId: answer.user_id,
          type: 'like',
          fromUserId: req.user.id,
          targetType: 'answer',
          targetId: id,
          title: '收到点赞',
          content: `${req.user.nickname || req.user.username} 点赞了你的回答`
        });
      }
    }

    const updated = await db.prepare('SELECT likes_count FROM answers WHERE id = ?').get(id);

    res.json({
      success: true,
      data: {
        liked,
        likesCount: updated.likes_count
      }
    });
  } catch (error) {
    console.error('Like answer error:', error);
    res.status(500).json({
      success: false,
      message: '操作失败，请稍后重试'
    });
  }
});

router.post('/:id/accept', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const now = Date.now();

    const answer = await db.prepare('SELECT id, question_id, user_id FROM answers WHERE id = ? AND status = 1').get(id);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: '回答不存在'
      });
    }

    const question = await db.prepare('SELECT id, user_id FROM questions WHERE id = ? AND status = 1').get(answer.question_id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: '问题不存在'
      });
    }

    if (question.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '只有问题作者可以采纳回答'
      });
    }

    await db.prepare('UPDATE answers SET is_accepted = 0 WHERE question_id = ?').run(answer.question_id);
    await db.prepare('UPDATE answers SET is_accepted = 1, updated_at = ? WHERE id = ?').run(now, id);

    if (answer.user_id !== req.user.id) {
      createNotification(db, {
        userId: answer.user_id,
        type: 'system',
        fromUserId: req.user.id,
        targetType: 'answer',
        targetId: id,
        title: '回答被采纳',
        content: `你的回答已被 ${req.user.nickname || req.user.username} 采纳`
      });
    }

    res.json({
      success: true,
      message: '采纳成功'
    });
  } catch (error) {
    console.error('Accept answer error:', error);
    res.status(500).json({
      success: false,
      message: '操作失败，请稍后重试'
    });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const answer = await db.prepare('SELECT id, question_id FROM answers WHERE id = ?').get(id);

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: '回答不存在'
      });
    }

    const question = await db.prepare('SELECT user_id FROM questions WHERE id = ?').get(answer.question_id);
    
    if (req.user.id !== answer.user_id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限删除此回答'
      });
    }

    await db.prepare('UPDATE answers SET status = 0, updated_at = ? WHERE id = ?').run(Date.now(), id);
    await db.prepare('UPDATE questions SET answers_count = MAX(0, answers_count - 1) WHERE id = ?').run(answer.question_id);

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('Delete answer error:', error);
    res.status(500).json({
      success: false,
      message: '删除失败，请稍后重试'
    });
  }
});

module.exports = router;
