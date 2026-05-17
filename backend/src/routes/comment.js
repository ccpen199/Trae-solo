const express = require('express');
const db = require('../database/db');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { successResponse, errorResponse } = require('../utils');

const router = express.Router();

router.get('/list/:videoId', optionalAuth, async (req, res) => {
  try {
    const { videoId } = req.params;
    const { page = 1, limit = 20, sort = 'hot' } = req.query;
    const offset = (page - 1) * limit;

    const orderBy = sort === 'hot' ? 'c.like_count DESC' : 'c.created_at DESC';

    const comments = db.prepare(`
      SELECT c.*, u.username, u.avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.video_id = ? AND c.parent_id = 0
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `).all(videoId, parseInt(limit), parseInt(offset));

    const total = db.prepare('SELECT COUNT(*) as count FROM comments WHERE video_id = ? AND parent_id = 0').get(videoId);

    const commentIds = comments.map(c => c.id);
    let replies = [];
    if (commentIds.length > 0) {
      const placeholders = commentIds.map(() => '?').join(',');
      replies = db.prepare(`
        SELECT c.*, u.username, u.avatar, ru.username as reply_to_username
        FROM comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN users ru ON c.reply_to_user_id = ru.id
        WHERE c.parent_id IN (${placeholders})
        ORDER BY c.created_at ASC
      `).all(...commentIds);
    }

    const isLikedMap = {};
    if (req.user) {
      const allCommentIds = [...commentIds, ...replies.map(r => r.id)];
      if (allCommentIds.length > 0) {
        const placeholders = allCommentIds.map(() => '?').join(',');
        const liked = db.prepare(`
          SELECT comment_id FROM user_likes WHERE user_id = ? AND comment_id IN (${placeholders})
        `).all(req.user.id, ...allCommentIds);
        liked.forEach(l => isLikedMap[l.comment_id] = true);
      }
    }

    const commentsWithReplies = comments.map(c => ({
      ...c,
      isLiked: !!isLikedMap[c.id],
      replies: replies.filter(r => r.parent_id === c.id).map(r => ({
        ...r,
        isLiked: !!isLikedMap[r.id]
      }))
    }));

    successResponse(res, {
      comments: commentsWithReplies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total.count,
        hasMore: page * limit < total.count
      }
    });
  } catch (error) {
    console.error('获取评论列表失败:', error);
    errorResponse(res, '获取评论列表失败');
  }
});

router.post('/publish/:videoId', authMiddleware, async (req, res) => {
  try {
    const { videoId } = req.params;
    const { content, parent_id = 0, reply_to_user_id } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return errorResponse(res, '评论内容不能为空');
    }

    const result = db.prepare(`
      INSERT INTO comments (video_id, user_id, parent_id, reply_to_user_id, content)
      VALUES (?, ?, ?, ?, ?)
    `).run(videoId, userId, parent_id, reply_to_user_id || null, content.trim());

    db.prepare(`
      UPDATE videos SET comment_count = comment_count + 1 WHERE id = ?
    `).run(videoId);

    if (parent_id == 0 && reply_to_user_id && reply_to_user_id != userId) {
      db.prepare(`
        INSERT INTO notifications (user_id, type, from_user_id, video_id, comment_id, content)
        VALUES (?, 'reply', ?, ?, ?, ?)
      `).run(reply_to_user_id, userId, videoId, result.lastInsertRowid, content.trim());
    }

    successResponse(res, { id: result.lastInsertRowid }, '评论发布成功');
  } catch (error) {
    console.error('发布评论失败:', error);
    errorResponse(res, '发布评论失败');
  }
});

router.post('/like/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = db.prepare('SELECT * FROM user_likes WHERE user_id = ? AND comment_id = ?').get(userId, id);

    if (existing) {
      db.prepare('DELETE FROM user_likes WHERE id = ?').run(existing.id);
      db.prepare('UPDATE comments SET like_count = MAX(0, like_count - 1) WHERE id = ?').run(id);
      successResponse(res, { liked: false }, '已取消点赞');
    } else {
      db.prepare('INSERT INTO user_likes (user_id, comment_id) VALUES (?, ?)').run(userId, id);
      db.prepare('UPDATE comments SET like_count = like_count + 1 WHERE id = ?').run(id);
      successResponse(res, { liked: true }, '点赞成功');
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
    errorResponse(res, '操作失败');
  }
});

router.post('/dislike/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    db.prepare('UPDATE comments SET dislike_count = dislike_count + 1 WHERE id = ?').run(id);
    
    successResponse(res, null, '操作成功');
  } catch (error) {
    console.error('点踩操作失败:', error);
    errorResponse(res, '操作失败');
  }
});

router.post('/report/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return errorResponse(res, '请选择举报原因');
    }

    successResponse(res, null, '举报成功，我们会尽快处理');
  } catch (error) {
    console.error('举报失败:', error);
    errorResponse(res, '举报失败');
  }
});

module.exports = router;
