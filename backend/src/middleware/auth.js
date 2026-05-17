const jwt = require('jsonwebtoken');
const { getDB } = require('../models/db');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: '未登录，请先登录' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: '登录已过期，请重新登录' });
    }
    
    const db = getDB();
    const dbUser = db.prepare('SELECT id, phone, nickname, avatar, role FROM users WHERE id = ?').get(user.userId);
    
    if (!dbUser) {
      return res.status(403).json({ success: false, message: '用户不存在' });
    }
    
    req.user = dbUser;
    next();
  });
}

function requireBabyInfo(req, res, next) {
  const db = getDB();
  const baby = db.prepare('SELECT * FROM babies WHERE user_id = ?').get(req.user.id);
  
  if (!baby) {
    return res.status(400).json({ success: false, message: '请先填写宝宝信息', needBabyInfo: true });
  }
  
  req.baby = baby;
  next();
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: '无权限访问' });
  }
  next();
}

module.exports = { authenticateToken, requireBabyInfo, adminOnly };
