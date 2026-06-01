const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null;
      return next();
    }
    req.user = user;
    next();
  });
};

const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: '需要登录' });
  }
  next();
};

module.exports = { authenticateToken, requireAuth };
