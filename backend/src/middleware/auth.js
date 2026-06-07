const jwt = require('jsonwebtoken');
const db = require('../db');

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET || 'default_secret', (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      const dbUser = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(user.id);
      if (!dbUser) {
        return res.sendStatus(401);
      }
      req.user = dbUser;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.sendStatus(401);
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
};

module.exports = { authenticateJWT, requireRole };
