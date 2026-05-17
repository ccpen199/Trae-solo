const { getDB } = require('../models/db');

async function getProfile(req, res) {
  try {
    const db = getDB();
    const user = db.prepare('SELECT id, phone, nickname, avatar, role, invite_code FROM users WHERE id = ?').get(req.user.id);
    const baby = db.prepare('SELECT * FROM babies WHERE user_id = ?').get(req.user.id);

    res.json({ success: true, user, baby });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ success: false, message: '获取用户信息失败' });
  }
}

async function updateProfile(req, res) {
  try {
    const { nickname, avatar } = req.body;

    const db = getDB();
    db.prepare('UPDATE users SET nickname = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(nickname || null, avatar || null, req.user.id);

    const user = db.prepare('SELECT id, phone, nickname, avatar, role FROM users WHERE id = ?').get(req.user.id);

    res.json({ success: true, message: '更新成功', user });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({ success: false, message: '更新用户信息失败' });
  }
}

module.exports = { getProfile, updateProfile };
