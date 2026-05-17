const jwt = require('jsonwebtoken');
const { queryOne } = require('../database');

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未登录，请先登录'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await queryOne('SELECT id, username, nickname, avatar, level, is_vip, is_anchor FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token无效，请重新登录'
    });
  }
};

const optionalAuthMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await queryOne('SELECT id, username, nickname, avatar, level, is_vip, is_anchor FROM users WHERE id = ?', [decoded.userId]);
      req.user = user || null;
    } catch (error) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware
};
