const { db } = require('../models/db');

const getProfile = (req, res) => {
  try {
    const userId = req.user.id;

    const user = db.prepare('SELECT id, phone, nickname, avatar, bio, city, created_at FROM users WHERE id = ?').get(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const followStats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = ?) as follower_count
    `).get(userId, userId);

    res.json({
      success: true,
      data: { ...user, ...followStats }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
};

const updateProfile = (req, res) => {
  try {
    const userId = req.user.id;
    const { nickname, bio, city } = req.body;

    let avatar = undefined;
    if (req.file) {
      avatar = `/uploads/${req.file.filename}`;
    }

    const fields = [];
    const values = [];

    if (nickname) { fields.push('nickname = ?'); values.push(nickname); }
    if (bio !== undefined) { fields.push('bio = ?'); values.push(bio); }
    if (city) { fields.push('city = ?'); values.push(city); }
    if (avatar) { fields.push('avatar = ?'); values.push(avatar); }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有要更新的内容'
      });
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    const user = db.prepare('SELECT id, phone, nickname, avatar, bio, city, created_at FROM users WHERE id = ?').get(userId);

    res.json({
      success: true,
      message: '更新成功',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新用户信息失败'
    });
  }
};

const getUserById = (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    const user = db.prepare('SELECT id, phone, nickname, avatar, bio, city, created_at FROM users WHERE id = ?').get(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const followStats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = ?) as follower_count
    `).get(id, id);

    let isFollowing = false;
    if (currentUserId) {
      const follow = db.prepare('SELECT * FROM follows WHERE follower_id = ? AND following_id = ?').get(currentUserId, id);
      isFollowing = !!follow;
    }

    const videoCount = db.prepare('SELECT COUNT(*) as count FROM videos WHERE user_id = ?').get(id).count;

    res.json({
      success: true,
      data: {
        ...user,
        ...followStats,
        video_count: videoCount,
        is_following: isFollowing
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
};

const followUser = (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = parseInt(req.params.id);

    if (followerId === followingId) {
      return res.status(400).json({
        success: false,
        message: '不能关注自己'
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(followingId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const existingFollow = db.prepare('SELECT * FROM follows WHERE follower_id = ? AND following_id = ?').get(followerId, followingId);

    if (existingFollow) {
      return res.status(400).json({
        success: false,
        message: '已经关注该用户'
      });
    }

    const stmt = db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)');
    stmt.run(followerId, followingId);

    res.json({
      success: true,
      message: '关注成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '关注失败'
    });
  }
};

const unfollowUser = (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = parseInt(req.params.id);

    const stmt = db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?');
    const result = stmt.run(followerId, followingId);

    if (result.changes === 0) {
      return res.status(400).json({
        success: false,
        message: '未关注该用户'
      });
    }

    res.json({
      success: true,
      message: '取消关注成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '取消关注失败'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getUserById,
  followUser,
  unfollowUser
};
