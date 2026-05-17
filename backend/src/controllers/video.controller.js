const { db } = require('../models/db');

const getRecommendVideos = (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const currentUserId = req.user?.id;

    let sql = `
      SELECT 
        v.*,
        u.nickname,
        u.avatar
    `;

    const params = [];

    if (currentUserId) {
      sql += `,
        EXISTS(SELECT 1 FROM likes l WHERE l.user_id = ? AND l.video_id = v.id) as is_liked,
        EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = ? AND f.following_id = v.user_id) as is_following
      `;
      params.push(currentUserId, currentUserId);
    }

    sql += `
      FROM videos v
      JOIN users u ON v.user_id = u.id
      ORDER BY RANDOM()
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), offset);

    const videos = db.prepare(sql);
    const videoList = videos.all(...params);

    res.json({
      success: true,
      data: {
        list: videoList,
        total: videoList.length,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取推荐视频错误:', error);
    res.status(500).json({
      success: false,
      message: '获取推荐视频失败',
      error: error.message
    });
  }
};

const getNearbyVideos = (req, res) => {
  try {
    const { city, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        v.*,
        u.nickname,
        u.avatar
      FROM videos v
      JOIN users u ON v.user_id = u.id
    `;

    const params = [];

    if (city) {
      query += ' WHERE v.city = ?';
      params.push(city);
    }

    query += ' ORDER BY v.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const videos = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: {
        list: videos,
        total: videos.length,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取附近视频错误:', error);
    res.status(500).json({
      success: false,
      message: '获取附近视频失败',
      error: error.message
    });
  }
};

const getFollowingVideos = (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const videos = db.prepare(`
      SELECT 
        v.*,
        u.nickname,
        u.avatar,
        EXISTS(SELECT 1 FROM likes l WHERE l.user_id = ? AND l.video_id = v.id) as is_liked,
        1 as is_following
      FROM videos v
      JOIN users u ON v.user_id = u.id
      JOIN follows f ON f.following_id = v.user_id
      WHERE f.follower_id = ?
      ORDER BY v.created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, userId, parseInt(limit), offset);

    res.json({
      success: true,
      data: {
        list: videos,
        total: videos.length,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取关注视频错误:', error);
    res.status(500).json({
      success: false,
      message: '获取关注视频失败',
      error: error.message
    });
  }
};

const getVideoById = (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    let sql = `
      SELECT 
        v.*,
        u.nickname,
        u.avatar,
        u.bio
    `;

    const params = [];

    if (currentUserId) {
      sql += `,
        EXISTS(SELECT 1 FROM likes l WHERE l.user_id = ? AND l.video_id = v.id) as is_liked,
        EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = ? AND f.following_id = v.user_id) as is_following
      `;
      params.push(currentUserId, currentUserId);
    }

    sql += `
      FROM videos v
      JOIN users u ON v.user_id = u.id
      WHERE v.id = ?
    `;

    params.push(parseInt(id));

    const video = db.prepare(sql);
    const videoData = video.get(...params);

    if (!videoData) {
      return res.status(404).json({
        success: false,
        message: '视频不存在'
      });
    }

    db.prepare('UPDATE videos SET view_count = view_count + 1 WHERE id = ?').run(id);

    res.json({
      success: true,
      data: videoData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取视频详情失败'
    });
  }
};

const uploadVideo = (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, city, duration } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传视频文件'
      });
    }

    const videoUrl = `/uploads/${req.file.filename}`;

    const stmt = db.prepare(`
      INSERT INTO videos (user_id, title, description, video_url, city, duration)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(userId, title || '', description || '', videoUrl, city || '', duration || 0);

    const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(result.lastInsertRowid);

    res.json({
      success: true,
      message: '视频上传成功',
      data: video
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '视频上传失败'
    });
  }
};

const getUserVideos = (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const videos = db.prepare(`
      SELECT * FROM videos 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(parseInt(userId), parseInt(limit), offset);

    res.json({
      success: true,
      data: {
        list: videos,
        total: videos.length,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户视频失败'
    });
  }
};

const likeVideo = (req, res) => {
  try {
    const userId = req.user.id;
    const videoId = parseInt(req.params.id);

    const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: '视频不存在'
      });
    }

    const existingLike = db.prepare('SELECT * FROM likes WHERE user_id = ? AND video_id = ?').get(userId, videoId);

    if (existingLike) {
      return res.status(400).json({
        success: false,
        message: '已经点赞该视频'
      });
    }

    db.prepare('INSERT INTO likes (user_id, video_id) VALUES (?, ?)').run(userId, videoId);
    db.prepare('UPDATE videos SET like_count = like_count + 1 WHERE id = ?').run(videoId);

    res.json({
      success: true,
      message: '点赞成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '点赞失败'
    });
  }
};

const unlikeVideo = (req, res) => {
  try {
    const userId = req.user.id;
    const videoId = parseInt(req.params.id);

    const existingLike = db.prepare('SELECT * FROM likes WHERE user_id = ? AND video_id = ?').get(userId, videoId);

    if (!existingLike) {
      return res.status(400).json({
        success: false,
        message: '未点赞该视频'
      });
    }

    db.prepare('DELETE FROM likes WHERE user_id = ? AND video_id = ?').run(userId, videoId);
    db.prepare('UPDATE videos SET like_count = like_count - 1 WHERE id = ?').run(videoId);

    res.json({
      success: true,
      message: '取消点赞成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '取消点赞失败'
    });
  }
};

module.exports = {
  getRecommendVideos,
  getNearbyVideos,
  getFollowingVideos,
  getVideoById,
  uploadVideo,
  getUserVideos,
  likeVideo,
  unlikeVideo
};
