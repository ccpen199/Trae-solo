const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 10));
    const offset = (page - 1) * pageSize;

    const videos = db.prepare(`
      SELECT 
        v.id,
        v.title,
        v.description,
        v.video_url,
        v.cover_url,
        v.duration,
        v.view_count,
        v.like_count,
        v.comment_count,
        v.share_count,
        v.created_at,
        u.id as user_id,
        u.username,
        u.avatar
      FROM videos v
      JOIN users u ON v.user_id = u.id
      WHERE v.status = 1
      ORDER BY v.created_at DESC
      LIMIT ? OFFSET ?
    `).all(pageSize, offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM videos WHERE status = 1').get().count;

    res.json({
      success: true,
      data: {
        list: videos,
        pagination: { page, pageSize, total }
      },
      message: '获取成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: '服务器错误: ' + error.message
    });
  }
});

router.get('/:id', (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    if (!videoId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '无效的视频ID'
      });
    }

    db.prepare('UPDATE videos SET view_count = view_count + 1 WHERE id = ?').run(videoId);

    const video = db.prepare(`
      SELECT 
        v.id,
        v.title,
        v.description,
        v.video_url,
        v.cover_url,
        v.duration,
        v.view_count,
        v.like_count,
        v.comment_count,
        v.share_count,
        v.created_at,
        u.id as user_id,
        u.username,
        u.avatar,
        u.bio
      FROM videos v
      JOIN users u ON v.user_id = u.id
      WHERE v.id = ? AND v.status = 1
    `).get(videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '视频不存在'
      });
    }

    res.json({
      success: true,
      data: video,
      message: '获取成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: '服务器错误: ' + error.message
    });
  }
});

router.post('/:id/like', (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const userId = parseInt(req.body.user_id) || 1;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '无效的视频ID'
      });
    }

    const existing = db.prepare('SELECT id FROM likes WHERE video_id = ? AND user_id = ?').get(videoId, userId);

    if (existing) {
      db.prepare('DELETE FROM likes WHERE video_id = ? AND user_id = ?').run(videoId, userId);
      db.prepare('UPDATE videos SET like_count = like_count - 1 WHERE id = ?').run(videoId);
      const video = db.prepare('SELECT like_count FROM videos WHERE id = ?').get(videoId);
      res.json({
        success: true,
        data: { liked: false, like_count: video.like_count },
        message: '取消点赞成功'
      });
    } else {
      db.prepare('INSERT INTO likes (video_id, user_id) VALUES (?, ?)').run(videoId, userId);
      db.prepare('UPDATE videos SET like_count = like_count + 1 WHERE id = ?').run(videoId);
      const video = db.prepare('SELECT like_count FROM videos WHERE id = ?').get(videoId);
      res.json({
        success: true,
        data: { liked: true, like_count: video.like_count },
        message: '点赞成功'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: '服务器错误: ' + error.message
    });
  }
});

router.get('/:id/comments', (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    if (!videoId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '无效的视频ID'
      });
    }

    const comments = db.prepare(`
      SELECT 
        c.id,
        c.content,
        c.like_count,
        c.created_at,
        u.id as user_id,
        u.username,
        u.avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.video_id = ? AND c.parent_id = 0
      ORDER BY c.created_at DESC
    `).all(videoId);

    res.json({
      success: true,
      data: comments,
      message: '获取成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: '服务器错误: ' + error.message
    });
  }
});

router.post('/:id/comments', (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const userId = parseInt(req.body.user_id) || 1;
    const content = req.body.content?.trim();

    if (!videoId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '无效的视频ID'
      });
    }

    if (!content) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '评论内容不能为空'
      });
    }

    const result = db.prepare(
      'INSERT INTO comments (video_id, user_id, content) VALUES (?, ?, ?)'
    ).run(videoId, userId, content);

    db.prepare('UPDATE videos SET comment_count = comment_count + 1 WHERE id = ?').run(videoId);

    const comment = db.prepare(`
      SELECT 
        c.id,
        c.content,
        c.like_count,
        c.created_at,
        u.id as user_id,
        u.username,
        u.avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    res.json({
      success: true,
      data: comment,
      message: '评论发布成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: '服务器错误: ' + error.message
    });
  }
});

module.exports = router;
