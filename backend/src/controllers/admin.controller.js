const { db } = require('../models/db');

const getStats = (req, res) => {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const videoCount = db.prepare('SELECT COUNT(*) as count FROM videos').get();
    const commentCount = db.prepare('SELECT COUNT(*) as count FROM comments').get();
    const likeCount = db.prepare('SELECT COUNT(*) as count FROM likes').get();

    res.json({
      success: true,
      data: {
        user_count: userCount.count,
        video_count: videoCount.count,
        comment_count: commentCount.count,
        like_count: likeCount.count
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取统计数据失败'
    });
  }
};

const getUsers = (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const users = db.prepare(`
      SELECT id, phone, nickname, avatar, bio, city, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(parseInt(limit), offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM users').get();

    res.json({
      success: true,
      data: {
        list: users,
        total: total.count,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    });
  }
};

const getVideos = (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const videos = db.prepare(`
      SELECT v.*, u.nickname, u.avatar
      FROM videos v
      JOIN users u ON v.user_id = u.id
      ORDER BY v.created_at DESC
      LIMIT ? OFFSET ?
    `).all(parseInt(limit), offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM videos').get();

    res.json({
      success: true,
      data: {
        list: videos,
        total: total.count,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取视频列表失败'
    });
  }
};

const deleteVideo = (req, res) => {
  try {
    const { id } = req.params;

    db.prepare('BEGIN TRANSACTION').run();

    db.prepare('DELETE FROM comments WHERE video_id = ?').run(id);
    db.prepare('DELETE FROM likes WHERE video_id = ?').run(id);
    db.prepare('DELETE FROM videos WHERE id = ?').run(id);

    db.prepare('COMMIT').run();

    res.json({
      success: true,
      message: '删除视频成功'
    });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({
      success: false,
      message: '删除视频失败'
    });
  }
};

module.exports = {
  getStats,
  getUsers,
  getVideos,
  deleteVideo
};
