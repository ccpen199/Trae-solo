const jwt = require('jsonwebtoken');
const { db } = require('../models/db');

const JWT_SECRET = 'travel-secret-key-2024';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token无效' });
    }
    
    const dbUser = db.prepare('SELECT id, username, nickname, avatar FROM users WHERE id = ?').get(user.userId);
    if (!dbUser) {
      return res.status(403).json({ error: '用户不存在' });
    }
    
    req.user = dbUser;
    next();
  });
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        const dbUser = db.prepare('SELECT id, username, nickname, avatar FROM users WHERE id = ?').get(user.userId);
        if (dbUser) {
          req.user = dbUser;
        }
      }
      next();
    });
  } else {
    next();
  }
}

module.exports = { authenticateToken, optionalAuth, JWT_SECRET };
