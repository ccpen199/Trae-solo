const express = require('express');
const authMiddleware = require('../middleware/auth');
const { runQuery, getQuery, allQuery } = require('../database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'moment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.get('/world', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const moments = await allQuery(
      `SELECT m.*, u.nickname, u.avatar,
        EXISTS(SELECT 1 FROM moment_likes ml WHERE ml.moment_id = m.id AND ml.user_id = ?) as is_liked
       FROM moments m
       JOIN users u ON m.user_id = u.id
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, parseInt(limit), offset]
    );

    for (const moment of moments) {
      await runQuery(
        'UPDATE moments SET views_count = views_count + 1 WHERE id = ?',
        [moment.id]
      );
      moment.views_count++;
    }

    res.json({
      success: true,
      data: moments
    });
  } catch (error) {
    console.error('获取世界随拍失败:', error);
    res.json({
      success: false,
      message: '获取世界随拍失败'
    });
  }
});

router.get('/my', authMiddleware, async (req, res) => {
  try {
    const moments = await allQuery(
      `SELECT m.*, u.nickname, u.avatar,
        EXISTS(SELECT 1 FROM moment_likes ml WHERE ml.moment_id = m.id AND ml.user_id = ?) as is_liked
       FROM moments m
       JOIN users u ON m.user_id = u.id
       WHERE m.user_id = ?
       ORDER BY m.created_at DESC`,
      [req.user.id, req.user.id]
    );

    res.json({
      success: true,
      data: moments
    });
  } catch (error) {
    console.error('获取我的随拍失败:', error);
    res.json({
      success: false,
      message: '获取我的随拍失败'
    });
  }
});

router.post('/', authMiddleware, upload.single('media'), async (req, res) => {
  try {
    const { type = 0, description } = req.body;
    let mediaUrl = req.body.mediaUrl;

    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
    }

    if (!mediaUrl) {
      return res.json({
        success: false,
        message: '请上传媒体文件'
      });
    }

    const result = await runQuery(
      'INSERT INTO moments (user_id, type, media_url, description) VALUES (?, ?, ?, ?)',
      [req.user.id, type, mediaUrl, description]
    );

    const moment = await getQuery(
      `SELECT m.*, u.nickname, u.avatar
       FROM moments m
       JOIN users u ON m.user_id = u.id
       WHERE m.id = ?`,
      [result.lastID]
    );

    res.json({
      success: true,
      message: '发布成功',
      data: moment
    });
  } catch (error) {
    console.error('发布随拍失败:', error);
    res.json({
      success: false,
      message: '发布随拍失败'
    });
  }
});

router.post('/:momentId/like', authMiddleware, async (req, res) => {
  try {
    const { momentId } = req.params;

    try {
      await runQuery(
        'INSERT INTO moment_likes (moment_id, user_id) VALUES (?, ?)',
        [momentId, req.user.id]
      );
      await runQuery(
        'UPDATE moments SET likes_count = likes_count + 1 WHERE id = ?',
        [momentId]
      );
    } catch (e) {
      await runQuery(
        'DELETE FROM moment_likes WHERE moment_id = ? AND user_id = ?',
        [momentId, req.user.id]
      );
      await runQuery(
        'UPDATE moments SET likes_count = likes_count - 1 WHERE id = ?',
        [momentId]
      );
    }

    const moment = await getQuery(
      `SELECT likes_count,
        EXISTS(SELECT 1 FROM moment_likes ml WHERE ml.moment_id = ? AND ml.user_id = ?) as is_liked
       FROM moments WHERE id = ?`,
      [momentId, req.user.id, momentId]
    );

    res.json({
      success: true,
      data: moment
    });
  } catch (error) {
    console.error('点赞失败:', error);
    res.json({
      success: false,
      message: '点赞失败'
    });
  }
});

router.get('/:momentId/comments', authMiddleware, async (req, res) => {
  try {
    const { momentId } = req.params;

    const comments = await allQuery(
      `SELECT mc.*, u.nickname, u.avatar
       FROM moment_comments mc
       JOIN users u ON mc.user_id = u.id
       WHERE mc.moment_id = ?
       ORDER BY mc.created_at DESC`,
      [momentId]
    );

    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('获取评论失败:', error);
    res.json({
      success: false,
      message: '获取评论失败'
    });
  }
});

router.post('/:momentId/comments', authMiddleware, async (req, res) => {
  try {
    const { momentId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.json({
        success: false,
        message: '请输入评论内容'
      });
    }

    await runQuery(
      'INSERT INTO moment_comments (moment_id, user_id, content) VALUES (?, ?, ?)',
      [momentId, req.user.id, content]
    );

    await runQuery(
      'UPDATE moments SET comments_count = comments_count + 1 WHERE id = ?',
      [momentId]
    );

    res.json({
      success: true,
      message: '评论成功'
    });
  } catch (error) {
    console.error('评论失败:', error);
    res.json({
      success: false,
      message: '评论失败'
    });
  }
});

module.exports = router;
