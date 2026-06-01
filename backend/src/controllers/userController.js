const { db } = require('../models/database');
const jwt = require('jsonwebtoken');

const login = (req, res) => {
  const { code, nickname, avatar, location } = req.body;
  const openid = 'mock_openid_' + Date.now();
  
  const user = db.prepare('SELECT * FROM users WHERE openid = ?').get(openid);
  
  if (user) {
    db.prepare('UPDATE users SET nickname = ?, avatar = ?, location = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(nickname || user.nickname, avatar || user.avatar, location || user.location, user.id);
    const token = jwt.sign({ userId: user.id, openid: user.openid }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ code: 200, msg: 'success', data: { token, user: { ...user, nickname, avatar } } });
  } else {
    const result = db.prepare('INSERT INTO users (openid, nickname, avatar, location) VALUES (?, ?, ?, ?)').run(openid, nickname || '游客', avatar || '', location || '');
    const userId = result.lastInsertRowid;
    const token = jwt.sign({ userId, openid }, process.env.JWT_SECRET, { expiresIn: '30d' });
    
    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    db.prepare('INSERT INTO user_coupons (user_id, coupon_id) VALUES (?, ?)').run(userId, 1);
    res.json({ code: 200, msg: 'success', data: { token, user: newUser } });
  }
};

const getUserInfo = (req, res) => {
  const userId = req.user.userId;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.json({ code: 401, msg: '用户不存在', data: null });
  }
  res.json({ code: 200, msg: 'success', data: user });
};

const updateUserInfo = (req, res) => {
  const userId = req.user.userId;
  const { nickname, avatar, phone, location } = req.body;
  
  db.prepare('UPDATE users SET nickname = ?, avatar = ?, phone = ?, location = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(nickname, avatar, phone, location, userId);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  res.json({ code: 200, msg: 'success', data: user });
};

const getCoupons = (req, res) => {
  const userId = req.user.userId;
  const { status } = req.query;
  
  let sql = `
    SELECT uc.*, c.name, c.type, c.value, c.min_amount 
    FROM user_coupons uc 
    LEFT JOIN coupons c ON uc.coupon_id = c.id 
    WHERE uc.user_id = ?
  `;
  const params = [userId];
  
  if (status !== undefined) {
    sql += ` AND uc.status = ?`;
    params.push(status);
  }
  
  const rows = db.prepare(sql).all(...params);
  res.json({ code: 200, msg: 'success', data: rows });
};

module.exports = { login, getUserInfo, updateUserInfo, getCoupons };
