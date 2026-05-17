const { db } = require('../models/db');

const getComments = (req, res) => {
  try {
    const { videoId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const comments = db.prepare(`
      SELECT 
        c.*,
        u.nickname,
        u.avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.video_id = ?
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `).all(parseInt(videoId), parseInt(limit), offset);

    res.json({
      success: true,
      data: {
        list: comments,
        total: comments.length,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取评论失败'
    });
  }
};

const createComment = (req, res) => {
  try {
    const userId = req.user.id;
    const { videoId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '评论内容不能为空'
      });
    }

    const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(parseInt(videoId));
    if (!video) {
      return res.status(404).json({
        success: false,
        message: '视频不存在'
      });
    }

    const stmt = db.prepare('INSERT INTO comments (user_id, video_id, content) VALUES (?, ?, ?)');
    const result = stmt.run(userId, parseInt(videoId), content.trim());

    db.prepare('UPDATE videos SET comment_count = comment_count + 1 WHERE id = ?').run(videoId);

    const comment = db.prepare(`
      SELECT 
        c.*,
        u.nickname,
        u.avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    res.json({
      success: true,
      message: '评论成功',
      data: comment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '评论失败'
    });
  }
};

const deleteComment = (req, res) => {
  try {
    const userId = req.user.id;
    const { commentId } = req.params;

    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(parseInt(commentId));

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }

    if (comment.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权限删除该评论'
      });
    }

    db.prepare('DELETE FROM comments WHERE id = ?').run(parseInt(commentId));
    db.prepare('UPDATE videos SET comment_count = comment_count - 1 WHERE id = ?').run(comment.video_id);

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除失败'
    });
  }
};

module.exports = {
  getComments,
  createComment,
  deleteComment
};
