const jwt = require('jsonwebtoken');
const db = require('../database/db');

const auth = (roles = []) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: '未授权访问' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId);
      
      if (!user || user.status !== 1) {
        return res.status(401).json({ error: '用户不存在或已被禁用' });
      }

      if (roles.length > 0 && !roles.includes(user.role)) {
        return res.status(403).json({ error: '权限不足' });
      }

      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ error: '无效的token' });
    }
  };
};

module.exports = auth;
