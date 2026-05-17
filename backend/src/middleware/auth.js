const jwt = require('jsonwebtoken');
const { getAsync } = require('../utils/db');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await getAsync('SELECT id, username, email, nickname, avatar FROM users WHERE id = ?', [decoded.userId]);
    
    if (user) {
      req.user = user;
    } else {
      req.user = null;
    }
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '需要登录才能访问此功能'
    });
  }
  next();
};

module.exports = { authenticateToken, requireAuth };
