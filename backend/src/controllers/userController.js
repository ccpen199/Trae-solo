const db = require('../config/database');
const { success, error } = require('../utils/response');

const getProfile = (req, res) => {
  const userId = req.user.id;
  
  try {
    const user = db.prepare('SELECT id, username, nickname, avatar, bio, phone, email, created_at FROM users WHERE id = ?').get(userId);
    res.json(success(user));
  } catch (err) {
    console.error('获取用户信息失败:', err);
    res.status(500).json(error('获取用户信息失败'));
  }
};

const updateProfile = (req, res) => {
  const userId = req.user.id;
  const { nickname, bio, avatar } = req.body;

  try {
    db.prepare('UPDATE users SET nickname = ?, bio = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(nickname, bio, avatar, userId);
    res.json(success(null, '更新成功'));
  } catch (err) {
    console.error('更新用户信息失败:', err);
    res.status(500).json(error('更新失败'));
  }
};

module.exports = { getProfile, updateProfile };