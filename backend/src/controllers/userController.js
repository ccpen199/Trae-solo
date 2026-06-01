const db = require('../database');

const getUserProfile = (req, res) => {
  try {
    const { id } = req.params;

    const user = db.prepare('SELECT id, username, avatar, bio, created_at FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const followingCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').get(id).count;
    const followerCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(id).count;
    const guideCount = db.prepare('SELECT COUNT(*) as count FROM guides WHERE user_id = ?').get(id).count;

    if (req.user) {
      const isFollowing = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.userId, id);
      user.is_following = !!isFollowing;
    }

    user.stats = {
      following: followingCount,
      followers: followerCount,
      guides: guideCount
    };

    res.json(user);
  } catch (error) {
    console.error('获取用户资料错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

const toggleFollow = (req, res) => {
  try {
    const { following_id } = req.body;
    const follower_id = req.user.userId;

    if (follower_id === following_id) {
      return res.status(400).json({ error: '不能关注自己' });
    }

    const existing = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(follower_id, following_id);

    if (existing) {
      db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(follower_id, following_id);
      res.json({ following: false, message: '已取消关注' });
    } else {
      db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(follower_id, following_id);
      res.json({ following: true, message: '关注成功' });
    }
  } catch (error) {
    console.error('关注操作错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

const getMyGuides = (req, res) => {
  try {
    const guides = db.prepare(`
      SELECT g.*, d.name as destination_name
      FROM guides g
      JOIN destinations d ON g.destination_id = d.id
      WHERE g.user_id = ?
      ORDER BY g.created_at DESC
    `).all(req.user.userId);

    guides.forEach(guide => {
      guide.tags = guide.tags ? JSON.parse(guide.tags) : [];
    });

    res.json(guides);
  } catch (error) {
    console.error('获取我的攻略错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

const getMyFavorites = (req, res) => {
  try {
    const favorites = db.prepare(`
      SELECT g.*, d.name as destination_name, u.username as author_name, u.avatar as author_avatar
      FROM favorites f
      JOIN guides g ON f.guide_id = g.id
      JOIN destinations d ON g.destination_id = d.id
      JOIN users u ON g.user_id = u.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).all(req.user.userId);

    favorites.forEach(guide => {
      guide.tags = guide.tags ? JSON.parse(guide.tags) : [];
    });

    res.json(favorites);
  } catch (error) {
    console.error('获取我的收藏错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

const getMyFollowing = (req, res) => {
  try {
    const following = db.prepare(`
      SELECT u.id, u.username, u.avatar, u.bio
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC
    `).all(req.user.userId);

    res.json(following);
  } catch (error) {
    console.error('获取我的关注错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

module.exports = { getUserProfile, toggleFollow, getMyGuides, getMyFavorites, getMyFollowing };
