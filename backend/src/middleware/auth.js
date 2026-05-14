const jwt = require('jsonwebtoken');
const db = require('../models/database');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ success: false, message: '未登录' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT id, username, phone FROM users WHERE id = ?').get(decoded.userId);

    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: '登录已过期' });
  }
};

const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = db.prepare('SELECT id, username, phone FROM users WHERE id = ?').get(decoded.userId);
      if (user) {
        req.user = user;
      }
    } catch (error) {
    }
  }
  next();
};

const logAction = (action) => {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode < 400) {
        try {
          db.prepare(`INSERT INTO coupon_logs (id, action, user_id, details) VALUES (?, ?, ?, ?)`).run(
            require('uuid').v4(),
            action,
            req.user?.id || null,
            JSON.stringify({ path: req.path, body: req.body, params: req.params })
          );
        } catch (error) {
          console.error('Log action error:', error);
        }
      }
    });
    next();
  };
};

module.exports = { authenticate, optionalAuth, logAction };
