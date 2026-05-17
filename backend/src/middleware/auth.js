const jwt = require('jsonwebtoken');
const { get } = require('../database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: '未登录' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yiyichong_secret_key');
    const user = await get('SELECT id, username, nickname, avatar, role FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(403).json({ success: false, message: 'Token无效或已过期' });
  }
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yiyichong_secret_key');
    const user = await get('SELECT id, username, nickname, avatar, role FROM users WHERE id = ?', [decoded.userId]);
    
    if (user) {
      req.user = user;
    }
  } catch (error) {
    // Token invalid, but it's okay for optional auth
  }
  
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: '需要管理员权限' });
  }
};

module.exports = { authenticateToken, optionalAuth, requireAdmin };
