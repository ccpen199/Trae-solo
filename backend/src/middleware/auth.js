const jwt = require('jsonwebtoken');
const db = require('../database/db');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: '未提供认证令牌' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.get('SELECT id, username, role FROM users WHERE id = ?', [decoded.userId]);

    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('认证错误:', error);
    return res.status(401).json({ message: '令牌无效或已过期' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '需要管理员权限' });
  }
  next();
};

const readerMiddleware = (req, res, next) => {
  if (req.user.role !== 'reader') {
    return res.status(403).json({ message: '需要读者权限' });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware, readerMiddleware };
